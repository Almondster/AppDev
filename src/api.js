/**
 * Backward-compatibility shim.
 * The canonical API module is at `services/api.js` and returns raw data.
 * 
 * The origin/main UI pages expect every fetch helper to return { ok, data }.
 * This file wraps each exported function to produce that shape while
 * keeping the underlying services/api.js untouched (AdminDashboardPage
 * imports from services/api.js directly and expects raw data).
 */

import * as raw from './services/api';

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
