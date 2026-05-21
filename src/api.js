// Createch API Helper — connects web UI to FastAPI backend
// All requests include JWT Bearer tokens when available.
// 401 responses trigger auto-logout; 403 returns clear permission errors.
const DEFAULT_API_ORIGIN = 'https://createch-backend-fastapi.onrender.com';

const stripTrailingSlash = (value) => String(value || '').trim().replace(/\/+$/, '');

const stripApiSuffix = (value) => stripTrailingSlash(value).replace(/\/api$/i, '');

const buildApiBase = (value) => {
  const origin = stripApiSuffix(value || DEFAULT_API_ORIGIN);
  return `${origin}/api`;
};

export const API_ORIGIN = stripApiSuffix(DEFAULT_API_ORIGIN);
export const API_BASE = import.meta.env.DEV
  ? '/api'
  : buildApiBase(DEFAULT_API_ORIGIN);
const REQUEST_TIMEOUT_MS = 12000;

export const getApiOrigin = () => API_ORIGIN;

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------
export const getToken = () => localStorage.getItem('createch_token');
const emitAuthStateChanged = () => {
  window.dispatchEvent(new Event('createch-auth-changed'));
};

// ── Helper: wrap a raw-data async function into { ok, data } ───────────────

function wrapFetch(fn) {
  return async (...args) => {
    try {
      const data = await fn(...args);
      return { ok: true, data };
    } catch (err) {
      console.error('[api.js shim] request failed:', err);
      return { ok: false, data: { detail: err.message || 'Request failed' } };
    }
  };
}

// ── Re-export synchronous / non-fetch helpers as-is ────────────────────────

export const getToken       = raw.getToken;
export const setToken       = raw.setToken;
export const clearToken     = raw.clearToken;
export const getUserData    = raw.getUserData;
export const getStoredUser  = raw.getStoredUser;
export const setStoredUser  = raw.setStoredUser;
export const invalidateCache = raw.invalidateCache;
export const clearAllCache  = raw.clearAllCache;

// ── Auth (already wrapped in services/api.js) ──────────────────────────────

export const login    = raw.login;
export const register = raw.register;
export const logout   = raw.logout;
export const googleLoginAPI = raw.googleLoginAPI;
export const changePassword = wrapFetch(raw.changePassword);
export const changeEmail = wrapFetch(raw.changeEmail);

// ── Wrapped fetch helpers ──────────────────────────────────────────────────

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
export const fetchUsers   = wrapFetch(raw.fetchUsers);
export const fetchUser    = wrapFetch(raw.fetchUser);
export const updateUser   = wrapFetch(raw.updateUser);
export const patchUser    = wrapFetch(raw.patchUser);
export const suspendUser  = wrapFetch(raw.suspendUser);
export const activateUser = wrapFetch(raw.activateUser);

// Creators
export const fetchCreators    = wrapFetch(raw.fetchCreators);
export const fetchCreatorByUid = wrapFetch(raw.fetchCreatorByUid);
export const createCreator    = wrapFetch(raw.createCreator);
export const updateCreator    = wrapFetch(raw.updateCreator);
export const createCreatorProfile = wrapFetch(raw.createCreatorProfile);

// Categories
export const fetchCategories = wrapFetch(raw.fetchCategories);
export const createCategory = wrapFetch(raw.createCategory);
export const deleteCategory = wrapFetch(raw.deleteCategory);

// Services
export const fetchServices  = wrapFetch(raw.fetchServices);
export const fetchService   = wrapFetch(raw.fetchService);
export const createService  = wrapFetch(raw.createService);
export const updateService  = wrapFetch(raw.updateService);
export const deleteService  = wrapFetch(raw.deleteService);
export const fetchMyServices = wrapFetch(raw.fetchMyServices);

// Orders
export const fetchOrders         = wrapFetch(raw.fetchOrders);
export const fetchOrder          = wrapFetch(raw.fetchOrder);
export const createOrder         = wrapFetch(raw.createOrder);
export const updateOrder         = wrapFetch(raw.updateOrder);
export const deleteOrder         = wrapFetch(raw.deleteOrder);
export const updateOrderStatus   = wrapFetch(raw.updateOrderStatus);
export const acceptOrder         = wrapFetch(raw.acceptOrder);
export const rejectOrder         = wrapFetch(raw.rejectOrder);
export const payOrder            = wrapFetch(raw.payOrder);
export const submitPartialOutput = wrapFetch(raw.submitPartialOutput);
export const submitFinalOutput   = wrapFetch(raw.submitFinalOutput);
export const fetchMyOrders       = wrapFetch(raw.fetchMyOrders);
export const fetchMyCreatorOrders = wrapFetch(raw.fetchMyCreatorOrders);

// Order Timeline
export const fetchOrderTimeline = wrapFetch(raw.fetchOrderTimeline);
export const fetchTimeline      = wrapFetch(raw.fetchTimeline);
export const logOrderEvent      = raw.logOrderEvent; // already has its own try/catch

