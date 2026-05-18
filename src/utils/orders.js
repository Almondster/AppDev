import { fetchMyCreatorOrders, fetchMyOrders } from '../api';
import { isCreatorRole } from './currentUser';

export const ORDER_STATUS_FILTERS = ['all', 'pending', 'active', 'completed', 'refunded', 'cancelled'];

const ACTIVE_PROJECT_STATUSES = new Set(['accepted', 'partial_submitted', 'final_submitted', 'in_progress', 'delivered']);
const PENDING_PAYOUT_STATUSES = new Set(['in_progress', 'delivered', 'accepted']);

export function getOrderFetcherForRole(role) {
  return isCreatorRole(role) ? fetchMyCreatorOrders : fetchMyOrders;
}

export function mapOrderStatusBucket(status) {
  if (ACTIVE_PROJECT_STATUSES.has(status)) return 'active';
  if (['cancelled', 'rejected'].includes(status)) return 'cancelled';
  return status || 'pending';
}

export function isActiveCreatorOrderStatus(status) {
  return ACTIVE_PROJECT_STATUSES.has(status);
}

export function isPendingPayoutOrderStatus(status) {
  return PENDING_PAYOUT_STATUSES.has(status);
}
