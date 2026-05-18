import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Public Firebase web client config for this project. Not a secret (visible in any
 * browser bundle); Firestore rules enforce who can read/write.
 *
 * Set VITE_* in `.env` or in your CI/hosting build environment to override (e.g. another Firebase project).
 */
const PUBLIC_FIREBASE_DEFAULTS = {
  apiKey: 'AIzaSyC12TFmPGDqaV6VQGrM-BtAdEmZQ2lZAjs',
  authDomain: 'bakery-4c2f2.firebaseapp.com',
  projectId: 'bakery-4c2f2',
  storageBucket: 'bakery-4c2f2.appspot.com',
  messagingSenderId: '508917216605',
  appId: '1:508917216605:web:ed45e1f067569eed8764b4',
  measurementId: 'G-KQTQLDVQB3',
} as const;

function envOrDefault(key: keyof ImportMetaEnv, fallback: string): string {
  const v = import.meta.env[key];
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : fallback;
}

const firebaseConfig = {
  apiKey: envOrDefault('VITE_FIREBASE_API_KEY', PUBLIC_FIREBASE_DEFAULTS.apiKey),
  authDomain: envOrDefault('VITE_FIREBASE_AUTH_DOMAIN', PUBLIC_FIREBASE_DEFAULTS.authDomain),
  projectId: envOrDefault('VITE_FIREBASE_PROJECT_ID', PUBLIC_FIREBASE_DEFAULTS.projectId),
  storageBucket: envOrDefault('VITE_FIREBASE_STORAGE_BUCKET', PUBLIC_FIREBASE_DEFAULTS.storageBucket),
  messagingSenderId: envOrDefault(
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    PUBLIC_FIREBASE_DEFAULTS.messagingSenderId,
  ),
  appId: envOrDefault('VITE_FIREBASE_APP_ID', PUBLIC_FIREBASE_DEFAULTS.appId),
  measurementId:
    (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined)?.trim() ||
    PUBLIC_FIREBASE_DEFAULTS.measurementId,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
