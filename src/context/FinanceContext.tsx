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

  useEffect(() => {
    readyToSave.current = false
    setLoading(true)

    const unsubscribe = subscribeFinanceState(
      (data) => {
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
    if (!readyToSave.current || loading) return

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

  const updateCashBalance = useCallback((amount: number) => {
    setState((s) => ({ ...s, cashBalance: amount }))
  }, [])

  const updateMinCashThreshold = useCallback((amount: number) => {
    setState((s) => ({ ...s, minCashThreshold: amount }))
  }, [])

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    const full = { ...tx, id: uid() }
    setState((s) => ({
      ...s,
      transactions: [...s.transactions, full],
      cashBalance: s.cashBalance + transactionCashEffect(full),
    }))
  }, [])

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setState((s) => {
      const old = s.transactions.find((t) => t.id === id)
      if (!old) return s
      const updated = { ...old, ...updates }
      const cashDelta = transactionCashEffect(updated) - transactionCashEffect(old)
      return {
        ...s,
        cashBalance: s.cashBalance + cashDelta,
        transactions: s.transactions.map((t) => (t.id === id ? updated : t)),
      }
    })
  }, [])

  const deleteTransaction = useCallback((id: string) => {
    setState((s) => {
      const old = s.transactions.find((t) => t.id === id)
      if (!old) return s
      return {
        ...s,
        cashBalance: s.cashBalance - transactionCashEffect(old),
        transactions: s.transactions.filter((t) => t.id !== id),
      }
    })
  }, [])

  const addProduction = useCallback((item: Omit<ProductionItem, 'id'>) => {
    setState((s) => ({
      ...s,
      productions: [...s.productions, { ...item, id: uid() }],
    }))
  }, [])

  const updateProduction = useCallback((id: string, updates: Partial<ProductionItem>) => {
    setState((s) => ({
      ...s,
      productions: s.productions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  }, [])

  const deleteProduction = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      productions: s.productions.filter((p) => p.id !== id),
    }))
  }, [])

  const markProductionPaid = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      productions: s.productions.map((p) =>
        p.id === id ? { ...p, paidAmount: p.totalAmount } : p,
      ),
    }))
  }, [])

  const updateBudget = useCallback((id: string, updates: Partial<BudgetItem>) => {
    setState((s) => ({
      ...s,
      budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }))
  }, [])

  const addDrop = useCallback((drop: Omit<DropProduct, 'id'>) => {
    setState((s) => ({
      ...s,
      drops: [...s.drops, { ...drop, id: uid() }],
    }))
  }, [])

  const updateDrop = useCallback((id: string, updates: Partial<DropProduct>) => {
    setState((s) => ({
      ...s,
      drops: s.drops.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }))
  }, [])

  const addInvestor = useCallback((inv: Omit<Investor, 'id'>) => {
    setState((s) => ({
      ...s,
      investors: [...s.investors, { ...inv, id: uid() }],
    }))
  }, [])

  const updateRisk = useCallback((id: string, updates: Partial<RiskItem>) => {
    setState((s) => ({
      ...s,
      risks: s.risks.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }))
  }, [])

  const updateApproval = useCallback((id: string, status: ApprovalRequest['status']) => {
    setState((s) => ({
      ...s,
      approvals: s.approvals.map((a) => (a.id === id ? { ...a, status } : a)),
    }))
  }, [])

  const resetData = useCallback(async () => {
    const data = await resetFinanceState()
    setState(data)
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
