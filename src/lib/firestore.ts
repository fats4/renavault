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

/** Subscribe to shared module documents — database sama untuk semua akun */
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
      await ensureModulesSeeded(SEED_DATA)

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

export async function saveFinanceState(state: FinanceState): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    saveStateLocal(state)
    return
  }
  await saveAllModules(state)
}

export async function resetFinanceState(): Promise<FinanceState> {
  if (!isFirebaseConfigured() || !db) {
    return resetStateLocal()
  }
  await saveAllModules(SEED_DATA)
  localStorage.removeItem('renavault-finance')
  return SEED_DATA
}

export async function saveModule<K extends ModuleId>(
  id: K,
  data: ModuleDocMap[K],
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return
  await setDoc(moduleRef(id), data)
}
