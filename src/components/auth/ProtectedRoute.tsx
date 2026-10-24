import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { CircularProgress, Box } from '@mui/material'
import { ImpersonationBanner } from './ImpersonationBanner'
import { useAppSelector } from '../../store/hooks'
import { usePendingVerification } from './verificationGate'

/**
 * Wraps protected routes.
 * - While AuthInitializer is running (isInitialized = false): shows a spinner.
 * - No session: redirects to /auth.
 * - Valid session: renders children.
 */
export default function ProtectedRoute() {
  const location = useLocation()
  const { accessToken, isInitialized, userId } = useAppSelector((s) => s.auth)
  const pending = usePendingVerification(isInitialized && accessToken ? (userId ?? 'session') : null)

  if (!isInitialized || (accessToken && pending === null)) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!accessToken) {
    return <Navigate to={ROUTES.login} state={{ returnTo: location.pathname + location.search + location.hash }} replace />
  }

  // Cont nou, neconfirmat: înapoi la coduri, oricum ar fi ajuns aici (înapoi la site, apoi în
  // aplicație). Serverul refuză și el cererile până la confirmare.
  if (pending && (pending.email || pending.phone)) {
    return <Navigate to={ROUTES.verifyEmail} state={{ next: location.pathname + location.search }} replace />
  }

  return (
    <>
      <ImpersonationBanner />
      <Outlet />
    </>
  )
}
