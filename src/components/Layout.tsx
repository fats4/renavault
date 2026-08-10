import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  BookOpen,
  Tag,
  Users,
  Shield,
  Gem,
  RotateCcw,
  Cloud,
  HardDrive,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../lib/format'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/fpa', icon: TrendingUp, label: 'FP&A' },
  { to: '/treasury', icon: Wallet, label: 'Treasury' },
  { to: '/accounting', icon: BookOpen, label: 'Accounting' },
  { to: '/pricing', icon: Tag, label: 'Pricing' },
  { to: '/fundraising', icon: Users, label: 'Fundraising' },
  { to: '/risk', icon: Shield, label: 'Risk & Controls' },
]

export function Layout() {
  const { state, loading, saving, error, storageBackend, resetData } = useFinance()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
          <p className="mt-4 text-sm text-surface-400">Memuat data finansial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-surface-700 bg-surface-900">
        <div className="flex items-center gap-3 border-b border-surface-700 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20">
            <Gem className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-white">Renavault</h1>
            <p className="text-[10px] uppercase tracking-widest text-surface-500">CFO Suite</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/10 font-medium text-accent'
                    : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-surface-700 p-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-surface-800 px-3 py-2">
            {storageBackend === 'firebase' ? (
              <>
                <Cloud className="h-3.5 w-3.5 text-info" />
                <span className="text-[10px] text-surface-400">
                  {saving ? 'Menyimpan...' : 'Firebase sync'}
                </span>
                {saving && <Loader2 className="ml-auto h-3 w-3 animate-spin text-accent" />}
              </>
            ) : (
              <>
                <HardDrive className="h-3.5 w-3.5 text-surface-500" />
                <span className="text-[10px] text-surface-500">Local storage</span>
              </>
            )}
          </div>

          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-negative/30 bg-negative/10 px-3 py-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-negative" />
              <p className="text-[10px] text-negative">{error}</p>
            </div>
          )}

          <div className="rounded-lg bg-surface-800 p-3">
            <p className="text-[10px] uppercase tracking-wider text-surface-500">Cash Position</p>
            <p className="mt-1 font-mono text-lg font-semibold text-white">
              {formatCurrency(state.cashBalance, true)}
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('Reset semua data ke kosong (0)?')) void resetData()
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-surface-500 transition-colors hover:bg-surface-800 hover:text-surface-300"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Data
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div className="mx-auto max-w-7xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
