import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC12TFmPGDqaV6VQGrM-BtAdEmZQ2lZAjs",
  authDomain: "bakery-4c2f2.firebaseapp.com",
  projectId: "bakery-4c2f2",
  storageBucket: "bakery-4c2f2.appspot.com",
  messagingSenderId: "508917216605",
  appId: "1:508917216605:web:ed45e1f067569eed8764b4",
  measurementId: "G-KQTQLDVQB3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
