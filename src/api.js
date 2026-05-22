// Createch API Helper — connects web UI to FastAPI backend
// All requests include JWT Bearer tokens when available.
// 401 responses trigger auto-logout; 403 returns clear permission errors.
const DEFAULT_API_ORIGIN = 'https://createch-backend-fastapi.onrender.com';
const DEFAULT_DEV_API_ORIGIN = 'http://127.0.0.1:8000';

const stripTrailingSlash = (value) => String(value || '').trim().replace(/\/+$/, '');

const stripApiSuffix = (value) => stripTrailingSlash(value).replace(/\/api$/i, '');

const buildApiBase = (value) => {
  const origin = stripApiSuffix(value || DEFAULT_API_ORIGIN);
  return `${origin}/api`;
};

const CONFIGURED_API_ORIGIN = import.meta.env.DEV
  ? stripApiSuffix(import.meta.env.VITE_DEV_API_ORIGIN || DEFAULT_DEV_API_ORIGIN)
  : stripApiSuffix(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN);

export const API_ORIGIN = CONFIGURED_API_ORIGIN;
export const API_BASE = import.meta.env.DEV
  ? '/api'
  : buildApiBase(CONFIGURED_API_ORIGIN);
const REQUEST_TIMEOUT_MS = 12000;

export const getApiOrigin = () => API_ORIGIN;

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------
export const getToken = () => localStorage.getItem('createch_token');
const emitAuthStateChanged = () => {
  window.dispatchEvent(new Event('createch-auth-changed'));
};

export const setToken = (token) => {
  localStorage.setItem('createch_token', token);
  emitAuthStateChanged();
};
export const clearToken = () => {
  localStorage.removeItem('createch_token');
  emitAuthStateChanged();
};

export const getUserData = () => {
  try {
    return JSON.parse(localStorage.getItem('createch_user'));
  } catch {
    return null;
  }
};
export const setUserData = (data) => {
  localStorage.setItem('createch_user', JSON.stringify(data));
  emitAuthStateChanged();
};
export const clearUserData = () => {
  localStorage.removeItem('createch_user');
  emitAuthStateChanged();
};

// ---------------------------------------------------------------------------
// Core fetch wrapper with auth error handling
// ---------------------------------------------------------------------------
async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const opts = { method, headers, signal: controller.signal };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        ok: false,
        status: 408,
        data: {
          detail: 'The server took too long to respond. Check that the backend is running and try again.',
        },
      };
    }

    return {
      ok: false,
      status: 0,
      data: {
        detail: 'Cannot connect to the server. Check that the backend is running and accessible.',
      },
    };
  } finally {
    window.clearTimeout(timeoutId);
  }

  // Handle 401 — token expired or invalid → auto-logout
  // Skip for auth endpoints (login/register return 401 for invalid credentials)
  const isAuthPath = path.startsWith('/auth/');
  if (res.status === 401 && !isAuthPath) {
    let data;
    try {
      data = await res.json();
    } catch {
      data = { detail: 'Session expired. Please log in again.' };
    }
    clearToken();
    clearUserData();
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return {
      ok: false,
      status: 401,
      data: {
        detail: data?.detail || 'Session expired. Please log in again.',
      },
    };
  }

  // Handle 403 — insufficient permissions
  if (res.status === 403) {
    let data;
    try { data = await res.json(); } catch { data = { detail: 'Access denied.' }; }
    return { ok: false, status: 403, data: { detail: data.detail || 'You do not have permission to perform this action.' } };
  }

  // Try to parse JSON; fall back to text
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = { detail: await res.text() };
  }

  return { ok: res.ok, status: res.status, data };
}

