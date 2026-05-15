import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { AppLayout } from './components/layout/AppLayout'
import InstallPWA from './components/pwa/InstallPWA'

// Auth
import AuthPage from './components/auth/AuthPage'
import RegisterPfaPage from './components/auth/RegisterPfaPage'
import RegistrationSuccessPage from './components/auth/RegistrationSuccessPage'
import SubscriptionSelectPage from './components/auth/SubscriptionSelectPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RoleRedirect from './components/auth/RoleRedirect'

// Dashboards
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
        {/* ── Public auth pages ── */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/inregistrare/pfa" element={<RegisterPfaPage />} />
        <Route path="/inregistrare/abonament" element={<SubscriptionSelectPage />} />
        <Route path="/inregistrare/succes" element={<RegistrationSuccessPage />} />

        {/* ── Protected routes ── */}
        <Route element={<ProtectedRoute />}>
          {/* /app → role-based redirect */}
          <Route path="/app" element={<RoleRedirect />} />

          {/* Client dashboard */}
          <Route path="/app/dashboard/*" element={<DashboardPage />} />

          {/* Contabil dashboard */}
          <Route path="/contabil/*" element={<ContabilDashboard />} />

          {/* Admin dashboard */}
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>

        {/* Demo (unprotected, for showcasing) */}
        <Route path="/demo/*" element={<DashboardDemoPage />} />

        {/* Landing pages */}
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App