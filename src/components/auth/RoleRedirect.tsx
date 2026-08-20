import { Navigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { SRL_ROOT } from '../../config/srlNavigation'
import { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import { stripeService, type SubscriptionResponse } from '../../services/stripe.service'
import { resolveClientPath } from '../../utils/clientOnboarding'
import { Box, CircularProgress } from '@mui/material'

/**
 * Reads the user's role from Redux and redirects to the correct dashboard.
 */
export default function RoleRedirect() {
  const role = useAppSelector((s) => s.auth.role)
  const [sub, setSub] = useState<SubscriptionResponse | null | undefined>(undefined)

  useEffect(() => {
    if (role === 'Client') {
      stripeService
        .getSubscriptionStatus()
        .then(setSub)
        .catch(() => setSub(null))
    }
  }, [role])

  if (role === 'Contabil') return <Navigate to="/contabil" replace />
  if (role === 'Admin') return <Navigate to="/admin" replace />
  if (role === 'CarPoster') return <Navigate to={SRL_ROOT} replace />

  if (role === 'Client') {
    if (sub === undefined) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      )
    }

    return <Navigate to={resolveClientPath(sub)} replace />
  }

  return <Navigate to={ROUTES.login} replace />
}
