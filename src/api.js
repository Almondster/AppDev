// Createch API Helper — connects web UI to Django REST Framework backend
// Note: In production, API_BASE should use 'https://' to ensure encrypted communication.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------
export const getToken = () => localStorage.getItem('createch_token');
export const setToken = (token) => localStorage.setItem('createch_token', token);
export const clearToken = () => localStorage.removeItem('createch_token');

export const getUserData = () => {
  try {
    return JSON.parse(localStorage.getItem('createch_user'));
  } catch {
    return null;
  }
};
export const setUserData = (data) => localStorage.setItem('createch_user', JSON.stringify(data));
export const clearUserData = () => localStorage.removeItem('createch_user');

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------
async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);

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

// ---------------------------------------------------------------------------
// Auth endpoints
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
// Resource endpoints
// ---------------------------------------------------------------------------
export const fetchUsers       = () => api.get('/users/');
export const fetchUser        = (id) => api.get(`/users/${id}/`);
export const updateUser       = (id, body) => api.put(`/users/${id}/`, body);
export const patchUser        = (id, body) => api.patch(`/users/${id}/`, body);
export const deleteUser       = (id) => api.delete(`/users/${id}/`);

export const fetchCreators    = () => api.get('/creators/');
export const fetchCreator     = (id) => api.get(`/creators/${id}/`);
export const updateCreator    = (id, body) => api.patch(`/creators/${id}/`, body);
export const fetchCreatorByUid = (uid) => api.get(`/creators/by-uid/${uid}/`);

export const fetchCategories  = () => api.get('/categories/');

export const fetchServices    = () => api.get('/services/');
export const fetchService     = (id) => api.get(`/services/${id}/`);
export const createService    = (body) => api.post('/services/', body);
export const updateService    = (id, body) => api.put(`/services/${id}/`, body);
export const deleteService    = (id) => api.delete(`/services/${id}/`);

export const fetchOrders      = () => api.get('/orders/');
export const fetchOrder       = (id) => api.get(`/orders/${id}/`);
export const createOrder      = (body) => api.post('/orders/', body);
export const updateOrder      = (id, body) => api.patch(`/orders/${id}/`, body);
export const deleteOrder      = (id) => api.delete(`/orders/${id}/`);

// Update order status (custom action)
export const updateOrderStatus = (id, status) =>
  api.post(`/orders/${id}/update_status/`, { status });

export const fetchReviews     = () => api.get('/reviews/');
export const createReview     = (body) => api.post('/reviews/', body);

export const fetchMessages    = () => api.get('/messages/');
export const createMessage    = (body) => api.post('/messages/', body);

export const fetchFollows     = () => api.get('/follows/');
export const createFollow     = (body) => api.post('/follows/', body);
export const deleteFollow     = (id) => api.delete(`/follows/${id}/`);

export const fetchBlocks      = () => api.get('/blocks/');
export const fetchReports     = () => api.get('/reports/');
export const createReport     = (body) => api.post('/reports/', body);

export const fetchMatches     = () => api.get('/matches/');

export const fetchPaymentMethods = () => api.get('/payment-methods/');
export const createPaymentMethod = (body) => api.post('/payment-methods/', body);
export const deletePaymentMethod = (id) => api.delete(`/payment-methods/${id}/`);

export const fetchSupportTickets = () => api.get('/support-tickets/');
export const createSupportTicket = (body) => api.post('/support-tickets/', body);
export const updateSupportTicket = (id, body) => api.patch(`/support-tickets/${id}/`, body);

export const fetchWallets     = () => api.get('/wallets/');
export const createWallet     = (body) => api.post('/wallets/', body);
export const deleteWallet     = (id) => api.delete(`/wallets/${id}/`);

export const fetchWithdrawals = () => api.get('/withdrawals/');
export const createWithdrawal = (body) => api.post('/withdrawals/', body);

export const fetchTimeline    = (orderId) => api.get(`/order-timeline/?order_id=${orderId}`);
export const fetchAnalytics   = () => api.get('/daily-analytics/');
export const fetchDeadlines   = () => api.get('/deadline-notifications/');

// ---------------------------------------------------------------------------
// User-scoped fetchers — filter data belonging to the logged-in user
// ---------------------------------------------------------------------------
export const fetchMyOrders = () => {
  const user = getUserData();
  if (!user?.firebase_uid) return fetchOrders();
  return api.get(`/orders/?client_id=${user.firebase_uid}`);
};

export const fetchMyCreatorOrders = () => {
  const user = getUserData();
  if (!user?.firebase_uid) return fetchOrders();
  return api.get(`/orders/?creator_id=${user.firebase_uid}`);
};

export const fetchMyMessages = () => {
  const user = getUserData();
  if (!user?.firebase_uid) return fetchMessages();
  return api.get(`/messages/?user_id=${user.firebase_uid}`);
};

export const fetchMyServices = () => {
  const user = getUserData();
  if (!user?.firebase_uid) return fetchServices();
  return api.get(`/services/?creator_id=${user.firebase_uid}`);
};

export const fetchMyWallets = () => {
  const user = getUserData();
  if (!user?.firebase_uid) return fetchWallets();
  return api.get(`/wallets/?user_id=${user.firebase_uid}`);
};

export const fetchMyWithdrawals = () => {
  const user = getUserData();
  if (!user?.firebase_uid) return fetchWithdrawals();
  return api.get(`/withdrawals/?user_id=${user.firebase_uid}`);
};

export const fetchMyPaymentMethods = () => {
  const user = getUserData();
  if (!user?.firebase_uid) return fetchPaymentMethods();
  return api.get(`/payment-methods/?user_id=${user.firebase_uid}`);
};

export const fetchMyFollowers = () => {
  const user = getUserData();
  if (!user?.firebase_uid) return Promise.resolve({ ok: true, data: [] });
  return api.get(`/follows/?following_id=${user.firebase_uid}`);
};

export const fetchMyFollowing = () => {
  const user = getUserData();
  if (!user?.firebase_uid) return Promise.resolve({ ok: true, data: [] });
  return api.get(`/follows/?follower_id=${user.firebase_uid}`);
};

export default api;
