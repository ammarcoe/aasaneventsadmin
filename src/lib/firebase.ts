import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAasaneventLocalKey123456789",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "aasanevent-dev.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "aasanevent-dev",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "aasanevent-dev.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456",
};

const app = getApps().length > 0 ? getApp() : initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "asia-south1");

// Guard emulator connection against hot module reloading
const globalWithEmulator = globalThis as typeof globalThis & {
  __FIREBASE_EMULATORS_CONNECTED__?: boolean;
};

if (
  process.env.NEXT_PUBLIC_USE_EMULATOR === "true" &&
  !globalWithEmulator.__FIREBASE_EMULATORS_CONNECTED__ &&
  typeof window !== "undefined"
) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9199);
    connectFunctionsEmulator(functions, "localhost", 5001);
    globalWithEmulator.__FIREBASE_EMULATORS_CONNECTED__ = true;
  } catch {
    // Already connected or failed
  }
}
