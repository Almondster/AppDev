/**
 * Centralized API client for the CREATECH web platform.
 *
 * Features:
 * - In-memory request cache with TTL (avoids redundant GET calls)
 * - Request deduplication (identical concurrent GETs share a single fetch)
 * - Automatic 401 handling (clears token + redirects to login)
 * - Retry with exponential back-off for network errors
 * - AbortController support for component unmounts
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// ── Token helpers ──────────────────────────────────────────────────────────

const TOKEN_KEY = 'createch_token';
const USER_KEY  = 'createch_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const logout = () => {
  clearToken();
  clearAllCache();
  window.location.href = '/login';
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// ── Cache layer ────────────────────────────────────────────────────────────

const cache = new Map();            // key → { data, timestamp }
const inflight = new Map();         // key → Promise  (deduplication)
const DEFAULT_TTL = 30_000;         // 30 seconds cache for GET requests
const SHORT_TTL  = 10_000;         // 10s for fast-changing data
const LONG_TTL   = 120_000;        // 2 min for mostly-static data

// Endpoint-specific cache TTLs
const ENDPOINT_TTL = {
  '/categories/': LONG_TTL,
  '/users/':      SHORT_TTL,
  '/orders/':     SHORT_TTL,
  '/services/':   DEFAULT_TTL,
  '/messages/':   SHORT_TTL,
};

function getCacheTTL(endpoint) {
  for (const [pattern, ttl] of Object.entries(ENDPOINT_TTL)) {
    if (endpoint.startsWith(pattern)) return ttl;
  }
  return DEFAULT_TTL;
}

function buildCacheKey(endpoint, params) {
  const sorted = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  return `${endpoint}::${sorted}`;
}

export function invalidateCache(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export function clearAllCache() {
  cache.clear();
}

// ── Generic fetcher ────────────────────────────────────────────────────────

const MAX_RETRIES = 2;

async function request(endpoint, { method = 'GET', body, params, auth = true, signal, skipCache = false } = {}) {
  const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }

  const urlStr = url.toString();

  // ── Cache hit for GET ──
  if (method === 'GET' && !skipCache) {
    const cacheKey = buildCacheKey(endpoint, params);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < getCacheTTL(endpoint)) {
      return cached.data;
    }

    // ── Deduplication: if same request is already in-flight, reuse it ──
    if (inflight.has(cacheKey)) {
      return inflight.get(cacheKey);
    }
  }

  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  };

  // ── Execute with retry ──
  const doFetch = async (attempt = 0) => {
    try {
      const res = await fetch(urlStr, fetchOptions);

      if (res.status === 204) return null;

      // Handle 401 — token expired
      if (res.status === 401 && auth) {
        clearToken();
        // Emit a custom event so useAuth can react
        window.dispatchEvent(new CustomEvent('auth:expired'));
        const err = new Error('Session expired. Please log in again.');
        err.status = 401;
        throw err;
      }

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.error || data?.detail || `Request failed (${res.status})`;
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      // Don't retry user-initiated aborts
      if (err.name === 'AbortError') throw err;
      // Don't retry 4xx errors (client issue)
      if (err.status && err.status >= 400 && err.status < 500) throw err;
      // Retry on network/5xx errors
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** attempt, 5000);
        await new Promise(r => setTimeout(r, delay));
        return doFetch(attempt + 1);
      }
      throw err;
    }
  };

  // Wrap in dedup for GETs
  if (method === 'GET' && !skipCache) {
    const cacheKey = buildCacheKey(endpoint, params);
    const promise = doFetch()
      .then(data => {
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      })
      .finally(() => inflight.delete(cacheKey));

    inflight.set(cacheKey, promise);
    return promise;
  }

  // Mutations (POST/PATCH/DELETE) — run then bust relevant cache
  const result = await doFetch();

  // Auto-invalidate related cache after mutations
  if (method !== 'GET') {
    const basePath = endpoint.replace(/\/[^/]+\/?$/, '/');
    invalidateCache(basePath);
  }

  return result;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export async function loginAPI(email, password) {
  const data = await request('/auth/login/', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  setToken(data.access);
  setStoredUser({
    firebase_uid: data.firebase_uid,
    email: data.email,
    role: data.role,
    full_name: data.full_name,
    auth_provider: data.auth_provider || 'password',
  });
  clearAllCache();
  return data;
}

export async function registerAPI({ email, password, confirm_password, first_name, last_name, phone, role }) {
  const data = await request('/auth/register/', {
    method: 'POST',
    body: { email, password, confirm_password, first_name, last_name, phone, role },
    auth: false,
  });
  setToken(data.access);
  setStoredUser({
    firebase_uid: data.firebase_uid,
    email: data.email,
    role: data.role,
    full_name: data.full_name,
    auth_provider: data.auth_provider || 'password',
  });
  clearAllCache();
  return data;
}

export async function fetchMe(options) {
  return request('/auth/me/', { skipCache: true, ...options });
}

export async function googleLoginAPI(idToken, role = 'client') {
  const data = await request('/auth/google/', {
    method: 'POST',
    body: { id_token: idToken, role },
    auth: false,
  });
  setToken(data.access);
  setStoredUser({
    firebase_uid: data.firebase_uid,
    email: data.email,
    role: data.role,
    full_name: data.full_name,
    auth_provider: data.auth_provider || 'google',
  });
  clearAllCache();
  return data;
}

export const changePassword = (body) => request('/auth/change-password/', { method: 'POST', body });
export const changeEmail = (body) => request('/auth/change-email/', { method: 'POST', body });

// ── Users ──────────────────────────────────────────────────────────────────

export const fetchUsers = (params, options) => request('/users/', { params, ...options });
export const fetchUser = (id, options) => request(`/users/${id}/`, options);
export const updateUser = (id, body) => request(`/users/${id}/`, { method: 'PATCH', body });
export const suspendUser = (id) => request(`/users/${id}/suspend/`, { method: 'POST' });
export const activateUser = (id) => request(`/users/${id}/activate/`, { method: 'POST' });

// ── Creators ───────────────────────────────────────────────────────────────

export const fetchCreators = (params, options) => request('/creators/', { params, ...options });
export const fetchCreatorByUid = (uid) => request(`/creators/by-uid/${uid}/`);
export const createCreator = (body) => request('/creators/', { method: 'POST', body });
export const updateCreator = (id, body) => request(`/creators/${id}/`, { method: 'PATCH', body });

// ── Categories ─────────────────────────────────────────────────────────────

export const fetchCategories = (params, options) => request('/categories/', { params, ...options });
export const createCategory = (body) => request('/categories/', { method: 'POST', body });
export const deleteCategory = (id) => request(`/categories/${id}/`, { method: 'DELETE' });

// ── Services ───────────────────────────────────────────────────────────────

export const fetchServices = (params, options) => request('/services/', { params, ...options });
export const fetchService = (id) => request(`/services/${id}/`);
export const createService = (body) => request('/services/', { method: 'POST', body });
export const updateService = (id, body) => request(`/services/${id}/`, { method: 'PATCH', body });
export const deleteService = (id) => request(`/services/${id}/`, { method: 'DELETE' });

// ── Orders ─────────────────────────────────────────────────────────────────

export const fetchOrders = (params, options) => request('/orders/', { params, ...options });
export const fetchOrder = (id) => request(`/orders/${id}/`);
export const createOrder = (body) => request('/orders/', { method: 'POST', body });
export const updateOrder = (id, body) => request(`/orders/${id}/`, { method: 'PATCH', body });
export const updateOrderStatus = (id, status) => request(`/orders/${id}/update_status/`, { method: 'POST', body: { status } });
export const acceptOrder = (id) => updateOrderStatus(id, 'accepted');
export const rejectOrder = (id, reason) => request(`/orders/${id}/update_status/`, { method: 'POST', body: { status: 'rejected', reason } });
export const payOrder = (id) => updateOrderStatus(id, 'completed'); // Mock payment unlocks final output
export const submitPartialOutput = (id, body) => request(`/orders/${id}/`, { method: 'PATCH', body: { ...body, status: 'partial_submitted' } });
export const submitFinalOutput = (id, body) => request(`/orders/${id}/`, { method: 'PATCH', body: { ...body, status: 'final_submitted' } });

// ── Order Timeline ─────────────────────────────────────────────────────────

export const fetchOrderTimeline = (params, options) => request('/order-timeline/', { params, ...options });

// ── Reviews ────────────────────────────────────────────────────────────────

export const fetchReviews = (params, options) => request('/reviews/', { params, ...options });
export const createReview = (body) => request('/reviews/', { method: 'POST', body });

// ── Messages ───────────────────────────────────────────────────────────────

export const fetchMessages = (params, options) => request('/messages/', { params, ...options });
export const sendMessage = (body) => request('/messages/', { method: 'POST', body });

// ── Follows ────────────────────────────────────────────────────────────────

export const fetchFollows = (params, options) => request('/follows/', { params, ...options });
export const createFollow = (body) => request('/follows/', { method: 'POST', body });
export const deleteFollow = (id) => request(`/follows/${id}/`, { method: 'DELETE' });

// ── Blocks ─────────────────────────────────────────────────────────────────

export const fetchBlocks = (params, options) => request('/blocks/', { params, ...options });
export const createBlock = (body) => request('/blocks/', { method: 'POST', body });

// ── Reports ────────────────────────────────────────────────────────────────

export const fetchReports = (params, options) => request('/reports/', { params, ...options });
export const createReport = (body) => request('/reports/', { method: 'POST', body });
export const updateReport = (id, body) => request(`/reports/${id}/`, { method: 'PATCH', body });

// ── Matches ────────────────────────────────────────────────────────────────

export const fetchMatches = (params, options) => request('/matches/', { params, ...options });
export const fetchSmartMatches = (body) => request('/matches/smart-search/', { method: 'POST', body });

// ── Payment Methods ────────────────────────────────────────────────────────

export const fetchPaymentMethods = (params, options) => request('/payment-methods/', { params, ...options });
export const createPaymentMethod = (body) => request('/payment-methods/', { method: 'POST', body });

// ── Support Tickets ────────────────────────────────────────────────────────

export const fetchSupportTickets = (params, options) => request('/support-tickets/', { params, ...options });
export const createSupportTicket = (body) => request('/support-tickets/', { method: 'POST', body });
export const updateSupportTicket = (id, body) => request(`/support-tickets/${id}/`, { method: 'PATCH', body });

// ── Wallets ────────────────────────────────────────────────────────────────

export const fetchWallets = (params, options) => request('/wallets/', { params, ...options });
export const createWallet = (body) => request('/wallets/', { method: 'POST', body });

// ── Withdrawals ────────────────────────────────────────────────────────────

export const fetchWithdrawals = (params, options) => request('/withdrawals/', { params, ...options });
export const createWithdrawal = (body) => request('/withdrawals/', { method: 'POST', body });

// ── Deadline Notifications ─────────────────────────────────────────────────

export const fetchDeadlineNotifications = (params, options) => request('/deadline-notifications/', { params, ...options });

// ── Daily Analytics ────────────────────────────────────────────────────────

export const fetchDailyAnalytics = (params, options) => request('/daily-analytics/', { params, ...options });

// ── Dashboard Stats (replaces Supabase RPCs) ───────────────────────────────

export const fetchCreatorStats = (options) => request('/dashboard/creator-stats', { skipCache: true, ...options });
export const fetchAdminStats = (options) => request('/dashboard/admin-stats', { skipCache: true, ...options });

// ── Creator Applications ───────────────────────────────────────────────────
const CREATOR_APPLICATION_ENDPOINTS = [
  '/creator-applications/',
  '/creator-applications',
  '/creator_applications/',
  '/creator_applications',
];

async function requestCreatorApplicationsWithFallback({ method = 'GET', body, params, id, action } = {}) {
  const endpointVariants = CREATOR_APPLICATION_ENDPOINTS.map((base) => {
    if (id == null) return base;
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const withId = `${normalizedBase}/${id}`;
    return action ? `${withId}/${action}/` : `${withId}/`;
  });

  let lastErr;
  for (const endpoint of endpointVariants) {
    try {
      return await request(endpoint, { method, body, params, skipCache: true });
    } catch (err) {
      lastErr = err;
      if (err?.status !== 404) throw err;
    }
  }
  throw lastErr || new Error('Creator application endpoint is not available on backend.');
}

export const submitCreatorApplication = (data) =>
  requestCreatorApplicationsWithFallback({ method: 'POST', body: data });

export const fetchCreatorApplications = (params) =>
  requestCreatorApplicationsWithFallback({ method: 'GET', params });

export const fetchCreatorApplication = (id) =>
  requestCreatorApplicationsWithFallback({ method: 'GET', id });

export const reviewCreatorApplication = (id, data) =>
  requestCreatorApplicationsWithFallback({ method: 'PATCH', id, action: 'review', body: data });

// ── Convenience: getUserData (stored user from localStorage) ───────────────

export const getUserData = () => getStoredUser();
export const fetchEarningsOverview = fetchCreatorStats; // alias for backward compatibility

// ── Auth aliases for backward compat ───────────────────────────────────────

export const login = async (email, password) => {
  try {
    const data = await loginAPI(email, password);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, data: { detail: err.message || 'Login failed' } };
  }
};

export const register = async ({ email, password, confirm_password, first_name, last_name, phone, role }) => {
  try {
    const data = await registerAPI({ email, password, confirm_password, first_name, last_name, phone, role });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, data: { detail: err.message || 'Registration failed' } };
  }
};

// ── Convenience aliases for backward-compat imports ────────────────────────

export const fetchMyOrders = (options = {}) => {
  const userId = getStoredUser()?.firebase_uid || getStoredUser()?.id;
  return request('/orders/', { params: { client_id: userId }, ...options });
};
export const fetchMyCreatorOrders = (options = {}) => {
  const userId = getStoredUser()?.firebase_uid || getStoredUser()?.id;
  return request('/orders/', { params: { creator_id: userId }, ...options });
};
export const fetchMyServices = (options) => request('/services/', options);
export const fetchMyMessages = (options) => request('/messages/', options);
export const fetchMyPaymentMethods = (options) => request('/payment-methods/', options);
export const fetchMyWallets = (options) => request('/wallets/', options);
export const fetchMyWithdrawals = (options) => request('/withdrawals/', options);
export const fetchTimeline = (params, options) => request('/order-timeline/', { params, ...options });
export const createMessage = (body) => request('/messages/', { method: 'POST', body });
export const updateMessage = (id, body) => request(`/messages/${id}/`, { method: 'PATCH', body });
export const deleteBlock = (id) => request(`/blocks/${id}/`, { method: 'DELETE' });
export const deleteWallet = (id) => request(`/wallets/${id}/`, { method: 'DELETE' });
export const deletePaymentMethod = (id) => request(`/payment-methods/${id}/`, { method: 'DELETE' });
export const patchUser = (id, body) => request(`/users/${id}/`, { method: 'PATCH', body });
export const deleteOrder = (id) => request(`/orders/${id}/`, { method: 'DELETE' });
export const createMatch = (body) => request('/matches/', { method: 'POST', body });
export const fetchDeadlines = (options) => request('/deadline-notifications/', options);

// ── Order helper stubs used by OrdersPage ──────────────────────────────────

export const logOrderEvent = async (orderId, eventType, actorId, metadata = {}) => {
  try {
    return await request('/order-timeline/', {
      method: 'POST',
      body: { order_id: orderId, event_type: eventType, actor_id: actorId, message: eventType, ...metadata }
    });
  } catch { return null; }
};

export const uploadPreviewFile = async (orderId, url) => {
  try {
    await request(`/orders/${orderId}/`, { method: 'PATCH', body: { preview_url: url } });
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
};

export const uploadFinalFiles = async (orderId, url) => {
  try {
    await request(`/orders/${orderId}/`, { method: 'PATCH', body: { final_file_url: url, status: 'delivered' } });
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
};

// ── More backward-compat aliases ───────────────────────────────────────────

export const fetchMyFollowers = (options) => request('/follows/', { params: { following_id: getStoredUser()?.id }, ...options });
export const fetchMyFollowing = (options) => request('/follows/', { params: { follower_id: getStoredUser()?.id }, ...options });
export const fetchNotifications = (options) => request('/deadline-notifications/', options);
export const deleteBlock2 = (id) => request(`/blocks/${id}/`, { method: 'DELETE' });
export const createCreatorProfile = (body) => request('/creators/', { method: 'POST', body });
export const fetchMyReviews = (options) => request('/reviews/', options);
