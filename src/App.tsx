import { Suspense } from 'react'
import { lazyWithRetry } from './utils/lazyWithRetry'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/layout/ScrollToTop'
import InstallPWA from './components/pwa/InstallPWA'
import { RouteFallback } from './components/common/RouteFallback'

// Auth (kept eager — small, needed immediately on /auth)
import AuthPage from './components/auth/AuthPage'
import RegistrationSuccessPage from './components/auth/RegistrationSuccessPage'
import SubscriptionSelectPage from './components/auth/SubscriptionSelectPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RoleRedirect from './components/auth/RoleRedirect'
import PendingAccessPage from './components/auth/PendingAccessPage'

// Dashboards & marketing shell — lazy-loaded to split the production bundle
const DashboardPage = lazyWithRetry(() => import('./components/dashboard/DashboardPage'))
const DashboardDemoPage = lazyWithRetry(() => import('./components/dashboard-demo/DashboardDemoPage'))
const AdminDashboard = lazyWithRetry(() =>
  import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
)
const ContabilDashboard = lazyWithRetry(() =>
  import('./pages/ContabilDashboard').then((m) => ({ default: m.ContabilDashboard })),
)
const CarPosterDashboard = lazyWithRetry(() =>
  import('./pages/CarPosterDashboard').then((m) => ({ default: m.CarPosterDashboard })),
)
const AppLayout = lazyWithRetry(() =>
  import('./components/layout/AppLayout').then((m) => ({ default: m.AppLayout })),
)
const CheckoutPage = lazyWithRetry(() => import('./pages/CheckoutPage'))

// Onboarding (fără acces la panel până la validarea completă)
const OnboardingHubPage = lazyWithRetry(() => import('./components/onboarding/OnboardingHubPage'))
const OnboardingPfaPage = lazyWithRetry(() => import('./components/onboarding/OnboardingPfaPage'))
const OnboardingSectionPage = lazyWithRetry(() => import('./components/onboarding/OnboardingSectionPage'))
const OnboardingDocumentPage = lazyWithRetry(() => import('./components/onboarding/OnboardingDocumentPage'))
const OnboardingEligibilityPage = lazyWithRetry(() => import('./components/onboarding/OnboardingEligibilityPage'))
const OnboardingConsultoPage = lazyWithRetry(() => import('./components/onboarding/OnboardingConsultoPage'))
const OnboardingStep2Page = lazyWithRetry(() => import('./components/onboarding/OnboardingStep2Page'))
const OnboardingArrPage = lazyWithRetry(() => import('./components/onboarding/OnboardingArrPage'))
const OnboardingPlatformsPage = lazyWithRetry(() => import('./components/onboarding/OnboardingPlatformsPage'))
const OnboardingVehiclePage = lazyWithRetry(() => import('./components/onboarding/OnboardingVehiclePage'))

function App() {
  return (
    <>
      <ScrollToTop />
      <InstallPWA />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* ── Public auth pages ── */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/inregistrare/pfa" element={<Navigate to="/onboarding/pfa" replace />} />
          <Route path="/inregistrare/abonament" element={<SubscriptionSelectPage />} />
          <Route path="/inregistrare/succes" element={<RegistrationSuccessPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* ── Protected routes ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<RoleRedirect />} />
            <Route path="/app/pending-access" element={<PendingAccessPage />} />
            <Route path="/onboarding" element={<OnboardingHubPage />} />
            <Route path="/onboarding/eligibility" element={<OnboardingEligibilityPage />} />
            <Route path="/onboarding/pfa" element={<OnboardingPfaPage />} />
            <Route path="/onboarding/pfa/consulto" element={<OnboardingConsultoPage />} />
            <Route path="/onboarding/step2" element={<OnboardingStep2Page />} />
            <Route path="/onboarding/arr" element={<OnboardingArrPage />} />
            <Route path="/onboarding/platforms" element={<OnboardingPlatformsPage />} />
            <Route path="/onboarding/vehicle" element={<OnboardingVehiclePage />} />
            <Route path="/onboarding/sections/:sectionKey" element={<OnboardingSectionPage />} />
            <Route path="/onboarding/sections/:sectionKey/documents/:docId" element={<OnboardingDocumentPage />} />
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
