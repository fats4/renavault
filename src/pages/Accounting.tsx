import { useFinance } from '../context/FinanceContext'
import { Card, StatCard } from '../components/ui'
import { formatCurrency, formatPercent } from '../lib/format'
import { getProfitAndLoss, getBalanceSheet } from '../lib/calculations'

export function AccountingPage() {
  const { state } = useFinance()
  const pl = getProfitAndLoss(state.transactions)
  const bs = getBalanceSheet(state)
  const taxEstimate = pl.netProfit > 0 ? pl.netProfit * (state.taxRate / 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Accounting & Reporting</h2>
        <p className="mt-1 text-sm text-surface-500">
          Pembukuan rapi — laba rugi, neraca, dan estimasi pajak
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(pl.totalRevenue, true)} trend="up" />
        <StatCard label="Total Expenses" value={formatCurrency(pl.totalExpenses, true)} trend="down" />
        <StatCard
          label="Net Profit"
          value={formatCurrency(pl.netProfit, true)}
          trend={pl.netProfit > 0 ? 'up' : 'down'}
        />
        <StatCard label="Estimasi Pajak" value={formatCurrency(taxEstimate, true)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* P&L */}
        <Card title="Laporan Laba Rugi" subtitle="Year to date">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-positive">
                Pendapatan
              </p>
              {Object.entries(pl.revenue).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between py-1.5 text-sm">
                  <span className="text-surface-400">{cat}</span>
                  <span className="font-mono text-white">{formatCurrency(amt)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-surface-700 pt-2 font-semibold">
                <span className="text-white">Total Revenue</span>
                <span className="font-mono text-positive">{formatCurrency(pl.totalRevenue)}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-negative">
                Beban
              </p>
              {Object.entries(pl.expenses).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between py-1.5 text-sm">
                  <span className="text-surface-400">{cat}</span>
                  <span className="font-mono text-white">{formatCurrency(amt)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-surface-700 pt-2 font-semibold">
                <span className="text-white">Total Expenses</span>
                <span className="font-mono text-negative">{formatCurrency(pl.totalExpenses)}</span>
              </div>
            </div>

            <div className="flex justify-between rounded-lg bg-surface-800 p-4">
              <span className="font-semibold text-white">Net Profit</span>
              <span className={`font-mono text-lg font-bold ${pl.netProfit >= 0 ? 'text-positive' : 'text-negative'}`}>
                {formatCurrency(pl.netProfit)}
              </span>
            </div>
          </div>
        </Card>

        {/* Balance Sheet */}
        <Card title="Neraca" subtitle="Posisi keuangan saat ini">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-info">Aset</p>
              <div className="flex justify-between py-1.5 text-sm">
                <span className="text-surface-400">Kas & Setara Kas</span>
                <span className="font-mono text-white">{formatCurrency(bs.assets.cash)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm">
                <span className="text-surface-400">Persediaan (Inventory)</span>
                <span className="font-mono text-white">{formatCurrency(bs.assets.inventory)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm">
                <span className="text-surface-400">Piutang</span>
                <span className="font-mono text-white">{formatCurrency(bs.assets.receivables)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-surface-700 pt-2 font-semibold">
                <span className="text-white">Total Aset</span>
                <span className="font-mono text-info">{formatCurrency(bs.totalAssets)}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-negative">
                Kewajiban
              </p>
              <div className="flex justify-between py-1.5 text-sm">
                <span className="text-surface-400">Utang Usaha</span>
                <span className="font-mono text-white">{formatCurrency(bs.liabilities.payables)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm">
                <span className="text-surface-400">Pinjaman</span>
                <span className="font-mono text-white">{formatCurrency(bs.liabilities.loans)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-surface-700 pt-2 font-semibold">
                <span className="text-white">Total Kewajiban</span>
                <span className="font-mono text-negative">{formatCurrency(bs.totalLiabilities)}</span>
              </div>
            </div>

            <div className="flex justify-between rounded-lg bg-accent/10 p-4">
              <span className="font-semibold text-accent">Ekuitas</span>
              <span className="font-mono text-lg font-bold text-accent">
                {formatCurrency(bs.equity)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tax Summary */}
      <Card title="Ringkasan Pajak" subtitle={`Tarif PPh Badan: ${formatPercent(state.taxRate, 0)}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-surface-800 p-4">
            <p className="text-xs text-surface-500">Penghasilan Kena Pajak</p>
            <p className="mt-1 font-mono text-lg font-semibold text-white">
              {formatCurrency(Math.max(pl.netProfit, 0))}
            </p>
          </div>
          <div className="rounded-lg bg-surface-800 p-4">
            <p className="text-xs text-surface-500">Estimasi PPh Badan</p>
            <p className="mt-1 font-mono text-lg font-semibold text-warning">
              {formatCurrency(taxEstimate)}
            </p>
          </div>
          <div className="rounded-lg bg-surface-800 p-4">
            <p className="text-xs text-surface-500">Profit After Tax</p>
            <p className="mt-1 font-mono text-lg font-semibold text-positive">
              {formatCurrency(pl.netProfit - taxEstimate)}
            </p>
          </div>
        </div>
      </Card>

      {/* Ledger */}
      <Card title="Buku Besar" subtitle="Semua transaksi tercatat">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-left text-xs uppercase tracking-wider text-surface-500">
                <th className="pb-3 pr-4">Tanggal</th>
                <th className="pb-3 pr-4">Deskripsi</th>
                <th className="pb-3 pr-4">Kategori</th>
                <th className="pb-3 pr-4">Debit</th>
                <th className="pb-3">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {state.transactions
                .filter((t) => t.status === 'completed')
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((t) => (
                  <tr key={t.id} className="border-b border-surface-800">
                    <td className="py-2.5 pr-4 text-surface-400">{t.date}</td>
                    <td className="py-2.5 pr-4 text-white">{t.description}</td>
                    <td className="py-2.5 pr-4 text-surface-400">{t.category}</td>
                    <td className="py-2.5 pr-4 font-mono text-negative">
                      {t.type === 'expense' ? formatCurrency(t.amount) : '—'}
                    </td>
                    <td className="py-2.5 font-mono text-positive">
                      {t.type === 'income' ? formatCurrency(t.amount) : '—'}
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
