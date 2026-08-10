import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import type { FinanceState } from '../types'
import { db, isFirebaseConfigured } from './firebase'
import { SEED_DATA } from './seedData'
import { loadStateLocal, resetStateLocal, saveStateLocal } from './storage'

const COLLECTION = 'finance'
const DOCUMENT_ID = 'main'

function getDocRef() {
  if (!db) throw new Error('Firestore belum diinisialisasi')
  return doc(db, COLLECTION, DOCUMENT_ID)
}

function isSeedData(state: FinanceState): boolean {
  return JSON.stringify(state) === JSON.stringify(SEED_DATA)
}

export type StorageBackend = 'firebase' | 'local'

export function getStorageBackend(): StorageBackend {
  return isFirebaseConfigured() ? 'firebase' : 'local'
}

/** Subscribe to finance state — real-time sync from Firestore */
export function subscribeFinanceState(
  onData: (state: FinanceState) => void,
  onError: (error: Error) => void,
): () => void {
  if (!isFirebaseConfigured() || !db) {
    onData(loadStateLocal())
    return () => {}
  }

  const docRef = getDocRef()
  let seeded = false

  return onSnapshot(
    docRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as FinanceState)
        return
      }

      if (seeded) return
      seeded = true

      const local = loadStateLocal()
      const initial = isSeedData(local) ? SEED_DATA : local
      await setDoc(docRef, initial)
      onData(initial)
    },
    (err) => onError(err),
  )
}

/** Persist state to Firestore or localStorage fallback */
export async function saveFinanceState(state: FinanceState): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    saveStateLocal(state)
    return
  }

  await setDoc(getDocRef(), state)
}

/** Reset to seed data */
export async function resetFinanceState(): Promise<FinanceState> {
  if (!isFirebaseConfigured() || !db) {
    return resetStateLocal()
  }

  await setDoc(getDocRef(), SEED_DATA)
  localStorage.removeItem('renavault-finance')
  return SEED_DATA
}
