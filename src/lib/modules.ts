import type {
  ApprovalRequest,
  BudgetItem,
  DropProduct,
  FinanceState,
  Investor,
  RiskItem,
  Transaction,
} from '../types'
import { SEED_DATA } from './seedData'

export const MODULE_IDS = [
  'fpa',
  'treasury',
  'accounting',
  'pricing',
  'fundraising',
  'risk',
] as const

export type ModuleId = (typeof MODULE_IDS)[number]

export interface FPAModule {
  budgets: BudgetItem[]
}

export interface TreasuryModule {
  cashBalance: number
  minCashThreshold: number
  transactions: Transaction[]
}

export interface AccountingModule {
  taxRate: number
}

export interface PricingModule {
  drops: DropProduct[]
}

export interface FundraisingModule {
  investors: Investor[]
}

export interface RiskModule {
  risks: RiskItem[]
  approvals: ApprovalRequest[]
}

export type ModuleDocMap = {
  fpa: FPAModule
  treasury: TreasuryModule
  accounting: AccountingModule
  pricing: PricingModule
  fundraising: FundraisingModule
  risk: RiskModule
}

export function splitState(state: FinanceState): ModuleDocMap {
  return {
    fpa: { budgets: state.budgets },
    treasury: {
      cashBalance: state.cashBalance,
      minCashThreshold: state.minCashThreshold,
      transactions: state.transactions,
    },
    accounting: { taxRate: state.taxRate },
    pricing: { drops: state.drops },
    fundraising: { investors: state.investors },
    risk: { risks: state.risks, approvals: state.approvals },
  }
}

export function mergeModules(parts: Partial<ModuleDocMap>): FinanceState {
  return {
    budgets: parts.fpa?.budgets ?? SEED_DATA.budgets,
    cashBalance: parts.treasury?.cashBalance ?? SEED_DATA.cashBalance,
    minCashThreshold: parts.treasury?.minCashThreshold ?? SEED_DATA.minCashThreshold,
    transactions: parts.treasury?.transactions ?? SEED_DATA.transactions,
    taxRate: parts.accounting?.taxRate ?? SEED_DATA.taxRate,
    drops: parts.pricing?.drops ?? SEED_DATA.drops,
    investors: parts.fundraising?.investors ?? SEED_DATA.investors,
    risks: parts.risk?.risks ?? SEED_DATA.risks,
    approvals: parts.risk?.approvals ?? SEED_DATA.approvals,
  }
}

export function getModuleLabel(id: ModuleId): string {
  const labels: Record<ModuleId, string> = {
    fpa: 'FP&A',
    treasury: 'Treasury',
    accounting: 'Accounting',
    pricing: 'Pricing',
    fundraising: 'Fundraising',
    risk: 'Risk & Controls',
  }
  return labels[id]
}