// Reviews
export const fetchReviews  = wrapFetch(raw.fetchReviews);
export const createReview  = wrapFetch(raw.createReview);
export const updateReview  = wrapFetch(raw.updateReview);
export const fetchMyReviews = wrapFetch(raw.fetchMyReviews);

// Messages
export const fetchMessages  = wrapFetch(raw.fetchMessages);
export const sendMessage    = wrapFetch(raw.sendMessage);
export const createMessage  = wrapFetch(raw.createMessage);
export const updateMessage  = wrapFetch(raw.updateMessage);
export const fetchMyMessages = wrapFetch(raw.fetchMyMessages);

// Follows
export const fetchFollows  = wrapFetch(raw.fetchFollows);
export const createFollow  = wrapFetch(raw.createFollow);
export const deleteFollow  = wrapFetch(raw.deleteFollow);
export const fetchMyFollowers = wrapFetch(raw.fetchMyFollowers);
export const fetchMyFollowing = wrapFetch(raw.fetchMyFollowing);

// Blocks
export const fetchBlocks  = wrapFetch(raw.fetchBlocks);
export const createBlock  = wrapFetch(raw.createBlock);
export const deleteBlock  = wrapFetch(raw.deleteBlock);
export const deleteBlock2 = wrapFetch(raw.deleteBlock2);

// Reports
export const fetchReports = wrapFetch(raw.fetchReports);
export const createReport = wrapFetch(raw.createReport);
export const updateReport = wrapFetch(raw.updateReport);

// Matches
export const fetchMatches = wrapFetch(raw.fetchMatches);
export const createMatch  = wrapFetch(raw.createMatch);
export const fetchSmartMatches = wrapFetch(raw.fetchSmartMatches);

// Payment Methods
export const fetchPaymentMethods   = wrapFetch(raw.fetchPaymentMethods);
export const createPaymentMethod   = wrapFetch(raw.createPaymentMethod);
export const deletePaymentMethod   = wrapFetch(raw.deletePaymentMethod);
export const fetchMyPaymentMethods = wrapFetch(raw.fetchMyPaymentMethods);

// Support Tickets
export const fetchSupportTickets  = wrapFetch(raw.fetchSupportTickets);
export const createSupportTicket  = wrapFetch(raw.createSupportTicket);
export const updateSupportTicket  = wrapFetch(raw.updateSupportTicket);

// Wallets
export const fetchWallets    = wrapFetch(raw.fetchWallets);
export const createWallet    = wrapFetch(raw.createWallet);
export const deleteWallet    = wrapFetch(raw.deleteWallet);
export const fetchMyWallets  = wrapFetch(raw.fetchMyWallets);

// Withdrawals
export const fetchWithdrawals   = wrapFetch(raw.fetchWithdrawals);
export const createWithdrawal   = wrapFetch(raw.createWithdrawal);
export const fetchMyWithdrawals = wrapFetch(raw.fetchMyWithdrawals);

// Notifications / Deadlines
export const fetchDeadlineNotifications = wrapFetch(raw.fetchDeadlineNotifications);
export const fetchDeadlines     = wrapFetch(raw.fetchDeadlines);
export const fetchNotifications = wrapFetch(raw.fetchNotifications);

// Analytics
export const fetchDailyAnalytics = wrapFetch(raw.fetchDailyAnalytics);

// Dashboard
export const fetchCreatorStats     = wrapFetch(raw.fetchCreatorStats);
export const fetchAdminStats       = wrapFetch(raw.fetchAdminStats);
export const fetchEarningsOverview = wrapFetch(raw.fetchEarningsOverview);

// Creator Applications
export const submitCreatorApplication  = wrapFetch(raw.submitCreatorApplication);
export const fetchCreatorApplications  = wrapFetch(raw.fetchCreatorApplications);
export const fetchCreatorApplication   = wrapFetch(raw.fetchCreatorApplication);
export const reviewCreatorApplication  = wrapFetch(raw.reviewCreatorApplication);

// File uploads (already have their own try/catch)
export const uploadPreviewFile = raw.uploadPreviewFile;
export const uploadFinalFiles  = raw.uploadFinalFiles;

// Auth helpers
export const fetchMe = wrapFetch(raw.fetchMe);

// Disputes
export const fetchDisputes = wrapFetch(raw.fetchDisputes);
export const fetchDispute = wrapFetch(raw.fetchDispute);
export const createDispute = wrapFetch(raw.createDispute);
export const resolveDispute = wrapFetch(raw.resolveDispute);
export const escalateDispute = wrapFetch(raw.escalateDispute);
export const deleteDispute = wrapFetch(raw.deleteDispute);

// Refunds
export const refundOrder = wrapFetch(raw.refundOrder);

// Order Notifications
export const fetchOrderNotifications = wrapFetch(raw.fetchOrderNotifications);
export const getUnreadNotificationCount = wrapFetch(raw.getUnreadNotificationCount);
export const markNotificationRead = wrapFetch(raw.markNotificationRead);
export const markAllNotificationsRead = wrapFetch(raw.markAllNotificationsRead);
export const deleteNotification = wrapFetch(raw.deleteNotification);
export const clearAllNotifications = wrapFetch(raw.clearAllNotifications);
