import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { Card, Button, Input, RupiahInput, Select, StatCard, Badge } from '../components/ui'
import { formatCurrency, formatDate, parseInputNumber } from '../lib/format'
import { getMonthlyBurn, getRunwayMonths } from '../lib/calculations'

export function TreasuryPage() {
  const { state, addTransaction, updateMinCashThreshold } = useFinance()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: 'Operasional',
    date: new Date().toISOString().split('T')[0],
    status: 'scheduled' as 'pending' | 'completed' | 'scheduled',
  })

  const monthlyBurn = getMonthlyBurn(state.transactions)
  const runway = getRunwayMonths(state.cashBalance, monthlyBurn)

  const scheduled = state.transactions
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => a.date.localeCompare(b.date))

  const completed = state.transactions
    .filter((t) => t.status === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date))

  const totalScheduledIn = scheduled
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const totalScheduledOut = scheduled
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addTransaction({
      ...form,
      amount: parseInputNumber(form.amount),
    })
    setForm({ ...form, description: '', amount: '' })
    setShowForm(false)
  }

  const isLowCash = state.cashBalance < state.minCashThreshold

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Cash & Treasury</h2>
          <p className="mt-1 text-sm text-surface-500">
            Kelola timing uang masuk-keluar — jangan kehabisan cash sebelum revenue masuk
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Tutup' : '+ Transaksi Baru'}
        </Button>
      </div>

      {isLowCash && (
        <div className="flex items-center gap-3 rounded-xl border border-negative/30 bg-negative/10 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-negative" />
          <p className="text-sm text-negative">
            Cash di bawah threshold minimum ({formatCurrency(state.minCashThreshold)})!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cash Balance" value={formatCurrency(state.cashBalance, true)} />
        <StatCard
          label="Runway"
          value={runway === Infinity ? '∞' : `${runway.toFixed(1)} bulan`}
          trend={runway > 6 ? 'up' : 'down'}
        />
        <StatCard
          label="Scheduled Inflow"
          value={formatCurrency(totalScheduledIn, true)}
          trend="up"
        />
        <StatCard
          label="Scheduled Outflow"
          value={formatCurrency(totalScheduledOut, true)}
          trend="down"
        />
      </div>

      {showForm && (
        <Card title="Tambah Transaksi">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Deskripsi"
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
            />
            <RupiahInput
              label="Jumlah (Rp)"
              value={form.amount}
              onChange={(v) => setForm({ ...form, amount: v })}
            />
            <Select
              label="Tipe"
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v as 'income' | 'expense' })}
              options={[
                { value: 'income', label: 'Uang Masuk' },
                { value: 'expense', label: 'Uang Keluar' },
              ]}
            />
            <Select
              label="Kategori"
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              options={[
                { value: 'Penjualan', label: 'Penjualan' },
                { value: 'COGS', label: 'COGS / Produksi' },
                { value: 'Operasional', label: 'Operasional' },
                { value: 'Marketing', label: 'Marketing' },
              ]}
            />
            <Input
              label="Tanggal"
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
              type="date"
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v as typeof form.status })}
              options={[
                { value: 'completed', label: 'Selesai' },
                { value: 'scheduled', label: 'Terjadwal' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <Button type="submit">Simpan Transaksi</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Threshold Minimum Cash">
        <div className="flex items-center gap-4">
          <RupiahInput
            label="Set minimum cash (Rp)"
            value={state.minCashThreshold}
            onChange={(v) => updateMinCashThreshold(parseInputNumber(v))}
          />
          <p className="text-sm text-surface-400">
            Current: <span className="font-mono text-white">{formatCurrency(state.minCashThreshold)}</span>
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Jadwal Uang Masuk & Keluar" subtitle="Transaksi terjadwal & pending">
          <div className="space-y-2">
            {scheduled.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg bg-surface-800 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {t.type === 'income' ? (
                    <ArrowDownLeft className="h-4 w-4 text-positive" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-negative" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{t.description}</p>
                    <p className="text-xs text-surface-500">
                      {formatDate(t.date)} · {t.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-mono text-sm font-semibold ${t.type === 'income' ? 'text-positive' : 'text-negative'}`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount, true)}
                  </p>
                  <Badge variant={t.status === 'pending' ? 'warning' : 'info'}>{t.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Riwayat Transaksi" subtitle="Transaksi selesai">
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {completed.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg bg-surface-800/50 px-4 py-2.5"
              >
                <div>
                  <p className="text-sm text-surface-300">{t.description}</p>
                  <p className="text-xs text-surface-500">{formatDate(t.date)}</p>
                </div>
                <span
                  className={`font-mono text-sm ${t.type === 'income' ? 'text-positive' : 'text-negative'}`}
                >
                  {t.type === 'income' ? '+' : '-'}
                  {formatCurrency(t.amount, true)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
