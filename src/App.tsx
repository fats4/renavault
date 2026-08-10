import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FinanceProvider } from './context/FinanceContext'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/Login'
import { DashboardPage } from './pages/Dashboard'
import { FPAPage } from './pages/FPA'
import { TreasuryPage } from './pages/Treasury'
import { AccountingPage } from './pages/Accounting'
import { PricingPage } from './pages/Pricing'
import { FundraisingPage } from './pages/Fundraising'
import { RiskPage } from './pages/Risk'

function FinanceRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/fpa" element={<FPAPage />} />
        <Route path="/treasury" element={<TreasuryPage />} />
        <Route path="/accounting" element={<AccountingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/fundraising" element={<FundraisingPage />} />
        <Route path="/risk" element={<RiskPage />} />
      </Route>
    </Routes>
  )
}

function AppContent() {
  const { user, loading, authRequired } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (authRequired && !user) {
    return <LoginPage />
  }

  return (
    <FinanceProvider>
      <BrowserRouter>
        <FinanceRoutes />
      </BrowserRouter>
    </FinanceProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
