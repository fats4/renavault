import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Card, Button, Input, StatCard, Badge } from '../components/ui'
import { formatCurrency, formatPercent, parseInputNumber } from '../lib/format'
import { getDropMargin } from '../lib/calculations'

export function PricingPage() {
  const { state, addDrop } = useFinance()
  const [showForm, setShowForm] = useState(false)
  const [calcCogs, setCalcCogs] = useState('300000')
  const [calcPrice, setCalcPrice] = useState('899000')
  const [calcUnits, setCalcUnits] = useState('300')
  const [form, setForm] = useState({
    name: '',
    sku: '',
    cogs: '',
    sellPrice: '',
    units: '',
    dropDate: '',
    status: 'planning' as const,
  })

  const cogs = parseInputNumber(calcCogs)
  const price = parseInputNumber(calcPrice)
  const units = parseInputNumber(calcUnits)
  const calcMargin = price > 0 ? ((price - cogs) / price) * 100 : 0
  const calcRevenue = price * units
  const calcProfit = (price - cogs) * units
  const breakEvenUnits = price > cogs ? Math.ceil(50000000 / (price - cogs)) : 0

  const allMargins = state.drops.map((d) => ({ ...d, ...getDropMargin(d) }))
  const avgMargin =
    allMargins.length > 0
      ? allMargins.reduce((s, d) => s + d.marginPercent, 0) / allMargins.length
      : 0

  const handleAddDrop = (e: React.FormEvent) => {
    e.preventDefault()
    addDrop({
      name: form.name,
      sku: form.sku,
      cogs: parseInputNumber(form.cogs),
      sellPrice: parseInputNumber(form.sellPrice),
      units: parseInputNumber(form.units),
      dropDate: form.dropDate,
      status: form.status,
    })
    setForm({ name: '', sku: '', cogs: '', sellPrice: '', units: '', dropDate: '', status: 'planning' })
    setShowForm(false)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
      planning: 'default',
      production: 'warning',
      live: 'info',
      sold_out: 'success',
    }
    return map[status] || 'default'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Pricing & Margin</h2>
          <p className="mt-1 text-sm text-surface-500">
            Pastikan setiap drop beneran untung — harga jual vs cost produksi
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Tutup' : '+ Produk Drop'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Avg. Gross Margin" value={formatPercent(avgMargin)} trend={avgMargin > 50 ? 'up' : 'down'} />
        <StatCard label="Total Drops" value={String(state.drops.length)} />
        <StatCard
          label="Best Margin"
          value={
            allMargins.length
              ? formatPercent(Math.max(...allMargins.map((d) => d.marginPercent)))
              : '—'
          }
          trend="up"
        />
      </div>

      {/* Margin Calculator */}
      <Card title="Margin Calculator" subtitle="Hitung margin & break-even sebelum produksi">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="grid grid-cols-3 gap-4">
            <Input label="COGS / unit" value={calcCogs} onChange={setCalcCogs} prefix="Rp" />
            <Input label="Harga Jual" value={calcPrice} onChange={setCalcPrice} prefix="Rp" />
            <Input label="Units" value={calcUnits} onChange={setCalcUnits} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-surface-800 p-3 text-center">
              <p className="text-[10px] uppercase text-surface-500">Margin</p>
              <p className={`mt-1 font-mono text-xl font-bold ${calcMargin >= 50 ? 'text-positive' : calcMargin >= 30 ? 'text-warning' : 'text-negative'}`}>
                {formatPercent(calcMargin)}
              </p>
            </div>
            <div className="rounded-lg bg-surface-800 p-3 text-center">
              <p className="text-[10px] uppercase text-surface-500">Revenue</p>
              <p className="mt-1 font-mono text-sm font-bold text-white">
                {formatCurrency(calcRevenue, true)}
              </p>
            </div>
            <div className="rounded-lg bg-surface-800 p-3 text-center">
              <p className="text-[10px] uppercase text-surface-500">Gross Profit</p>
              <p className="mt-1 font-mono text-sm font-bold text-positive">
                {formatCurrency(calcProfit, true)}
              </p>
            </div>
            <div className="rounded-lg bg-surface-800 p-3 text-center">
              <p className="text-[10px] uppercase text-surface-500">Break-even</p>
              <p className="mt-1 font-mono text-sm font-bold text-accent">
                {breakEvenUnits} unit
              </p>
            </div>
          </div>
        </div>
        {calcMargin < 40 && (
          <p className="mt-4 text-sm text-warning">
            ⚠ Margin di bawah 40% — pertimbangkan naikkan harga atau turunkan COGS
          </p>
        )}
      </Card>

      {showForm && (
        <Card title="Tambah Produk Drop">
          <form onSubmit={handleAddDrop} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Nama Produk" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} />
            <Input label="COGS" value={form.cogs} onChange={(v) => setForm({ ...form, cogs: v })} prefix="Rp" />
            <Input label="Harga Jual" value={form.sellPrice} onChange={(v) => setForm({ ...form, sellPrice: v })} prefix="Rp" />
            <Input label="Units" value={form.units} onChange={(v) => setForm({ ...form, units: v })} type="number" />
            <Input label="Drop Date" value={form.dropDate} onChange={(v) => setForm({ ...form, dropDate: v })} type="date" />
            <div className="flex items-end">
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Drops Table */}
      <Card title="Semua Drop & SKU">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-left text-xs uppercase tracking-wider text-surface-500">
                <th className="pb-3 pr-4">Produk</th>
                <th className="pb-3 pr-4">SKU</th>
                <th className="pb-3 pr-4">COGS</th>
                <th className="pb-3 pr-4">Harga Jual</th>
                <th className="pb-3 pr-4">Units</th>
                <th className="pb-3 pr-4">Margin</th>
                <th className="pb-3 pr-4">Gross Profit</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {allMargins.map((d) => (
                <tr key={d.id} className="border-b border-surface-800">
                  <td className="py-3 pr-4 font-medium text-white">{d.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-surface-400">{d.sku}</td>
                  <td className="py-3 pr-4 font-mono text-surface-300">{formatCurrency(d.cogs)}</td>
                  <td className="py-3 pr-4 font-mono text-white">{formatCurrency(d.sellPrice)}</td>
                  <td className="py-3 pr-4 text-surface-300">{d.units}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`font-mono font-semibold ${d.marginPercent >= 50 ? 'text-positive' : d.marginPercent >= 30 ? 'text-warning' : 'text-negative'}`}
                    >
                      {formatPercent(d.marginPercent)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-positive">
                    {formatCurrency(d.grossProfit, true)}
                  </td>
                  <td className="py-3">
                    <Badge variant={statusBadge(d.status)}>{d.status}</Badge>
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
