import { Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { SystemBars, SystemBarsStyle } from '@capacitor/core'

import LoginPage from '../components/auth/LoginPage'
import ForgotPasswordPage from '../components/auth/ForgotPasswordPage'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import { FleetAccessGate } from '../components/onboarding/fleet/FleetAccessGate'
import { RouteFallback } from '../components/common/RouteFallback'
import { DocumentViewerHost } from '../components/common/documentViewerHost'
import { ScrollToTop } from '../components/layout/ScrollToTop'
import { SRL_ROOT } from '../config/srlNavigation'
import { ROUTES } from '../constants/routes'
import { lazyWithRetry } from '../utils/lazyWithRetry'
import { NativeCurtain } from './launch/NativeCurtain'
import { isAuthPath } from './launch/launchRoutes'
import { useCurtainPhase } from './launch/curtainStore'
import { NativeRoleRedirect } from './NativeRoleRedirect'
import { NativeUnavailablePage } from './NativeUnavailablePage'
import { NATIVE_UNAVAILABLE_PATH } from './platform'

const DashboardPage = lazyWithRetry(() => import('../components/dashboard/DashboardPage'))
const CarPosterDashboard = lazyWithRetry(() =>
  import('../pages/CarPosterDashboard').then((m) => ({ default: m.CarPosterDashboard })),
)
const NotificationOpenPage = lazyWithRetry(() => import('../components/notifications/NotificationOpenPage'))

/**
 * Rutele aplicației mobile: autentificarea și dashboardurile PFA și SRL, nimic altceva.
 *
 * Fără site public, fără înregistrare, onboarding sau plăți — vezi `platform.ts`. Orice adresă
 * necunoscută (inclusiv o notificare care ar trimite la abonamente) ajunge la `/app`, care alege
 * dashboardul după rol.
 */
export function NativeApp() {
  useNativeShell()

  return (
    <>
      <ScrollToTop />
      <DocumentViewerHost />
      <NativeCurtain />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<NativeRoleRedirect />} />
            <Route path={NATIVE_UNAVAILABLE_PATH} element={<NativeUnavailablePage />} />
            <Route path="/app/notificari/:id" element={<NotificationOpenPage />} />
            <Route path="/app/dashboard/*" element={<DashboardPage />} />
            <Route
              path={`${SRL_ROOT}/*`}
              element={
                <FleetAccessGate>
                  <CarPosterDashboard />
                </FleetAccessGate>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

/**
 * Ce ține de telefon, nu de pagini: butonul „Înapoi” de pe Android și culoarea barei de sus.
 *
 * Fără handler, „Înapoi” închidea aplicația de pe orice ecran. Acum merge înapoi prin istoric și
 * închide aplicația doar când nu mai are unde.
 */
function useNativeShell() {
  const phase = useCurtainPhase()
  const { pathname } = useLocation()
  // Cortina și antetul login-ului sunt închise la culoare: bara de sus trece pe text deschis, iar
  // fundalul paginii (cel care se vede și în spatele barei de sus pe iPhone) se închide și el.
  const dark = phase !== 'hidden' || isAuthPath(pathname)

  useEffect(() => {
    document.documentElement.dataset.surface = dark ? 'dark' : 'light'
    // În browser (dev, teste) pluginul poate arunca pe loc, nu doar respinge promisiunea.
    try {
      void SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => undefined)
    } catch {
      // Fără bară de sistem de colorat.
    }
  }, [dark])

  useEffect(() => {
    const listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        void CapacitorApp.exitApp()
      }
    })

    return () => {
      void listener.then((handle) => handle.remove())
    }
  }, [])
}
