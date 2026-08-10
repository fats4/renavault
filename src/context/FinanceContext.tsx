import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  ApprovalRequest,
  BudgetItem,
  DropProduct,
  FinanceState,
  Investor,
  ProductionItem,
  RiskItem,
  Transaction,
} from '../types'
import {
  getStorageBackend,
  resetFinanceState,
  saveFinanceState,
  subscribeFinanceState,
  type StorageBackend,
} from '../lib/firestore'
import { SEED_DATA } from '../lib/seedData'
import { isDuplicateTransaction, LUNAS_TRANSACTIONS } from '../lib/importLunasData'

interface FinanceContextValue {
  state: FinanceState
  loading: boolean
  saving: boolean
  error: string | null
  storageBackend: StorageBackend
  updateCashBalance: (amount: number) => void
  updateMinCashThreshold: (amount: number) => void
  addTransaction: (tx: Omit<Transaction, 'id'>) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  addProduction: (item: Omit<ProductionItem, 'id'>) => void
  updateProduction: (id: string, updates: Partial<ProductionItem>) => void
  deleteProduction: (id: string) => void
  markProductionPaid: (id: string) => void
  updateBudget: (id: string, updates: Partial<BudgetItem>) => void
  addDrop: (drop: Omit<DropProduct, 'id'>) => void
  updateDrop: (id: string, updates: Partial<DropProduct>) => void
  addInvestor: (inv: Omit<Investor, 'id'>) => void
  updateRisk: (id: string, updates: Partial<RiskItem>) => void
  updateApproval: (id: string, status: ApprovalRequest['status']) => void
  resetData: () => Promise<void>
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

function uid() {
  return crypto.randomUUID()
}

function transactionCashEffect(tx: Transaction): number {
  if (tx.status !== 'completed') return 0
  return tx.type === 'income' ? tx.amount : -tx.amount
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(SEED_DATA)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const storageBackend = getStorageBackend()
  const readyToSave = useRef(false)
  const isDirty = useRef(false)
  const skipNextRemote = useRef(false)
  const lunasImportDone = useRef(false)

  const persistNow = useCallback(async (nextState: FinanceState) => {
    isDirty.current = true
    skipNextRemote.current = true
    setSaving(true)
    try {
      await saveFinanceState(nextState)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally {
      isDirty.current = false
      setSaving(false)
    }
  }, [])

  const applyMutation = useCallback(
    (updater: (current: FinanceState) => FinanceState, immediate = false) => {
      setState((current) => {
        const next = updater(current)
        if (next !== current && immediate) {
          void persistNow(next)
        }
        return next
      })
    },
    [persistNow],
  )

  useEffect(() => {
    readyToSave.current = false
    setLoading(true)

    const unsubscribe = subscribeFinanceState(
      (data) => {
        if (skipNextRemote.current) {
          skipNextRemote.current = false
          return
        }
        if (isDirty.current) return

        setState((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev
          return data
        })
        setLoading(false)
        readyToSave.current = true
      },
      (err) => {
        setError(err.message)
        setLoading(false)
        readyToSave.current = true
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (loading || !readyToSave.current || lunasImportDone.current || isDirty.current) return
    lunasImportDone.current = true

    const toAdd = LUNAS_TRANSACTIONS.filter(
      (incoming) => !state.transactions.some((existing) => isDuplicateTransaction(existing, incoming)),
    )
    if (toAdd.length === 0) return

    const added = toAdd.map((tx) => ({ ...tx, id: uid() }))
    const cashDelta = added.reduce((sum, tx) => sum + transactionCashEffect(tx), 0)

    applyMutation(
      (s) => ({
        ...s,
        transactions: [...s.transactions, ...added],
        cashBalance: s.cashBalance + cashDelta,
      }),
      true,
    )
  }, [loading, state.transactions, applyMutation])

  useEffect(() => {
    if (!readyToSave.current || loading || isDirty.current) return

    setSaving(true)
    const timer = setTimeout(async () => {
      try {
        await saveFinanceState(state)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
      } finally {
        setSaving(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [state, loading])

  const updateCashBalance = useCallback(
    (amount: number) => applyMutation((s) => ({ ...s, cashBalance: amount })),
    [applyMutation],
  )

  const updateMinCashThreshold = useCallback(
    (amount: number) => applyMutation((s) => ({ ...s, minCashThreshold: amount })),
    [applyMutation],
  )

  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id'>) => {
      const full = { ...tx, id: uid() }
      applyMutation(
        (s) => ({
          ...s,
          transactions: [...s.transactions, full],
          cashBalance: s.cashBalance + transactionCashEffect(full),
        }),
        true,
      )
    },
    [applyMutation],
  )

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      applyMutation((s) => {
        const old = s.transactions.find((t) => t.id === id)
        if (!old) return s
        const updated = { ...old, ...updates }
        const cashDelta = transactionCashEffect(updated) - transactionCashEffect(old)
        return {
          ...s,
          cashBalance: s.cashBalance + cashDelta,
          transactions: s.transactions.map((t) => (t.id === id ? updated : t)),
        }
      }, true)
    },
    [applyMutation],
  )

  const deleteTransaction = useCallback(
    (id: string) => {
      applyMutation((s) => {
        const old = s.transactions.find((t) => t.id === id)
        if (!old) return s
        return {
          ...s,
          cashBalance: s.cashBalance - transactionCashEffect(old),
          transactions: s.transactions.filter((t) => t.id !== id),
        }
      }, true)
    },
    [applyMutation],
  )

  const addProduction = useCallback(
    (item: Omit<ProductionItem, 'id'>) => {
      applyMutation(
        (s) => ({
          ...s,
          productions: [...s.productions, { ...item, id: uid() }],
        }),
        true,
      )
    },
    [applyMutation],
  )

  const updateProduction = useCallback(
    (id: string, updates: Partial<ProductionItem>) => {
      applyMutation(
        (s) => ({
          ...s,
          productions: s.productions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }),
        true,
      )
    },
    [applyMutation],
  )

  const deleteProduction = useCallback(
    (id: string) => {
      applyMutation(
        (s) => ({
          ...s,
          productions: s.productions.filter((p) => p.id !== id),
        }),
        true,
      )
    },
    [applyMutation],
  )

  const markProductionPaid = useCallback(
    (id: string) => {
      applyMutation(
        (s) => ({
          ...s,
          productions: s.productions.map((p) =>
            p.id === id ? { ...p, paidAmount: p.totalAmount } : p,
          ),
        }),
        true,
      )
    },
    [applyMutation],
  )

  const updateBudget = useCallback(
    (id: string, updates: Partial<BudgetItem>) => {
      applyMutation((s) => ({
        ...s,
        budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      }))
    },
    [applyMutation],
  )

  const addDrop = useCallback(
    (drop: Omit<DropProduct, 'id'>) => {
      applyMutation((s) => ({
        ...s,
        drops: [...s.drops, { ...drop, id: uid() }],
      }))
    },
    [applyMutation],
  )

  const updateDrop = useCallback(
    (id: string, updates: Partial<DropProduct>) => {
      applyMutation((s) => ({
        ...s,
        drops: s.drops.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      }))
    },
    [applyMutation],
  )

  const addInvestor = useCallback(
    (inv: Omit<Investor, 'id'>) => {
      applyMutation((s) => ({
        ...s,
        investors: [...s.investors, { ...inv, id: uid() }],
      }))
    },
    [applyMutation],
  )

  const updateRisk = useCallback(
    (id: string, updates: Partial<RiskItem>) => {
      applyMutation((s) => ({
        ...s,
        risks: s.risks.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }))
    },
    [applyMutation],
  )

  const updateApproval = useCallback(
    (id: string, status: ApprovalRequest['status']) => {
      applyMutation((s) => ({
        ...s,
        approvals: s.approvals.map((a) => (a.id === id ? { ...a, status } : a)),
      }))
    },
    [applyMutation],
  )

  const resetData = useCallback(async () => {
    isDirty.current = true
    const data = await resetFinanceState()
    setState(data)
    isDirty.current = false
  }, [])

  const value = useMemo(
    () => ({
      state,
      loading,
      saving,
      error,
      storageBackend,
      updateCashBalance,
      updateMinCashThreshold,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addProduction,
      updateProduction,
      deleteProduction,
      markProductionPaid,
      updateBudget,
      addDrop,
      updateDrop,
      addInvestor,
      updateRisk,
      updateApproval,
      resetData,
    }),
    [
      state,
      loading,
      saving,
      error,
      storageBackend,
      updateCashBalance,
      updateMinCashThreshold,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addProduction,
      updateProduction,
      deleteProduction,
      markProductionPaid,
      updateBudget,
      addDrop,
      updateDrop,
      addInvestor,
      updateRisk,
      updateApproval,
      resetData,
    ],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
