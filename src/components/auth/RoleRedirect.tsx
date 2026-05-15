import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import { stripeService, type SubscriptionResponse } from '../../services/stripe.service'
import { Box, CircularProgress } from '@mui/material'

/**
 * Reads the user's role from Redux and redirects to the correct dashboard.
 * - Client   → /app/dashboard (if access granted)
 * - Contabil → /contabil
 * - Admin    → /admin
 */
export default function RoleRedirect() {
  const role = useAppSelector((s) => s.auth.role)
  const [sub, setSub] = useState<SubscriptionResponse | null | undefined>(undefined)

  useEffect(() => {
    if (role === 'Client') {
      stripeService.getSubscriptionStatus().then(setSub)
    }
  }, [role])

  if (role === 'Contabil') return <Navigate to="/contabil" replace />
  if (role === 'Admin') return <Navigate to="/admin" replace />

  if (role === 'Client') {
    // While loading subscription info
    if (sub === undefined) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      )
    }

    // No subscription found
    if (!sub) {
      return <Navigate to="/inregistrare/abonament" replace />
    }

    // Has subscription, check PFA status
    if (!sub.pfaStatus) {
      // No PFA registration yet
      return <Navigate to="/inregistrare/pfa" replace />
    }

    if (sub.pfaStatus === 'Pending' || sub.pfaStatus === 'Rejected') {
      return <Navigate to="/app/pending-approval" replace />
    }

    // PFA is approved (or AmPfa), now check Monday access gate
    if (sub.dashboardAccessGranted) {
      return <Navigate to="/app/dashboard" replace />
    } else {
      return <Navigate to="/app/pending-access" replace />
    }
  }

  // Unrecognised role — ProtectedRoute already guards this, but just in case
  return <Navigate to="/auth" replace />
}
