import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore'
import type { FinanceState } from '../types'
import { db, isFirebaseConfigured } from './firebase'
import {
  MODULE_IDS,
  mergeModules,
  splitState,
  type ModuleDocMap,
  type ModuleId,
} from './modules'
import { SEED_DATA } from './seedData'
import { loadStateLocal, resetStateLocal, saveStateLocal } from './storage'

const MODULE_COLLECTION = 'modules'
const LEGACY_COLLECTION = 'finance'
const LEGACY_DOCUMENT = 'main'

export type StorageBackend = 'firebase' | 'local'

export function getStorageBackend(): StorageBackend {
  return isFirebaseConfigured() ? 'firebase' : 'local'
}

function moduleRef(id: ModuleId): DocumentReference {
  if (!db) throw new Error('Firestore belum diinisialisasi')
  return doc(db, MODULE_COLLECTION, id)
}

async function saveAllModules(state: FinanceState): Promise<void> {
  if (!db) throw new Error('Firestore belum diinisialisasi')
  const parts = splitState(state)
  await Promise.all(MODULE_IDS.map((id) => setDoc(moduleRef(id), parts[id])))
}

async function migrateLegacyDocument(): Promise<FinanceState | null> {
  if (!db) return null

  const legacyRef = doc(db, LEGACY_COLLECTION, LEGACY_DOCUMENT)
  const legacySnap = await getDoc(legacyRef)

  if (!legacySnap.exists()) return null

  const legacyState = legacySnap.data() as FinanceState
  await saveAllModules(legacyState)
  return legacyState
}

async function ensureModulesSeeded(fallback: FinanceState): Promise<void> {
  if (!db) return

  const parts = splitState(fallback)
  await Promise.all(
    MODULE_IDS.map(async (id) => {
      const snap = await getDoc(moduleRef(id))
      if (!snap.exists()) {
        await setDoc(moduleRef(id), parts[id])
      }
    }),
  )
}

/** Subscribe to all module documents — real-time sync per bagian */
export function subscribeFinanceState(
  onData: (state: FinanceState) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured() || !db) {
    onData(loadStateLocal())
    return () => {}
  }

  let cancelled = false
  const unsubscribers: Unsubscribe[] = []

  void (async () => {
    try {
      const migrated = await migrateLegacyDocument()
      const fallback = migrated ?? loadStateLocal()
      await ensureModulesSeeded(fallback)

      if (cancelled) return

      const parts: Partial<ModuleDocMap> = {}

      const emitIfReady = () => {
        if (MODULE_IDS.every((id) => parts[id] !== undefined)) {
          onData(mergeModules(parts))
        }
      }

      for (const id of MODULE_IDS) {
        unsubscribers.push(
          onSnapshot(
            moduleRef(id),
            (snapshot) => {
              if (snapshot.exists()) {
                ;(parts as Record<ModuleId, ModuleDocMap[ModuleId]>)[id] =
                  snapshot.data() as ModuleDocMap[typeof id]
                emitIfReady()
              }
            },
            (err) => onError(err),
          ),
        )
      }
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)))
    }
  })()

  return () => {
    cancelled = true
    for (const unsub of unsubscribers) unsub()
  }
}

/** Persist each module to its own Firestore document */
export async function saveFinanceState(state: FinanceState): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    saveStateLocal(state)
    return
  }

  await saveAllModules(state)
}

/** Reset all modules to seed data */
export async function resetFinanceState(): Promise<FinanceState> {
  if (!isFirebaseConfigured() || !db) {
    return resetStateLocal()
  }

  await saveAllModules(SEED_DATA)
  localStorage.removeItem('renavault-finance')
  return SEED_DATA
}

/** Save a single module document */
export async function saveModule<K extends ModuleId>(
  id: K,
  data: ModuleDocMap[K],
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return
  await setDoc(moduleRef(id), data)
}
