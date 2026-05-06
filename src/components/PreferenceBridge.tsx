/** Output by Antigravity IDE — syncs theme/locale ↔ Firestore */
import { useHydratePreferencesFromProfile } from '../hooks/useHydratePreferencesFromProfile'
import { useSyncPreferencesToCloud } from '../hooks/useSyncPreferencesToCloud'

export function PreferenceBridge() {
  useHydratePreferencesFromProfile()
  useSyncPreferencesToCloud()
  return null
}
