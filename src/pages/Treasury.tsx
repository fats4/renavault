import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Pencil,
  Trash2,
  Check,
  Factory,
} from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { Card, Button, Input, RupiahInput, Select, StatCard, Badge } from '../components/ui'
import { formatCurrency, formatDate, formatRupiahInput, parseInputNumber } from '../lib/format'
import { getMonthlyBurn, getRunwayMonths } from '../lib/calculations'
import type { ProductionItem, Transaction } from '../types'

const emptyTxForm = {
  description: '',
  amount: '',
  type: 'expense' as 'income' | 'expense',
  category: 'Operasional',
  date: new Date().toISOString().split('T')[0],
  status: 'scheduled' as Transaction['status'],
}

const emptyProdForm = {
  name: '',
  vendor: '',
  totalAmount: '',
  paidAmount: '',
  dueDate: new Date().toISOString().split('T')[0],
  notes: '',
}

export function TreasuryPage() {
  const {
    state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addProduction,
    updateProduction,
    deleteProduction,
    markProductionPaid,
    updateMinCashThreshold,
  } = useFinance()

  const [showTxForm, setShowTxForm] = useState(false)
  const [showProdForm, setShowProdForm] = useState(false)
  const [txForm, setTxForm] = useState(emptyTxForm)
  const [prodForm, setProdForm] = useState(emptyProdForm)
  const [editingTxId, setEditingTxId] = useState<string | null>(null)
  const [editingProdId, setEditingProdId] = useState<string | null>(null)

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

  const totalProductionOutstanding = state.productions.reduce(
    (s, p) => s + Math.max(p.totalAmount - p.paidAmount, 0),
    0,
  )

  const startEditTx = (t: Transaction) => {
    setEditingTxId(t.id)
    setTxForm({
      description: t.description,
      amount: formatRupiahInput(t.amount),
      type: t.type,
      category: t.category,
      date: t.date,
      status: t.status,
    })
    setShowTxForm(true)
  }

  const startEditProd = (p: ProductionItem) => {
    setEditingProdId(p.id)
    setProdForm({
      name: p.name,
      vendor: p.vendor,
      totalAmount: formatRupiahInput(p.totalAmount),
      paidAmount: formatRupiahInput(p.paidAmount),
      dueDate: p.dueDate,
      notes: p.notes,
    })
    setShowProdForm(true)
  }

  const resetTxForm = () => {
    setTxForm(emptyTxForm)
    setEditingTxId(null)
    setShowTxForm(false)
  }

  const resetProdForm = () => {
    setProdForm(emptyProdForm)
    setEditingProdId(null)
    setShowProdForm(false)
  }

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...txForm,
      amount: parseInputNumber(txForm.amount),
    }
    if (editingTxId) {
      updateTransaction(editingTxId, payload)
    } else {
      addTransaction(payload)
    }
    resetTxForm()
  }

  const handleProdSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const total = parseInputNumber(prodForm.totalAmount)
    const paid = Math.min(parseInputNumber(prodForm.paidAmount), total)
    const payload = {
      name: prodForm.name,
      vendor: prodForm.vendor,
      totalAmount: total,
      paidAmount: paid,
      dueDate: prodForm.dueDate,
      notes: prodForm.notes,
    }
    if (editingProdId) {
      updateProduction(editingProdId, payload)
    } else {
      addProduction(payload)
    }
    resetProdForm()
  }

  const handleDeleteTx = (t: Transaction) => {
    if (confirm(`Hapus transaksi "${t.description}"?`)) deleteTransaction(t.id)
  }

  const handleDeleteProd = (p: ProductionItem) => {
    if (confirm(`Hapus produksi "${p.name}"?`)) deleteProduction(p.id)
  }

  const isLowCash = state.cashBalance < state.minCashThreshold

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Cash & Treasury</h2>
          <p className="mt-1 text-sm text-surface-500">
            Kelola timing uang masuk-keluar — jangan kehabisan cash sebelum revenue masuk
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              resetProdForm()
              setShowProdForm(!showProdForm)
            }}
          >
            {showProdForm ? 'Tutup' : '+ Produksi'}
          </Button>
          <Button
            onClick={() => {
              if (showTxForm && !editingTxId) setShowTxForm(false)
              else {
                resetTxForm()
                setShowTxForm(true)
              }
            }}
          >
            {showTxForm && !editingTxId ? 'Tutup' : '+ Transaksi'}
          </Button>
        </div>
      </div>

      {isLowCash && (
        <div className="flex items-center gap-3 rounded-xl border border-negative/30 bg-negative/10 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-negative" />
          <p className="text-sm text-negative">
            Cash di bawah threshold minimum ({formatCurrency(state.minCashThreshold)})!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Cash Balance" value={formatCurrency(state.cashBalance, true)} />
        <StatCard
          label="Runway"
          value={runway === Infinity ? '∞' : `${runway.toFixed(1)} bulan`}
          trend={runway > 6 ? 'up' : 'down'}
        />
        <StatCard label="Scheduled Inflow" value={formatCurrency(totalScheduledIn, true)} trend="up" />
        <StatCard label="Scheduled Outflow" value={formatCurrency(totalScheduledOut, true)} trend="down" />
        <StatCard
          label="Sisa Produksi"
          value={formatCurrency(totalProductionOutstanding, true)}
          trend={totalProductionOutstanding > 0 ? 'down' : 'up'}
        />
      </div>

      {showProdForm && (
        <Card title={editingProdId ? 'Edit Produksi' : 'Tambah Produksi'}>
          <form onSubmit={handleProdSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Nama / Drop" value={prodForm.name} onChange={(v) => setProdForm({ ...prodForm, name: v })} />
            <Input label="Vendor" value={prodForm.vendor} onChange={(v) => setProdForm({ ...prodForm, vendor: v })} />
            <RupiahInput label="Total (Rp)" value={prodForm.totalAmount} onChange={(v) => setProdForm({ ...prodForm, totalAmount: v })} />
            <RupiahInput label="Sudah Dibayar (Rp)" value={prodForm.paidAmount} onChange={(v) => setProdForm({ ...prodForm, paidAmount: v })} />
            <Input label="Jatuh Tempo" value={prodForm.dueDate} onChange={(v) => setProdForm({ ...prodForm, dueDate: v })} type="date" />
            <Input label="Catatan" value={prodForm.notes} onChange={(v) => setProdForm({ ...prodForm, notes: v })} />
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit">{editingProdId ? 'Simpan Perubahan' : 'Simpan Produksi'}</Button>
              <Button type="button" variant="ghost" onClick={resetProdForm}>
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Produksi" subtitle="Tracking pembayaran vendor — total, sudah dibayar, sisa">
        {state.productions.length === 0 ? (
          <p className="text-sm text-surface-500">Belum ada data produksi.</p>
        ) : (
          <div className="space-y-3">
            {state.productions.map((p) => {
              const remaining = Math.max(p.totalAmount - p.paidAmount, 0)
              const isPaid = remaining === 0
              return (
                <div key={p.id} className="rounded-xl border border-surface-700 bg-surface-800 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                        <Factory className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{p.name}</p>
                        <p className="text-xs text-surface-500">
                          {p.vendor} · Jatuh tempo {formatDate(p.dueDate)}
                        </p>
                        {p.notes && <p className="mt-1 text-xs text-surface-400">{p.notes}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditProd(p)}
                        className="rounded-lg p-2 text-surface-400 hover:bg-surface-700 hover:text-white"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProd(p)}
                        className="rounded-lg p-2 text-surface-400 hover:bg-negative/15 hover:text-negative"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-surface-500">Total</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-white">
                        {formatCurrency(p.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-surface-500">Sudah Dibayar</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-positive">
                        {formatCurrency(p.paidAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-surface-500">Sisa</p>
                      <p className={`mt-1 font-mono text-sm font-semibold ${isPaid ? 'text-positive' : 'text-warning'}`}>
                        {formatCurrency(remaining)}
                      </p>
                    </div>
                  </div>

                  {!isPaid && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-3 border-positive/30 text-positive hover:bg-positive/10"
                      onClick={() => markProductionPaid(p.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Tandai Lunas
                    </Button>
                  )}
                  {isPaid && <Badge variant="success">Lunas</Badge>}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {showTxForm && (
        <Card title={editingTxId ? 'Edit Transaksi' : 'Tambah Transaksi'}>
          <form onSubmit={handleTxSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Deskripsi" value={txForm.description} onChange={(v) => setTxForm({ ...txForm, description: v })} />
            <RupiahInput label="Jumlah (Rp)" value={txForm.amount} onChange={(v) => setTxForm({ ...txForm, amount: v })} />
            <Select
              label="Tipe"
              value={txForm.type}
              onChange={(v) => setTxForm({ ...txForm, type: v as 'income' | 'expense' })}
              options={[
                { value: 'income', label: 'Uang Masuk' },
                { value: 'expense', label: 'Uang Keluar' },
              ]}
            />
            <Select
              label="Kategori"
              value={txForm.category}
              onChange={(v) => setTxForm({ ...txForm, category: v })}
              options={[
                { value: 'Penjualan', label: 'Penjualan' },
                { value: 'COGS', label: 'COGS / Produksi' },
                { value: 'Operasional', label: 'Operasional' },
                { value: 'Marketing', label: 'Marketing' },
              ]}
            />
            <Input label="Tanggal" value={txForm.date} onChange={(v) => setTxForm({ ...txForm, date: v })} type="date" />
            <Select
              label="Status"
              value={txForm.status}
              onChange={(v) => setTxForm({ ...txForm, status: v as Transaction['status'] })}
              options={[
                { value: 'completed', label: 'Selesai' },
                { value: 'scheduled', label: 'Terjadwal' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit">{editingTxId ? 'Simpan Perubahan' : 'Simpan Transaksi'}</Button>
              <Button type="button" variant="ghost" onClick={resetTxForm}>
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Threshold Minimum Cash">
        <RupiahInput
          label="Set minimum cash (Rp)"
          value={state.minCashThreshold}
          onChange={(v) => updateMinCashThreshold(parseInputNumber(v))}
        />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Jadwal Uang Masuk & Keluar" subtitle="Transaksi terjadwal & pending">
          <div className="space-y-2">
            {scheduled.length === 0 && (
              <p className="text-sm text-surface-500">Tidak ada transaksi terjadwal.</p>
            )}
            {scheduled.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                onEdit={() => startEditTx(t)}
                onDelete={() => handleDeleteTx(t)}
              />
            ))}
          </div>
        </Card>

        <Card title="Riwayat Transaksi" subtitle="Transaksi selesai">
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {completed.length === 0 && (
              <p className="text-sm text-surface-500">Belum ada transaksi selesai.</p>
            )}
            {completed.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                onEdit={() => startEditTx(t)}
                onDelete={() => handleDeleteTx(t)}
                compact
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function TransactionRow({
  transaction: t,
  onEdit,
  onDelete,
  compact,
}: {
  transaction: Transaction
  onEdit: () => void
  onDelete: () => void
  compact?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg bg-surface-800 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
      <div className="flex min-w-0 items-center gap-3">
        {t.type === 'income' ? (
          <ArrowDownLeft className="h-4 w-4 shrink-0 text-positive" />
        ) : (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-negative" />
        )}
        <div className="min-w-0">
          <p className={`truncate font-medium ${compact ? 'text-sm text-surface-300' : 'text-white'}`}>
            {t.description}
          </p>
          <p className="text-xs text-surface-500">
            {formatDate(t.date)} · {t.category}
            {!compact && <> · {t.status}</>}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`font-mono text-sm ${t.type === 'income' ? 'text-positive' : 'text-negative'}`}>
          {t.type === 'income' ? '+' : '-'}
          {formatCurrency(t.amount, true)}
        </span>
        <button onClick={onEdit} className="rounded p-1.5 text-surface-400 hover:bg-surface-700 hover:text-white" title="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="rounded p-1.5 text-surface-400 hover:bg-negative/15 hover:text-negative" title="Hapus">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
