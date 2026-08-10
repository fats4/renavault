import type { FinanceState } from '../types'
import { SEED_DATA } from './seedData'

export { SEED_DATA }

const STORAGE_KEY = 'renavault-finance'

export function loadStateLocal(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as FinanceState
  } catch {
    /* use seed */
  }
  return SEED_DATA
}

export function saveStateLocal(state: FinanceState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetStateLocal(): FinanceState {
  localStorage.removeItem(STORAGE_KEY)
  return SEED_DATA
}

/** @deprecated Use loadStateLocal or firestore service */
export function loadState(): FinanceState {
  return loadStateLocal()
}

/** @deprecated Use saveStateLocal or firestore service */
export function saveState(state: FinanceState): void {
  saveStateLocal(state)
}

/** @deprecated Use resetStateLocal or firestore service */
export function resetState(): FinanceState {
  return resetStateLocal()
}
