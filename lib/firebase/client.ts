import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";
import { getStorage, type FirebaseStorage } from "firebase/storage";

let firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "songify-cc2c5",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "471693809116",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:471693809116:web:e13d6b10bd310bd78aeb19"
};
const complete = () => Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
let initialization: Promise<void> | undefined;
/** Firebase Hosting exposes only public Web SDK configuration at this reserved URL. */
export function prepareFirebaseClient(): Promise<void> {
  if (complete() || getApps().length) return Promise.resolve();
  initialization ??= (async () => {
    const url = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_URL || "https://songify-cc2c5.web.app/__/firebase/init.json";
    const configUrl = new URL(url, typeof window !== "undefined" ? window.location.origin : "https://songify-cc2c5.web.app");
    if (configUrl.protocol !== "https:" || !["songify-cc2c5.web.app", "songify-cc2c5.firebaseapp.com"].includes(configUrl.hostname)) throw new Error("Account service unavailable.");
    const response = await fetch(configUrl.toString(), { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Account service unavailable.");
    const data = await response.json();
    if (data.projectId !== "songify-cc2c5" || data.appId !== "1:471693809116:web:e13d6b10bd310bd78aeb19") throw new Error("Account service unavailable.");
    firebaseConfig = data;
    if (!complete()) throw new Error("Account service unavailable.");
  })().catch(error => { initialization = undefined; throw error; });
  return initialization;
}
export function getFirebaseClientApp(): FirebaseApp {
  if (getApps().length) return getApp();
  if (!complete()) throw new Error("Account access is temporarily unavailable. Please try again shortly.");
  return initializeApp(firebaseConfig);
}
// Test mode can only use a synthetic project on a local browser. It never changes authorization rules.
function emulatorsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "true"
    && firebaseConfig.projectId?.startsWith("demo-") === true
    && typeof window !== "undefined" && ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}
const connected = new WeakSet<object>();
export function getFirebaseAuth(): Auth {
  const auth = getAuth(getFirebaseClientApp());
  if (emulatorsEnabled() && !connected.has(auth)) { connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true }); connected.add(auth); }
  return auth;
}
export function getFirebaseFirestore(): Firestore {
  const db = getFirestore(getFirebaseClientApp());
  if (emulatorsEnabled() && !connected.has(db)) { connectFirestoreEmulator(db, "127.0.0.1", 8096); connected.add(db); }
  return db;
}
export function getFirebaseFunctions(): Functions {
  const functions = getFunctions(getFirebaseClientApp(), "us-central1");
  if (emulatorsEnabled() && !connected.has(functions)) { connectFunctionsEmulator(functions, "127.0.0.1", 5001); connected.add(functions); }
  return functions;
}
export function getFirebaseStorage(): FirebaseStorage { return getStorage(getFirebaseClientApp()); }
