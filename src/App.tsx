import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { AppLayout } from './components/layout/AppLayout'
import InstallPWA from './components/pwa/InstallPWA'

// External Components
import AuthPage from './components/auth/AuthPage'
import RegisterPfaPage from './components/auth/RegisterPfaPage'
import RegistrationSuccessPage from './components/auth/RegistrationSuccessPage'
import DashboardPage from './components/dashboard/DashboardPage'
import DashboardDemoPage from './components/dashboard-demo/DashboardDemoPage'
import { AdminDashboard } from './pages/AdminDashboard'
import { ContabilDashboard } from './pages/ContabilDashboard'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <InstallPWA />
      <Routes>
        {/* Auth pages — no navbar/footer */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/inregistrare/pfa" element={<RegisterPfaPage />} />
        <Route path="/inregistrare/succes" element={<RegistrationSuccessPage />} />
        
        {/* Real dashboard — uses its own layout */}
        <Route path="/app/*" element={<DashboardPage />} />
        
        {/* Demo dashboard */}
        <Route path="/demo/*" element={<DashboardDemoPage />} />

        {/* Admin & Contabil dashboards — classic layout */}
        <Route path="/contabil/*" element={<ContabilDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        
        {/* Landing pages — wrapped in AppLayout with navbar & footer */}
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App