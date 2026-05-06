/**
 * Output by Antigravity IDE
 * Firebase: Hosting + Firestore + Google Auth. Initializes only when env is complete.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, setPersistence, browserSessionPersistence, type Auth } from 'firebase/auth'
import { getFirestore, initializeFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
}

export const firebaseConfigured = Boolean(
  cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId
)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (firebaseConfigured) {
  const g = window as any
  if (!g.__GD_APP) {
    console.info(`[Firebase] Initializing project: ${cfg.projectId}`)
    g.__GD_APP = initializeApp(cfg)
    g.__GD_AUTH = getAuth(g.__GD_APP)
    setPersistence(g.__GD_AUTH, browserSessionPersistence).catch(e => console.warn('Auth persistence failed:', e))
    g.__GD_DB = initializeFirestore(g.__GD_APP, {
      localCache: memoryLocalCache()
    })
  }
  app = g.__GD_APP
  auth = g.__GD_AUTH
  db = g.__GD_DB
}

export { app, auth, db }
