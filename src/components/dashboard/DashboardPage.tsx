import { useState, useEffect } from 'react'
import { ROUTES } from '../../constants/routes'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { DashboardRoutes } from './DashboardRoutes'
import AppLayout from './layout/AppLayout'

import { authService } from '../../services/auth.service'
import { userService } from '../../services/user.service'
import { stripeService } from '../../services/stripe.service'
import { canAccessDashboard, resolveClientPath } from '../../utils/clientOnboarding'
import { useRecurringDocumentationReminder } from '../../hooks/useRecurringDocumentationReminder'
import { LEGACY_SECTION_ROUTES, PFA_PATHS } from '../../config/pfaNavigation'

import { Box, CircularProgress, Snackbar, Alert } from '@mui/material'

/**
 * Traduce adresele dinaintea rutării reale. Se aplică doar pe rădăcina dashboard-ului,
 * singurul loc unde ajungeau vechile linkuri.
 *
 * Două categorii, ambele încă în circulație:
 *  - `?section=<id>` — linkuri plecate în notificări push, e-mailuri și redirect-uri Stripe;
 *  - callback-ul bancar al providerilor vechi (`?ref=`, `?state=&code=`). Providerul actual nu
 *    redirecționează înapoi la noi, deci nu mai apar callback-uri noi — dar linkuri vechi pot
 *    exista încă în e-mailuri, iar ele trebuie să aterizeze pe pagina de cont bancar, nu în gol.
 */
function resolveLegacyTarget(pathname: string, params: URLSearchParams): string | null {
  if (pathname !== PFA_PATHS.home) return null

  const section = params.get('section')
  if (section) {
    const target = LEGACY_SECTION_ROUTES[section] ?? PFA_PATHS.home
    const rest = new URLSearchParams(params)
    rest.delete('section')
    const query = rest.toString()
    return query ? `${target}?${query}` : target
  }

  const isBankCallback = params.has('ref') || (params.has('state') && (params.has('code') || params.has('error')))
  if (isBankCallback) {
    return `${PFA_PATHS.bankAccount}?${params.toString()}`
  }

  return null
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'error' })
  const [pfaRegistrationId, setPfaRegistrationId] = useState<string | null>(null)

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  // PFA approval gate
  const [pfaStatus, setPfaStatus] = useState<string | null | 'loading'>('loading')

  useRecurringDocumentationReminder(pfaStatus === 'Approved')

  useEffect(() => {
    // Dashboardul este accesibil doar după onboarding complet + abonament activ;
    // altfel userul e trimis înapoi în fluxul de onboarding/plată.
    // Excepție: întoarcerea din checkout (?subscribed=1) — webhookul Stripe poate întârzia.
    const justSubscribed = new URLSearchParams(window.location.search).get('subscribed') === '1'
    const boot = async () => {
      try {
        const [summary, sub] = await Promise.all([
          userService.getDashboardSummary(),
          stripeService.getSubscriptionStatus(),
        ])
        // Fail-closed: panelul se arată DOAR cu PFA aprobat + secțiunile de onboarding
        // validate + abonament activ. ?subscribed=1 (întoarcerea din checkout) tolerează
        // doar webhookul Stripe întârziat al abonamentului — nu și onboardingul nevalidat.
        const allowed =
          summary.pfaStatus === 'Approved' &&
          sub?.onboardingSectionsValidated === true &&
          (justSubscribed || canAccessDashboard(sub))
        if (!allowed) {
          navigate(resolveClientPath(sub), { replace: true })
          return
        }
        setPfaStatus(summary.pfaStatus)
        setPfaRegistrationId(summary.pfaRegistrationId ?? null)
      } catch {
        // Fail-closed: dacă nu putem verifica dreptul de acces, nu arătăm panelul.
        navigate('/onboarding', { replace: true })
      }
    }
    void boot()
  }, [navigate])

  const handleLogout = async () => {
    await authService.logout()
    navigate(ROUTES.login, { replace: true })
  }

  // Înainte de orice randare: adresele vechi ajung pe ruta nouă, fără să treacă prin Acasă.
  const legacyTarget = resolveLegacyTarget(location.pathname, searchParams)
  if (legacyTarget) {
    return <Navigate to={legacyTarget} replace />
  }

  // Show spinner while checking PFA status
  if (pfaStatus === 'loading') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <AppLayout
      onLogout={handleLogout}
      showNotifications
      onOpenRecurringDocumentation={() => navigate(PFA_PATHS.docsRecurring)}
    >
      <DashboardRoutes pfaRegistrationId={pfaRegistrationId} onSnackbar={showSnackbar} />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppLayout>
  )
}
