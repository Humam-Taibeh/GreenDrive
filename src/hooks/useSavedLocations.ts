import { useState, useEffect, useCallback } from 'react'
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import type { UserSavedLocation } from '../types'

export function useSavedLocations() {
  const { user } = useAuth()
  const [savedLocations, setSavedLocations] = useState<UserSavedLocation[]>([])

  useEffect(() => {
    if (!user?.uid || !db) return
    let cancelled = false

    const q = query(
      collection(db, 'users', user.uid, 'savedLocations'),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      if (cancelled) return
      const locs = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as UserSavedLocation[]
      setSavedLocations(locs)
    }, (err) => {
      if (cancelled) return
      console.error('Firestore savedLocations error:', err)
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [user?.uid])

  const saveLocation = useCallback(async (loc: Omit<UserSavedLocation, 'id' | 'createdAt'>) => {
    if (!user || !db) return
    await addDoc(collection(db, 'users', user.uid, 'savedLocations'), {
      ...loc,
      createdAt: serverTimestamp()
    })
  }, [user])

  const removeLocation = useCallback(async (id: string) => {
    if (!user || !db) return
    await deleteDoc(doc(db, 'users', user.uid, 'savedLocations', id))
  }, [user])

  return {
    savedLocations: user ? savedLocations : [],
    loading: false,
    saveLocation,
    removeLocation,
  }
}