// ---------------------------------------------------------------------------
// Public API methods
// ---------------------------------------------------------------------------
const api = {
  get:    (path) => request('GET', path),
  post:   (path, body) => request('POST', path, body),
  put:    (path, body) => request('PUT', path, body),
  patch:  (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    query.set(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

async function uploadMultipart(path, formData) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch {
    return {
      ok: false,
      status: 0,
      data: { detail: 'Cannot connect to the server. Check that the backend is running and accessible.' },
    };
  }

  const isAuthPath = path.startsWith('/auth/');
  if (res.status === 401 && !isAuthPath) {
    let data;
    try {
      data = await res.json();
    } catch {
      data = { detail: 'Session expired. Please log in again.' };
    }
    clearToken();
    clearUserData();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return { ok: false, status: 401, data };
  }

  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = { detail: await res.text() };
  }

  return { ok: res.ok, status: res.status, data };
}

const getCurrentFirebaseUid = () => getUserData()?.firebase_uid;

const fetchScopedCollection = (path, queryKey, options = {}) => {
  const {
    fallback = () => api.get(path),
    transform = (value) => value,
  } = options;
  const firebaseUid = getCurrentFirebaseUid();

  if (!firebaseUid) {
    return fallback();
  }

  return api.get(`${path}?${queryKey}=${encodeURIComponent(transform(firebaseUid))}`);
};

const fetchEmptyCollection = () => Promise.resolve({ ok: true, data: [] });

// ---------------------------------------------------------------------------
// Auth endpoints (public — no token required)
// ---------------------------------------------------------------------------
export async function login(email, password) {
  const { ok, data } = await api.post('/auth/login/', { email, password });
  if (ok && data.access) {
    setToken(data.access);
    setUserData({
      firebase_uid: data.firebase_uid,
      email: data.email,
      role: data.role,
      full_name: data.full_name,
    });
  }
  return { ok, data };
}

export async function register({ email, password, confirm_password, first_name, last_name, phone, role }) {
  const { ok, data } = await api.post('/auth/register/', {
    email, password, confirm_password, first_name, last_name, phone, role,
  });
  if (ok && data.access) {
    setToken(data.access);
    setUserData({
      firebase_uid: data.firebase_uid,
      email: data.email,
      role: data.role,
      full_name: data.full_name,
    });
  }
  return { ok, data };
}

export async function fetchMe() {
  return api.get('/auth/me/');
}

export async function forgotPassword(email) {
  return api.post('/auth/forgot-password/', { email });
}

export function logout() {
  // Clear user-scoped notification read state
  const user = getUserData();
  if (user?.firebase_uid) {
    localStorage.removeItem(`createch_read_notifs_${user.firebase_uid}`);
  }
  clearToken();
  clearUserData();
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const fetchUsers       = ({ includeInactive = false, role = null, pageSize = 200 } = {}) =>
  api.get(`/users/${buildQuery({ include_inactive: includeInactive, role, page_size: pageSize })}`);
export const fetchUser        = (id) => api.get(`/users/${id}`);
export const updateUser       = (id, body) => api.put(`/users/${id}`, body);
export const patchUser        = (id, body) => api.patch(`/users/${id}`, body);
export const suspendUser      = (id, body) => api.post(`/users/${id}/suspend/`, body);
export const activateUser     = (id) => api.post(`/users/${id}/activate/`, {});
export const deleteUser       = (id) => api.delete(`/users/${id}`);

// ---------------------------------------------------------------------------
// Creators
// ---------------------------------------------------------------------------
export const fetchCreators    = () => api.get('/creators/');
export const fetchCreator     = (id) => api.get(`/creators/${id}`);
export const updateCreator    = (id, body) => api.patch(`/creators/${id}`, body);
export const fetchCreatorByUid = (uid) => api.get(`/creators/by-uid/${uid}`);
export const deleteCreator    = (id) => api.delete(`/creators/${id}`);
export const submitCreatorApplication = (body) => api.post('/creator-applications/', body);
export const fetchCreatorApplications = ({ status = null, pageSize = 200 } = {}) =>
  api.get(`/creator-applications/${buildQuery({ status, page_size: pageSize })}`);
export const fetchCreatorApplication = (id) => api.get(`/creator-applications/${id}`);
export const reviewCreatorApplication = (id, body) => api.patch(`/creator-applications/${id}/review/`, body);
export const uploadIdVerificationImage = (file, filename = '') =>
  uploadMultipart(`/uploads/id-verification${filename ? `?filename=${encodeURIComponent(filename)}` : ''}`, (() => {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  })());

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const fetchCategories  = () => api.get('/categories/');
export const fetchCategory    = (id) => api.get(`/categories/${id}`);
export const createCategory   = (body) => api.post('/categories/', body);
export const updateCategory   = (id, body) => api.put(`/categories/${id}`, body);
export const deleteCategory   = (id) => api.delete(`/categories/${id}`);

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
export const fetchServices    = (params = {}) => api.get(`/services/${buildQuery(params)}`);
export const fetchService     = (id) => api.get(`/services/${id}`);
export const createService    = (body) => api.post('/services/', body);
export const updateService    = (id, body) => api.put(`/services/${id}`, body);
export const deleteService    = (id) => api.delete(`/services/${id}`);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export const fetchOrders      = () => api.get('/orders/');
export const fetchOrder       = (id) => api.get(`/orders/${id}`);
export const createOrder      = (body) => api.post('/orders/', body);
export const updateOrder      = (id, body) => api.patch(`/orders/${id}`, body);
export const deleteOrder      = (id) => api.delete(`/orders/${id}`);
export const acceptOrder      = (id) => api.post(`/orders/${id}/accept/`);
export const rejectOrder      = (id, reason) => api.post(`/orders/${id}/reject/`, { reason });
export const submitPartialOutput = (id, body) => api.post(`/orders/${id}/partial-output/`, body);
export const submitFinalOutput   = (id, body) => api.post(`/orders/${id}/final-output/`, body);
export const payOrder            = (id) => api.post(`/orders/${id}/pay/`);
export const updateOrderStatus = (id, status) =>
  api.post(`/orders/${id}/update_status/`, { status });

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const fetchReviews     = () => api.get('/reviews/');
export const fetchReview      = (id) => api.get(`/reviews/${id}`);
export const createReview     = (body) => api.post('/reviews/', body);
export const updateReview     = (id, body) => api.put(`/reviews/${id}`, body);
export const deleteReview     = (id) => api.delete(`/reviews/${id}`);

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
export const fetchMessages    = () => api.get('/messages/');
export const fetchMessage     = (id) => api.get(`/messages/${id}`);
export const createMessage    = (body) => api.post('/messages/', body);
export const patchMessage     = (id, body) => api.patch(`/messages/${id}`, body);
export const updateMessage    = (id, body) => api.patch(`/messages/${id}`, body);
export const deleteMessage    = (id) => api.delete(`/messages/${id}`);

// ---------------------------------------------------------------------------
// Follows
// ---------------------------------------------------------------------------
export const fetchFollows     = () => api.get('/follows/');
export const createFollow     = (body) => api.post('/follows/', body);
export const deleteFollow     = (id) => api.delete(`/follows/${id}`);

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------
export const fetchBlocks      = () => api.get('/blocks/');
export const createBlock      = (body) => api.post('/blocks/', body);
export const deleteBlock      = (id) => api.delete(`/blocks/${id}`);

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
export const fetchReports     = () => api.get('/reports/');
export const fetchReport      = (id) => api.get(`/reports/${id}`);
export const createReport     = (body) => api.post('/reports/', body);
export const deleteReport     = (id) => api.delete(`/reports/${id}`);

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------
export const fetchMatches     = () => api.get('/matches/');
export const fetchMatch       = (id) => api.get(`/matches/${id}`);
export const createMatch      = (body) => api.post('/matches/', body);
export const updateMatch      = (id, body) => api.put(`/matches/${id}`, body);
export const deleteMatch      = (id) => api.delete(`/matches/${id}`);
export const fetchSmartMatches = (body) => api.post('/smart-match/', body);

// ---------------------------------------------------------------------------
// Payment Methods
// ---------------------------------------------------------------------------
export const fetchPaymentMethods = () => api.get('/payment-methods/');
export const fetchPaymentMethod  = (id) => api.get(`/payment-methods/${id}`);
export const createPaymentMethod = (body) => api.post('/payment-methods/', body);
export const deletePaymentMethod = (id) => api.delete(`/payment-methods/${id}`);

// ---------------------------------------------------------------------------
// Support Tickets
// ---------------------------------------------------------------------------
export const fetchSupportTickets = () => api.get('/support-tickets/');
export const fetchSupportTicket  = (id) => api.get(`/support-tickets/${id}`);
export const createSupportTicket = (body) => api.post('/support-tickets/', body);
export const updateSupportTicket = (id, body) => api.patch(`/support-tickets/${id}`, body);
export const deleteSupportTicket = (id) => api.delete(`/support-tickets/${id}`);

// ---------------------------------------------------------------------------
// Wallets
// ---------------------------------------------------------------------------
export const fetchWallets     = () => api.get('/wallets/');
export const fetchWallet      = (id) => api.get(`/wallets/${id}`);
export const createWallet     = (body) => api.post('/wallets/', body);
export const patchWallet      = (id, body) => api.patch(`/wallets/${id}`, body);
export const deleteWallet     = (id) => api.delete(`/wallets/${id}`);

// ---------------------------------------------------------------------------
// Withdrawals
// ---------------------------------------------------------------------------
export const fetchWithdrawals = () => api.get('/withdrawals/');
export const fetchWithdrawal  = (id) => api.get(`/withdrawals/${id}`);
export const createWithdrawal = (body) => api.post('/withdrawals/', body);
export const updateWithdrawal = (id, body) => api.put(`/withdrawals/${id}`, body);
export const deleteWithdrawal = (id) => api.delete(`/withdrawals/${id}`);

// ---------------------------------------------------------------------------
// Order Timeline
// ---------------------------------------------------------------------------
export const fetchTimeline    = (orderId) => api.get(`/order-timeline/?order_id=${orderId}`);
export const createTimelineEntry = (body) => api.post('/order-timeline/', body);
export const deleteTimelineEntry = (id) => api.delete(`/order-timeline/${id}`);

// ---------------------------------------------------------------------------
// Daily Analytics
// ---------------------------------------------------------------------------
export const fetchAnalytics   = () => api.get('/daily-analytics/');
export const createAnalytics  = (body) => api.post('/daily-analytics/', body);
export const deleteAnalytics  = (id) => api.delete(`/daily-analytics/${id}`);

// ---------------------------------------------------------------------------
// Deadline Notifications
// ---------------------------------------------------------------------------
export const fetchDeadlines   = () => api.get('/deadline-notifications/');
export const createDeadline   = (body) => api.post('/deadline-notifications/', body);
export const markDeadlineRead = (id) => api.put(`/deadline-notifications/${id}/read`);
export const deleteDeadline   = (id) => api.delete(`/deadline-notifications/${id}`);

// ---------------------------------------------------------------------------
// User-scoped fetchers — filter data belonging to the logged-in user
// ---------------------------------------------------------------------------
export const fetchMyOrders = () => {
  return fetchScopedCollection('/orders/', 'client_id', {
    fallback: fetchOrders,
    transform: Number,
  });
};

export const fetchMyCreatorOrders = () => {
  return fetchScopedCollection('/orders/', 'creator_id', {
    fallback: fetchOrders,
    transform: Number,
  });
};

export const fetchMyMessages = (pageSize = 100) => {
  const firebaseUid = getCurrentFirebaseUid();
  if (!firebaseUid) {
    return fetchMessages();
  }

  return api.get(`/messages/?user_id=${encodeURIComponent(firebaseUid)}&page_size=${encodeURIComponent(pageSize)}`);
};

export const fetchMyServices = () => {
  return fetchScopedCollection('/services/', 'creator_id', {
    fallback: fetchServices,
  });
};

export const fetchMyWallets = () => {
  return fetchScopedCollection('/wallets/', 'user_id', {
    fallback: fetchWallets,
  });
};

export const fetchMyWithdrawals = () => {
  return fetchScopedCollection('/withdrawals/', 'user_id', {
    fallback: fetchWithdrawals,
  });
};

export const fetchMyPaymentMethods = () => {
  return fetchScopedCollection('/payment-methods/', 'user_id', {
    fallback: fetchPaymentMethods,
  });
};

export const fetchMyFollowers = () => {
  return fetchScopedCollection('/follows/', 'following_id', {
    fallback: fetchEmptyCollection,
  });
};

export const fetchMyFollowing = () => {
  return fetchScopedCollection('/follows/', 'follower_id', {
    fallback: fetchEmptyCollection,
  });
};

export default api;
