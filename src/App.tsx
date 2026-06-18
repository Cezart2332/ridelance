import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/layout/ScrollToTop'
import InstallPWA from './components/pwa/InstallPWA'
import { RouteFallback } from './components/common/RouteFallback'

// Auth (kept eager — small, needed immediately on /auth)
import AuthPage from './components/auth/AuthPage'
import RegisterPfaPage from './components/auth/RegisterPfaPage'
import RegistrationSuccessPage from './components/auth/RegistrationSuccessPage'
import SubscriptionSelectPage from './components/auth/SubscriptionSelectPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RoleRedirect from './components/auth/RoleRedirect'
import PendingAccessPage from './components/auth/PendingAccessPage'
import PendingApprovalPage from './components/auth/PendingApprovalPage'
import { authService } from './services/auth.service'
import { useNavigate } from 'react-router-dom'

// Dashboards & marketing shell — lazy-loaded to split the production bundle
const DashboardPage = lazy(() => import('./components/dashboard/DashboardPage'))
const DashboardDemoPage = lazy(() => import('./components/dashboard-demo/DashboardDemoPage'))
const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
)
const ContabilDashboard = lazy(() =>
  import('./pages/ContabilDashboard').then((m) => ({ default: m.ContabilDashboard })),
)
const CarPosterDashboard = lazy(() =>
  import('./pages/CarPosterDashboard').then((m) => ({ default: m.CarPosterDashboard })),
)
const AppLayout = lazy(() =>
  import('./components/layout/AppLayout').then((m) => ({ default: m.AppLayout })),
)
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))

function App() {
  const navigate = useNavigate();
  const handleLogout = () => {
    authService.logout();
    navigate('/auth');
  };

  return (
    <>
      <ScrollToTop />
      <InstallPWA />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* ── Public auth pages ── */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/inregistrare/pfa" element={<RegisterPfaPage />} />
          <Route path="/inregistrare/abonament" element={<SubscriptionSelectPage />} />
          <Route path="/inregistrare/succes" element={<RegistrationSuccessPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* ── Protected routes ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<RoleRedirect />} />
            <Route path="/app/pending-access" element={<PendingAccessPage />} />
            <Route path="/app/pending-approval" element={<PendingApprovalPage status="Pending" onLogout={handleLogout} />} />
            <Route path="/app/dashboard/*" element={<DashboardPage />} />
            <Route path="/contabil/*" element={<ContabilDashboard />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/poster/*" element={<CarPosterDashboard />} />
          </Route>

          <Route path="/demo/*" element={<DashboardDemoPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
