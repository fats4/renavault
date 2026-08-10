import { addMonths, format, startOfMonth } from 'date-fns'
import type { DropProduct, FinanceState, Transaction } from '../types'

export function getMonthlyBurn(transactions: Transaction[]): number {
  const now = new Date()
  const threeMonthsAgo = addMonths(now, -3)
  const expenses = transactions.filter(
    (t) =>
      t.type === 'expense' &&
      t.status === 'completed' &&
      new Date(t.date) >= threeMonthsAgo,
  )
  if (expenses.length === 0) return 0
  const total = expenses.reduce((sum, t) => sum + t.amount, 0)
  return total / 3
}

export function getRunwayMonths(cashBalance: number, monthlyBurn: number): number {
  if (monthlyBurn <= 0) return Infinity
  return cashBalance / monthlyBurn
}

export function getDropMargin(drop: DropProduct) {
  const revenue = drop.sellPrice * drop.units
  const cost = drop.cogs * drop.units
  const grossProfit = revenue - cost
  const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  return { revenue, cost, grossProfit, marginPercent }
}

export function getTotalRevenue(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getTotalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getNetProfit(transactions: Transaction[]): number {
  return getTotalRevenue(transactions) - getTotalExpenses(transactions)
}

export function projectCashFlow(
  state: FinanceState,
  months = 6,
  extraSpend = 0,
  extraRevenue = 0,
) {
  const projections = []
  let balance = state.cashBalance - extraSpend

  for (let i = 0; i < months; i++) {
    const monthDate = addMonths(startOfMonth(new Date()), i)
    const monthKey = format(monthDate, 'yyyy-MM')

    const scheduledIn = state.transactions
      .filter(
        (t) =>
          t.type === 'income' &&
          t.status !== 'completed' &&
          t.date.startsWith(monthKey),
      )
      .reduce((s, t) => s + t.amount, 0)

    const scheduledOut = state.transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.status !== 'completed' &&
          t.date.startsWith(monthKey),
      )
      .reduce((s, t) => s + t.amount, 0)

    const avgInflow =
      getMonthlyBurn(
        state.transactions.filter((t) => t.type === 'income'),
      ) + (i === 1 ? extraRevenue : 0)

    const avgOutflow =
      getMonthlyBurn(state.transactions.filter((t) => t.type === 'expense')) +
      (i === 1 ? extraSpend : 0)

    const inflow = scheduledIn || avgInflow
    const outflow = scheduledOut || avgOutflow
    balance += inflow - outflow

    projections.push({
      month: format(monthDate, 'MMM yyyy'),
      inflow,
      outflow,
      balance,
    })
  }

  return projections
}

export function simulateDropSpend(
  state: FinanceState,
  spendAmount: number,
  expectedRevenue: number,
  monthsUntilQuarterEnd = 3,
) {
  const monthlyBurn = getMonthlyBurn(state.transactions)
  const cashAfterSpend = state.cashBalance - spendAmount
  const netMonthly =
    expectedRevenue / monthsUntilQuarterEnd - monthlyBurn
  const runwayAfter = netMonthly < 0 ? cashAfterSpend / Math.abs(netMonthly) : Infinity
  const minRequired = monthlyBurn * monthsUntilQuarterEnd
  const isSafe = cashAfterSpend >= minRequired && cashAfterSpend > state.minCashThreshold

  return {
    cashAfterSpend,
    monthlyBurn,
    runwayAfter,
    minRequired,
    isSafe,
    shortfall: isSafe ? 0 : minRequired - cashAfterSpend,
  }
}

export function getBalanceSheet(state: FinanceState) {
  const assets = {
    cash: state.cashBalance,
    inventory: state.drops
      .filter((d) => d.status === 'production' || d.status === 'live')
      .reduce((s, d) => s + d.cogs * d.units, 0),
    receivables: state.transactions
      .filter((t) => t.type === 'income' && t.status === 'pending')
      .reduce((s, t) => s + t.amount, 0),
  }

  const liabilities = {
    payables: state.transactions
      .filter((t) => t.type === 'expense' && t.status === 'pending')
      .reduce((s, t) => s + t.amount, 0),
    loans: state.investors
      .filter((i) => i.type === 'loan' && i.status === 'active')
      .reduce((s, i) => s + i.amount, 0),
  }

  const totalAssets = assets.cash + assets.inventory + assets.receivables
  const totalLiabilities = liabilities.payables + liabilities.loans
  const equity = totalAssets - totalLiabilities

  return { assets, liabilities, totalAssets, totalLiabilities, equity }
}

export function getProfitAndLoss(transactions: Transaction[]) {
  const revenue = transactions
    .filter((t) => t.type === 'income' && t.status === 'completed')
    .reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      },
      {} as Record<string, number>,
    )

  const expenses = transactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      },
      {} as Record<string, number>,
    )

  const totalRevenue = Object.values(revenue).reduce((s, v) => s + v, 0)
  const totalExpenses = Object.values(expenses).reduce((s, v) => s + v, 0)

  return { revenue, expenses, totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses }
}
