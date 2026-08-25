import { Suspense } from 'react'
import { lazyWithRetry } from './utils/lazyWithRetry'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ScrollToTop } from './components/layout/ScrollToTop'
import InstallPWA from './components/pwa/InstallPWA'
import { RouteFallback } from './components/common/RouteFallback'

// Auth (kept eager — small, needed immediately on /autentificare)
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import VerifyEmailPage from './components/auth/VerifyEmailPage'
import ForgotPasswordPage from './components/auth/ForgotPasswordPage'
import { ROUTES } from './constants/routes'
import RegistrationSuccessPage from './components/auth/RegistrationSuccessPage'
import SubscriptionSelectPage from './components/auth/SubscriptionSelectPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RoleRedirect from './components/auth/RoleRedirect'
import PendingAccessPage from './components/auth/PendingAccessPage'
import { SRL_ROOT } from './config/srlNavigation'

/**
 * Ruta de dinainte de mutarea dashboard-ului SRL sub `/app`. Păstrează query string-ul:
 * sesiunile Stripe create înainte de mutare se întorc pe `/poster?car_paid=1&...`, iar un
 * `Navigate` simplu ar fi tăiat exact partea care spune ce s-a întâmplat.
 */
function LegacySrlRedirect() {
  const { search, hash } = useLocation()
  return <Navigate to={`${SRL_ROOT}${search}${hash}`} replace />
}

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
const OnboardingShell = lazyWithRetry(() => import('./components/onboarding/OnboardingShell'))
const OnboardingRedirect = lazyWithRetry(() =>
  import('./components/onboarding/OnboardingShell').then((m) => ({ default: m.OnboardingRedirect })),
)
const OnboardingPfaPage = lazyWithRetry(() => import('./components/onboarding/OnboardingPfaPage'))
const OnboardingEligibilityPage = lazyWithRetry(() => import('./components/onboarding/OnboardingEligibilityPage'))
const CompanyFormationPersonalDataPage = lazyWithRetry(
  () => import('./components/onboarding/companyFormation/CompanyFormationPersonalDataPage'),
)
const CompanyFormationOfficePage = lazyWithRetry(
  () => import('./components/onboarding/companyFormation/CompanyFormationOfficePage'),
)
const CompanyFormationConsentPage = lazyWithRetry(
  () => import('./components/onboarding/companyFormation/CompanyFormationConsentPage'),
)
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
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          {/* Singura ramificație reală dinainte de crearea contului: rolul `CarPoster`. */}
          <Route path={ROUTES.registerCarPoster} element={<RegisterPage role="CarPoster" />} />
          <Route path={ROUTES.verifyEmail} element={<VerifyEmailPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path="/auth" element={<Navigate to={ROUTES.login} replace />} />
          <Route path="/inregistrare/pfa" element={<Navigate to="/onboarding/pfa" replace />} />
          <Route path="/inregistrare/abonament" element={<SubscriptionSelectPage />} />
          <Route path="/inregistrare/succes" element={<RegistrationSuccessPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* ── Protected routes ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<RoleRedirect />} />
            <Route path="/app/pending-access" element={<PendingAccessPage />} />
            {/* Un singur shell pentru toți cei 6 pași: rail-ul, datele și poll-ul trăiesc aici,
                deci schimbarea pasului nu remontează nimic. */}
            <Route path="/onboarding" element={<OnboardingShell />}>
              <Route index element={<OnboardingRedirect />} />
              <Route path="eligibility" element={<OnboardingEligibilityPage />} />
              <Route path="pfa" element={<OnboardingPfaPage />} />
              {/* Ramura „Nu am PFA": dosarul de înființare, pe trei etape. */}
              <Route path="pfa/date-personale" element={<CompanyFormationPersonalDataPage />} />
              <Route path="pfa/sediu" element={<CompanyFormationOfficePage />} />
              <Route path="pfa/consimtamant" element={<CompanyFormationConsentPage />} />
              <Route path="step2" element={<OnboardingStep2Page />} />
              <Route path="arr" element={<OnboardingArrPage />} />
              <Route path="platforms" element={<OnboardingPlatformsPage />} />
              <Route path="vehicle" element={<OnboardingVehiclePage />} />
              {/* Rutele vechi pe secțiuni au dispărut — un singur onboarding, pe cei 6 pași. */}
              <Route path="sections/*" element={<Navigate to="/onboarding" replace />} />
            </Route>
            <Route path="/app/dashboard/*" element={<DashboardPage />} />
            <Route path="/contabil/*" element={<ContabilDashboard />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path={`${SRL_ROOT}/*`} element={<CarPosterDashboard />} />
            <Route path="/poster/*" element={<LegacySrlRedirect />} />
          </Route>

          <Route path="/demo/*" element={<DashboardDemoPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
