import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { Card, Button, Input, RupiahInput, Select, StatCard, Badge } from '../components/ui'
import { formatCurrency, formatPercent, parseInputNumber } from '../lib/format'
import { getMonthlyBurn, getRunwayMonths, getNetProfit } from '../lib/calculations'

export function FundraisingPage() {
  const { state, addInvestor } = useFinance()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'angel' as const,
    amount: '',
    equity: '',
    date: '',
    status: 'prospect' as const,
  })

  const monthlyBurn = getMonthlyBurn(state.transactions)
  const runway = getRunwayMonths(state.cashBalance, monthlyBurn)
  const netProfit = getNetProfit(state.transactions)
  const totalRaised = state.investors
    .filter((i) => i.status === 'active')
    .reduce((s, i) => s + i.amount, 0)
  const totalEquity = state.investors
    .filter((i) => i.status === 'active' && i.type !== 'loan')
    .reduce((s, i) => s + i.equity, 0)

  const impliedValuation = totalEquity > 0 ? totalRaised / (totalEquity / 100) : 0

  const readiness = [
    { label: 'Pembukuan rapi & auditable', done: netProfit !== 0 },
    { label: 'Runway > 6 bulan', done: runway > 6 },
    { label: 'Margin positif per drop', done: true },
    { label: 'Cap table terdokumentasi', done: state.investors.length > 0 },
    { label: 'Laporan keuangan bulanan', done: true },
    { label: 'Proyeksi 12-24 bulan', done: true },
    { label: 'Legal entity & compliance', done: false },
    { label: 'Data room siap', done: false },
  ]
  const readinessScore = (readiness.filter((r) => r.done).length / readiness.length) * 100

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    addInvestor({
      ...form,
      amount: parseInputNumber(form.amount),
      equity: parseInputNumber(form.equity),
    })
    setForm({ name: '', type: 'angel', amount: '', equity: '', date: '', status: 'prospect' })
    setShowForm(false)
  }

  const typeLabel: Record<string, string> = {
    angel: 'Angel',
    vc: 'VC',
    strategic: 'Strategic',
    loan: 'Pinjaman',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Fundraising & Investor Relations</h2>
          <p className="mt-1 text-sm text-surface-500">
            Siapkan angka, cap table, dan metrik untuk negosiasi investor
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Tutup' : '+ Tambah Investor'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Raised" value={formatCurrency(totalRaised, true)} />
        <StatCard label="Implied Valuation" value={formatCurrency(impliedValuation, true)} />
        <StatCard label="Monthly Burn" value={formatCurrency(monthlyBurn, true)} trend="down" />
        <StatCard
          label="Fundraising Readiness"
          value={formatPercent(readinessScore, 0)}
          trend={readinessScore > 70 ? 'up' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Readiness Checklist */}
        <Card title="Fundraising Readiness" subtitle="Checklist kesiapan">
          <div className="space-y-3">
            {readiness.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-surface-500" />
                )}
                <span className={`text-sm ${item.done ? 'text-surface-300' : 'text-surface-500'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Key Metrics for Investors */}
        <Card title="Key Metrics" subtitle="Yang ditanyain investor" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: 'MRR / Revenue', value: formatCurrency(netProfit + monthlyBurn * 3, true) },
              { label: 'Burn Rate', value: `${formatCurrency(monthlyBurn, true)}/mo` },
              { label: 'Runway', value: runway === Infinity ? '∞' : `${runway.toFixed(1)} mo` },
              { label: 'Gross Margin', value: '~62%' },
              { label: 'Cash', value: formatCurrency(state.cashBalance, true) },
              { label: 'Total Equity Given', value: formatPercent(totalEquity, 0) },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-surface-800 p-3">
                <p className="text-[10px] uppercase text-surface-500">{m.label}</p>
                <p className="mt-1 font-mono text-sm font-semibold text-white">{m.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {showForm && (
        <Card title="Tambah Investor / Pinjaman">
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Nama" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Select
              label="Tipe"
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v as typeof form.type })}
              options={[
                { value: 'angel', label: 'Angel Investor' },
                { value: 'vc', label: 'Venture Capital' },
                { value: 'strategic', label: 'Strategic Partner' },
                { value: 'loan', label: 'Pinjaman / Debt' },
              ]}
            />
            <RupiahInput label="Amount (Rp)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
            <Input label="Equity (%)" value={form.equity} onChange={(v) => setForm({ ...form, equity: v })} type="number" />
            <Input label="Tanggal" value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" />
            <Select
              label="Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v as typeof form.status })}
              options={[
                { value: 'prospect', label: 'Prospect' },
                { value: 'active', label: 'Active' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
            <div className="flex items-end">
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Cap Table */}
      <Card title="Cap Table & Funding History">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-left text-xs uppercase tracking-wider text-surface-500">
                <th className="pb-3 pr-4">Investor</th>
                <th className="pb-3 pr-4">Tipe</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Equity</th>
                <th className="pb-3 pr-4">Tanggal</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.investors.map((inv) => (
                <tr key={inv.id} className="border-b border-surface-800">
                  <td className="py-3 pr-4 font-medium text-white">{inv.name}</td>
                  <td className="py-3 pr-4">
                    <Badge variant="info">{typeLabel[inv.type]}</Badge>
                  </td>
                  <td className="py-3 pr-4 font-mono text-white">{formatCurrency(inv.amount)}</td>
                  <td className="py-3 pr-4 font-mono text-accent">
                    {inv.equity > 0 ? formatPercent(inv.equity, 0) : '—'}
                  </td>
                  <td className="py-3 pr-4 text-surface-400">{inv.date}</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        inv.status === 'active' ? 'success' : inv.status === 'prospect' ? 'warning' : 'default'
                      }
                    >
                      {inv.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
