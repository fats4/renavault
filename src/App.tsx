import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { FinanceProvider } from './context/FinanceContext'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/Dashboard'
import { FPAPage } from './pages/FPA'
import { TreasuryPage } from './pages/Treasury'
import { AccountingPage } from './pages/Accounting'
import { PricingPage } from './pages/Pricing'
import { FundraisingPage } from './pages/Fundraising'
import { RiskPage } from './pages/Risk'

export default function App() {
  return (
    <FinanceProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </FinanceProvider>
  )
}
