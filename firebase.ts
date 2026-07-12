import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  type Firestore,
} from "firebase/firestore";
// All values come from Vite env vars (see .env.example). If they aren't
// configured, the app still works — it just runs fully local/offline on
// this one device, with no cross-device sync until you add Firebase keys.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let dbFs: Firestore | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  dbFs = getFirestore(app);
  enableIndexedDbPersistence(dbFs).catch(() => {
    // multiple tabs open, or unsupported browser — sync will still work,
    // just without Firestore's own offline cache layered on top of ours.
  });
}

export { auth, dbFs };

let currentUser: User | null = null;
let authReadyResolve: (u: User | null) => void;
export const authReady: Promise<User | null> = new Promise((res) => {
  authReadyResolve = res;
});

export function initAuth() {
  if (!auth) {
    authReadyResolve(null);
    return;
  }
  onAuthStateChanged(auth, (u) => {
    currentUser = u;
    authReadyResolve(u);
  });
  if (!auth.currentUser) {
    signInAnonymously(auth).catch((err) => {
      console.error("Anonymous sign-in failed", err);
    });
  }
}

export function getCurrentUid(): string {
  // Falls back to a stable local id when Firebase isn't configured, so
  // every record still has a createdBy value in local-only mode.
  return currentUser?.uid ?? getLocalDeviceId();
}

function getLocalDeviceId(): string {
  const key = "memory-director-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = "local-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(key, id);
  }
  return id;
}
