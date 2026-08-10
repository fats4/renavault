import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { Card, Input, RupiahInput, StatCard } from '../components/ui'
import { formatCurrency, formatPercent, formatRupiahInput, parseInputNumber } from '../lib/format'
import { projectCashFlow, simulateDropSpend } from '../lib/calculations'

export function FPAPage() {
  const { state, updateBudget } = useFinance()
  const [spendAmount, setSpendAmount] = useState('')
  const [expectedRevenue, setExpectedRevenue] = useState('')
  const [monthsAhead, setMonthsAhead] = useState('3')

  const spend = parseInputNumber(spendAmount)
  const revenue = parseInputNumber(expectedRevenue)
  const months = parseInt(monthsAhead) || 3

  const simulation = simulateDropSpend(state, spend, revenue, months)
  const projections = projectCashFlow(state, 6, spend, revenue)

  const totalPlanned = state.budgets.reduce((s, b) => s + b.planned, 0)
  const totalActual = state.budgets.reduce((s, b) => s + b.actual, 0)
  const utilization = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Financial Planning & Analysis</h2>
        <p className="mt-1 text-sm text-surface-500">
          Budget, proyeksi cashflow, forecast revenue, dan scenario planning
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Budget Q2" value={formatCurrency(totalPlanned, true)} />
        <StatCard
          label="Utilization"
          value={formatPercent(utilization)}
          trend={utilization > 90 ? 'down' : 'up'}
        />
        <StatCard label="Forecast Revenue Q2" value={formatCurrency(revenue, true)} />
      </div>

      {/* Scenario Simulator */}
      <Card
        title="Scenario Simulator"
        subtitle="Kalau spend X di produksi drop bulan depan, aman sampai Q berikutnya?"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <RupiahInput
              label="Spend Produksi Drop (Rp)"
              value={spendAmount}
              onChange={setSpendAmount}
            />
            <RupiahInput
              label="Expected Revenue Drop (Rp)"
              value={expectedRevenue}
              onChange={setExpectedRevenue}
            />
            <Input
              label="Bulan sampai akhir quarter"
              value={monthsAhead}
              onChange={setMonthsAhead}
              type="number"
            />
          </div>

          <div
            className={`rounded-xl border p-5 ${
              simulation.isSafe
                ? 'border-positive/30 bg-positive/5'
                : 'border-negative/30 bg-negative/5'
            }`}
          >
            <div className="flex items-center gap-3">
              {simulation.isSafe ? (
                <CheckCircle2 className="h-8 w-8 text-positive" />
              ) : (
                <XCircle className="h-8 w-8 text-negative" />
              )}
              <div>
                <p className="text-lg font-semibold text-white">
                  {simulation.isSafe ? 'AMAN ✓' : 'TIDAK AMAN ✗'}
                </p>
                <p className="text-sm text-surface-400">
                  {simulation.isSafe
                    ? `Cash cukup untuk operasional ${months} bulan ke depan`
                    : `Kekurangan ${formatCurrency(simulation.shortfall)} untuk aman`}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-800 p-3">
                <p className="text-[10px] uppercase text-surface-500">Cash setelah spend</p>
                <p className="font-mono text-sm font-semibold text-white">
                  {formatCurrency(simulation.cashAfterSpend)}
                </p>
              </div>
              <div className="rounded-lg bg-surface-800 p-3">
                <p className="text-[10px] uppercase text-surface-500">Min. cash required</p>
                <p className="font-mono text-sm font-semibold text-white">
                  {formatCurrency(simulation.minRequired)}
                </p>
              </div>
              <div className="rounded-lg bg-surface-800 p-3">
                <p className="text-[10px] uppercase text-surface-500">Monthly burn</p>
                <p className="font-mono text-sm font-semibold text-white">
                  {formatCurrency(simulation.monthlyBurn)}
                </p>
              </div>
              <div className="rounded-lg bg-surface-800 p-3">
                <p className="text-[10px] uppercase text-surface-500">Runway after spend</p>
                <p className="font-mono text-sm font-semibold text-white">
                  {simulation.runwayAfter === Infinity
                    ? '∞'
                    : `${simulation.runwayAfter.toFixed(1)} bln`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Cashflow Projection */}
      <Card title="Proyeksi Cashflow" subtitle="Dengan scenario spend & revenue di atas">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={projections}>
            <CartesianGrid strokeDasharray="3 3" stroke="#323344" />
            <XAxis dataKey="month" tick={{ fill: '#4a4b5c', fontSize: 11 }} />
            <YAxis tick={{ fill: '#4a4b5c', fontSize: 11 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}jt`} />
            <Tooltip
              contentStyle={{ background: '#1c1d28', border: '1px solid #323344', borderRadius: 8 }}
              formatter={(value) => formatCurrency(Number(value ?? 0))}
            />
            <Legend />
            <Line type="monotone" dataKey="inflow" stroke="#34d399" name="Inflow" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="outflow" stroke="#f87171" name="Outflow" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="balance" stroke="#c9a962" name="Balance" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Budget Table */}
      <Card title="Budget Planner — Q2 2026">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-left text-xs uppercase tracking-wider text-surface-500">
                <th className="pb-3 pr-4">Kategori</th>
                <th className="pb-3 pr-4">Planned</th>
                <th className="pb-3 pr-4">Actual</th>
                <th className="pb-3 pr-4">Variance</th>
                <th className="pb-3">Progress</th>
              </tr>
            </thead>
            <tbody>
              {state.budgets.map((b) => {
                const variance = b.planned - b.actual
                const pct = b.planned > 0 ? (b.actual / b.planned) * 100 : 0
                return (
                  <tr key={b.id} className="border-b border-surface-800">
                    <td className="py-3 pr-4 font-medium text-white">{b.category}</td>
                    <td className="py-3 pr-4 font-mono text-surface-300">
                      {formatCurrency(b.planned)}
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatRupiahInput(b.actual)}
                        onChange={(e) =>
                          updateBudget(b.id, { actual: parseInputNumber(e.target.value) })
                        }
                        className="w-36 rounded border border-surface-600 bg-surface-800 px-2 py-1 font-mono text-sm text-white"
                      />
                    </td>
                    <td className="py-3 pr-4 font-mono">
                      <span className={variance >= 0 ? 'text-positive' : 'text-negative'}>
                        {variance >= 0 ? '+' : ''}
                        {formatCurrency(variance)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-700">
                          <div
                            className={`h-full rounded-full ${pct > 100 ? 'bg-negative' : 'bg-accent'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs text-surface-400">
                          {formatPercent(pct, 0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
