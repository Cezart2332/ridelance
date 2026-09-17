import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

import { SRL_ROOT } from '../config/srlNavigation'
import { ROUTES } from '../constants/routes'
import { stripeService, type SubscriptionResponse } from '../services/stripe.service'
import { useAppSelector } from '../store/hooks'
import { canAccessDashboard, isSuspendedSubscription } from '../utils/clientOnboarding'
import { nativeUnavailablePath } from './platform'

/**
 * `RoleRedirect`, pentru aplicație: aceeași alegere după rol, dar fără drum spre onboarding sau
 * spre plata abonamentului. Un cont care n-are încă dashboard primește ecranul explicativ.
 */
export function NativeRoleRedirect() {
  const role = useAppSelector((s) => s.auth.role)
  const [sub, setSub] = useState<SubscriptionResponse | null | undefined>(undefined)

  useEffect(() => {
    if (role !== 'Client') return
    stripeService
      .getSubscriptionStatus()
      .then(setSub)
      .catch(() => setSub(null))
  }, [role])

  if (role === 'CarPoster') return <Navigate to={SRL_ROOT} replace />
  if (role === 'Admin' || role === 'Contabil') return <Navigate to={nativeUnavailablePath('rol')} replace />
  if (role !== 'Client') return <Navigate to={ROUTES.login} replace />

  if (sub === undefined) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (canAccessDashboard(sub)) return <Navigate to="/app/dashboard" replace />
  if (isSuspendedSubscription(sub) || sub?.onboardingSectionsValidated) {
    return <Navigate to={nativeUnavailablePath('abonament')} replace />
  }
  return <Navigate to={nativeUnavailablePath('onboarding')} replace />
}
