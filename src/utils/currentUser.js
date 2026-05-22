import { getUserData } from '../api';

export function getCurrentUser() {
  return getUserData();
}

export function getCurrentUserRole(fallback = 'creator') {
  return getCurrentUser()?.role || fallback;
}

export function getCurrentUserUid() {
  return getCurrentUser()?.firebase_uid || null;
}

export function isCreatorRole(role) {
  return role === 'creator';
}
