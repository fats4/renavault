export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  date: string
  description: string
  category: string
  amount: number
  type: TransactionType
  status: 'pending' | 'completed' | 'scheduled'
}

export interface ProductionItem {
  id: string
  name: string
  vendor: string
  totalAmount: number
  paidAmount: number
  startDate: string
  notes: string
}

export interface BudgetItem {
  id: string
  category: string
  planned: number
  actual: number
  quarter: string
}

export interface DropProduct {
  id: string
  name: string
  sku: string
  cogs: number
  sellPrice: number
  units: number
  dropDate: string
  status: 'planning' | 'production' | 'live' | 'sold_out'
}

export interface CashFlowProjection {
  month: string
  inflow: number
  outflow: number
  balance: number
}

export interface Investor {
  id: string
  name: string
  type: 'angel' | 'vc' | 'strategic' | 'loan'
  amount: number
  equity: number
  date: string
  status: 'active' | 'prospect' | 'closed'
}

export interface RiskItem {
  id: string
  title: string
  category: 'fraud' | 'leakage' | 'commitment' | 'compliance'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'mitigated' | 'resolved'
  description: string
  owner: string
}

export interface ApprovalRequest {
  id: string
  title: string
  amount: number
  requester: string
  date: string
  status: 'pending' | 'approved' | 'rejected'
  category: string
}

export interface FinanceState {
  cashBalance: number
  transactions: Transaction[]
  productions: ProductionItem[]
  budgets: BudgetItem[]
  drops: DropProduct[]
  investors: Investor[]
  risks: RiskItem[]
  approvals: ApprovalRequest[]
  taxRate: number
  minCashThreshold: number
}

export type ModuleId =
  | 'dashboard'
  | 'fpa'
  | 'treasury'
  | 'accounting'
  | 'pricing'
  | 'fundraising'
  | 'risk'
