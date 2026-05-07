/**
 * Output by Antigravity IDE
 * Google Identity (Firebase Auth) + Firestore user profile.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, firebaseConfigured } from '../firebase/config'
import type { UserProfileDoc } from '../types/profile'

interface AuthCtx {
  user: User | null
  profile: UserProfileDoc | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signUpWithEmail: (email: string, pass: string, firstName: string, vehicleType: string) => Promise<void>
  signInWithEmail: (email: string, pass: string) => Promise<void>
  signOut: () => Promise<void>
  updateVehicleType: (v: string) => Promise<void>
  updateChargeLevel: (level: number) => Promise<void>
  updateNamedLocation: (type: 'home' | 'work', loc: { lat: number; lng: number; address: string; label: string } | null) => Promise<void>
  updatePreferences: (prefs: Partial<{ theme: string; locale: string }>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })

function buildDefaultProfile(u: User): UserProfileDoc {
  let theme: UserProfileDoc['preferences']['theme'] = 'dark'
  let locale: UserProfileDoc['preferences']['locale'] = 'en'
  let vehicle = 'petrol'
  let charge = 85
  
  try {
    theme = (localStorage.getItem('gd-theme') as any) || 'dark'
    locale = (localStorage.getItem('gd-locale') as any) || 'en'
    vehicle = localStorage.getItem('gd-vehicle') || 'petrol'
    const sc = localStorage.getItem('gd-charge')
    if (sc) charge = parseInt(sc)
  } catch {}

  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    firstName: u.displayName?.split(' ')[0] || 'Lead',
    vehicleType: vehicle,
    currentChargePercent: charge,
    photoURL: u.photoURL,
    preferences: { theme, locale },
    totalCo2SavedKg: 0,
    savedRoutes: [],
    co2History: [],
    homeLocation: null,
    workLocation: null,
    updatedAt: Date.now(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfileDoc | null>(null)
  const [loading, setLoading] = useState(() => Boolean(firebaseConfigured && auth))
  const [cloudHealthy, setCloudHealthy] = useState(true)

  const loadProfile = useCallback(async (u: User) => {
    if (!db) return
    const ref = doc(db, 'users', u.uid)
    try {
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const raw = snap.data() as Partial<UserProfileDoc>
        const base = buildDefaultProfile(u)
        setProfile({
          ...base,
          ...raw,
          preferences: raw.preferences ?? base.preferences,
          savedRoutes: raw.savedRoutes ?? [],
          co2History: raw.co2History ?? [],
        })
        setCloudHealthy(true)
        // Mirror to local
        if (raw.vehicleType) localStorage.setItem('gd-vehicle', raw.vehicleType)
        if (raw.currentChargePercent) localStorage.setItem('gd-charge', String(raw.currentChargePercent))
      } else {
        const created = buildDefaultProfile(u)
        await setDoc(ref, { ...created, updatedAt: serverTimestamp() })
        setProfile(created)
        setCloudHealthy(true)
      }
    } catch (err: any) {
      console.error('[AuthContext] Profile load failed:', err)
      if (err.code === 'permission-denied') {
        console.warn('CRITICAL: Firestore Denied Access. Switching to Local Survival Mode.')
        setCloudHealthy(false)
      }
      // Fallback to local default if Firestore is restricted
      setProfile(buildDefaultProfile(u))
    }
  }, [])

  useEffect(() => {
    if (!firebaseConfigured || !auth) return
    
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) await loadProfile(u)
      else setProfile(null)
      setLoading(false)
    })
    return () => unsub()
  }, [loadProfile])

  const signInWithGoogle = useCallback(async () => {
    if (!auth) return
    await signInWithPopup(auth, provider)
  }, [])

  const signUpWithEmail = useCallback(async (email: string, pass: string, firstName: string, vehicleType: string) => {
    if (!auth || !db) return
    const cred = await createUserWithEmailAndPassword(auth, email, pass)
    const ref = doc(db, 'users', cred.user.uid)
    const profile = buildDefaultProfile(cred.user)
    profile.firstName = firstName
    profile.vehicleType = vehicleType
    await setDoc(ref, { ...profile, updatedAt: serverTimestamp() })
    setProfile(profile)
  }, [])

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    if (!auth) return
    await signInWithEmailAndPassword(auth, email, pass)
  }, [])

  const signOut = useCallback(async () => {
    if (!auth) return
    await firebaseSignOut(auth)
    setProfile(null)
  }, [])

  const updateVehicleType = useCallback(async (v: string) => {
    localStorage.setItem('gd-vehicle', v)
    setProfile(prev => prev ? { ...prev, vehicleType: v } : null)
    
    if (!user || !db || !cloudHealthy) return
    console.info('[AuthContext] Syncing vehicleType to cloud:', v)
    try {
      const ref = doc(db, 'users', user.uid)
      await setDoc(ref, { vehicleType: v, updatedAt: serverTimestamp() }, { merge: true })
    } catch (e) {
      console.warn('[AuthContext] Cloud sync failed, using local persistence.')
    }
  }, [user, cloudHealthy])

  const updateChargeLevel = useCallback(async (level: number) => {
    localStorage.setItem('gd-charge', String(level))
    setProfile(prev => prev ? { ...prev, currentChargePercent: level } : null)

    if (!user || !db || !cloudHealthy) return
    console.info('[AuthContext] Syncing chargeLevel to cloud:', level)
    try {
      const ref = doc(db, 'users', user.uid)
      await setDoc(ref, { currentChargePercent: level, updatedAt: serverTimestamp() }, { merge: true })
    } catch (e) {
      console.warn('[AuthContext] Cloud sync failed, using local persistence.')
    }
  }, [user, cloudHealthy])

  const updateNamedLocation = useCallback(async (type: 'home' | 'work', loc: { lat: number; lng: number; address: string; label: string } | null) => {
    if (!user || !db) return
    const ref = doc(db, 'users', user.uid)
    const field = type === 'home' ? 'homeLocation' : 'workLocation'
    await setDoc(ref, { [field]: loc, updatedAt: serverTimestamp() }, { merge: true })
    setProfile(prev => prev ? { ...prev, [field]: loc } : null)
  }, [user])

  const updatePreferences = useCallback(async (prefs: Partial<{ theme: string; locale: string }>) => {
    setProfile(prev => {
      if (!prev) return null
      return {
        ...prev,
        preferences: { ...prev.preferences, ...prefs } as any
      }
    })
    
    if (!user || !db || !cloudHealthy) return
    try {
      const ref = doc(db, 'users', user.uid)
      await setDoc(ref, { 
        preferences: prefs, 
        updatedAt: serverTimestamp() 
      }, { merge: true })
    } catch (e) {
      console.warn('[AuthContext] Pref sync failed.')
    }
  }, [user, cloudHealthy])

  const refreshProfile = useCallback(async () => {
    if (user && db) await loadProfile(user)
  }, [user, loadProfile])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      signOut,
      updateVehicleType,
      updateChargeLevel,
      updateNamedLocation,
      updatePreferences,
      refreshProfile,
      cloudHealthy,
    }),
    [user, profile, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut, updateVehicleType, updateChargeLevel, updateNamedLocation, updatePreferences, refreshProfile, cloudHealthy]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- useAuth is the public API
export function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}
