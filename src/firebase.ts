import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/** Bakery project defaults — public client config; override via VITE_* in `.env`. */
const FIREBASE_DEFAULTS = {
  apiKey: 'AIzaSyC12TFmPGDqaV6VQGrM-BtAdEmZQ2lZAjs',
  authDomain: 'bakery-4c2f2.firebaseapp.com',
  projectId: 'bakery-4c2f2',
  storageBucket: 'bakery-4c2f2.firebasestorage.app',
  messagingSenderId: '508917216605',
  appId: '1:508917216605:web:ed45e1f067569eed8764b4',
  measurementId: 'G-KQTLDVQB3',
} as const;

function env(key: keyof ImportMetaEnv, fallback: string): string {
  const v = import.meta.env[key];
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : fallback;
}

const firebaseConfig = {
  apiKey: env('VITE_FIREBASE_API_KEY', FIREBASE_DEFAULTS.apiKey),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN', FIREBASE_DEFAULTS.authDomain),
  projectId: env('VITE_FIREBASE_PROJECT_ID', FIREBASE_DEFAULTS.projectId),
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET', FIREBASE_DEFAULTS.storageBucket),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID', FIREBASE_DEFAULTS.messagingSenderId),
  appId: env('VITE_FIREBASE_APP_ID', FIREBASE_DEFAULTS.appId),
  measurementId: env('VITE_FIREBASE_MEASUREMENT_ID', FIREBASE_DEFAULTS.measurementId),
};

if (!firebaseConfig.apiKey) {
  console.error('Firebase apiKey is missing. Copy .env.example to .env and rebuild.');
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
