import type { FinanceState } from '../types'

/** State awal kosong — untuk brand yang baru memulai */
export const SEED_DATA: FinanceState = {
  cashBalance: 0,
  minCashThreshold: 0,
  taxRate: 22,
  transactions: [],
  budgets: [],
  drops: [],
  investors: [],
  risks: [],
  approvals: [],
}
