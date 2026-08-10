import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Wallet, TrendingUp, AlertTriangle, Package } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { StatCard, Card, Badge } from '../components/ui'
import { formatCurrency, formatPercent } from '../lib/format'
import {
  getMonthlyBurn,
  getRunwayMonths,
  getNetProfit,
  projectCashFlow,
  getDropMargin,
} from '../lib/calculations'

export function DashboardPage() {
  const { state } = useFinance()
  const monthlyBurn = getMonthlyBurn(state.transactions)
  const runway = getRunwayMonths(state.cashBalance, monthlyBurn)
  const netProfit = getNetProfit(state.transactions)
  const projections = projectCashFlow(state, 6)
  const pendingApprovals = state.approvals.filter((a) => a.status === 'pending')
  const criticalRisks = state.risks.filter(
    (r) => r.severity === 'critical' || r.severity === 'high',
  )
  const activeDrops = state.drops.filter((d) => d.status === 'production' || d.status === 'live')
  const avgMargin =
    state.drops.reduce((s, d) => s + getDropMargin(d).marginPercent, 0) / state.drops.length

  const cashAlert = state.cashBalance < state.minCashThreshold * 2

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="mt-1 text-sm text-surface-500">
          Ringkasan kesehatan finansial brand — Agustus 2026
        </p>
      </div>

      {cashAlert && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-warning">
            Cash mendekati batas minimum. Review treasury & timing produksi drop berikutnya.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Cash Balance"
          value={formatCurrency(state.cashBalance, true)}
          change={`Min. threshold: ${formatCurrency(state.minCashThreshold, true)}`}
          trend={state.cashBalance > state.minCashThreshold * 3 ? 'up' : 'down'}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Runway"
          value={runway === Infinity ? '∞' : `${runway.toFixed(1)} bln`}
          change={`Burn rate: ${formatCurrency(monthlyBurn, true)}/bln`}
          trend={runway > 6 ? 'up' : runway > 3 ? 'neutral' : 'down'}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Net Profit YTD"
          value={formatCurrency(netProfit, true)}
          trend={netProfit > 0 ? 'up' : 'down'}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Avg. Margin"
          value={formatPercent(avgMargin)}
          change={`${activeDrops.length} drop aktif`}
          trend={avgMargin > 50 ? 'up' : 'neutral'}
          icon={<Package className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Proyeksi Cashflow" subtitle="6 bulan ke depan" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={projections}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a962" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c9a962" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#323344" />
              <XAxis dataKey="month" tick={{ fill: '#4a4b5c', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#4a4b5c', fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1e6).toFixed(0)}jt`}
              />
              <Tooltip
                contentStyle={{ background: '#1c1d28', border: '1px solid #323344', borderRadius: 8 }}
                formatter={(value) => formatCurrency(Number(value ?? 0))}
              />
              <Area type="monotone" dataKey="balance" stroke="#c9a962" fill="url(#balanceGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <div className="space-y-4">
          <Card title="Approval Pending" subtitle={`${pendingApprovals.length} menunggu`}>
            <div className="space-y-3">
              {pendingApprovals.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-surface-800 p-3">
                  <div>
                    <p className="text-xs font-medium text-white">{a.title}</p>
                    <p className="text-[10px] text-surface-500">{a.requester}</p>
                  </div>
                  <span className="font-mono text-xs text-accent">{formatCurrency(a.amount, true)}</span>
                </div>
              ))}
              {pendingApprovals.length === 0 && (
                <p className="text-xs text-surface-500">Tidak ada approval pending</p>
              )}
            </div>
          </Card>

          <Card title="Risiko Kritis" subtitle={`${criticalRisks.length} item`}>
            <div className="space-y-2">
              {criticalRisks.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-start gap-2 rounded-lg bg-surface-800 p-3">
                  <Badge variant={r.severity === 'critical' ? 'danger' : 'warning'}>
                    {r.severity}
                  </Badge>
                  <p className="text-xs text-surface-300">{r.title}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card title="Budget vs Actual — Q2 2026">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={state.budgets} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#323344" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#4a4b5c', fontSize: 11 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}jt`} />
            <YAxis type="category" dataKey="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={140} />
            <Tooltip
              contentStyle={{ background: '#1c1d28', border: '1px solid #323344', borderRadius: 8 }}
              formatter={(value) => formatCurrency(Number(value ?? 0))}
            />
            <Bar dataKey="planned" fill="#323344" name="Planned" radius={[0, 4, 4, 0]} />
            <Bar dataKey="actual" fill="#c9a962" name="Actual" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
