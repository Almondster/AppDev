import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as onFirebaseAuthStateChanged,
} from 'firebase/auth';
import { getUserData } from '../api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const firebaseAuth = hasFirebaseConfig ? getAuth(app) : null;
export const googleProvider = hasFirebaseConfig ? new GoogleAuthProvider() : null;

const mapStoredUser = () => {
  const user = getUserData();
  if (!user) return null;
  return {
    uid: user.firebase_uid || user.uid || String(user.id || ''),
    email: user.email || '',
    displayName: user.full_name || user.name || '',
    photoURL: user.avatar_url || user.avatar || null,
    ...user,
  };
};

export const isFirebaseReady = () => hasFirebaseConfig && Boolean(firebaseAuth);

export const signInWithGooglePopup = async () => {
  if (!firebaseAuth || !googleProvider) {
    throw new Error('Firebase Google Sign-In is not configured.');
  }
  return signInWithPopup(firebaseAuth, googleProvider);
};

export const auth = {
  get currentUser() {
    return firebaseAuth?.currentUser || mapStoredUser();
  },
  onAuthStateChanged: (callback) => {
    if (firebaseAuth) {
      return onFirebaseAuthStateChanged(firebaseAuth, (user) => {
        callback(user || mapStoredUser());
      });
    }
    callback(mapStoredUser());
    return () => {};
  },
  signOut: async () => {
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    }
    return { ok: true };
  },
};
