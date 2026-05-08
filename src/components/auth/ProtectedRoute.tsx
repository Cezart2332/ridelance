import { Navigate, Outlet } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { useAppSelector } from '../../store/hooks'

/**
 * Wraps protected routes.
 * - While AuthInitializer is running (isInitialized = false): shows a spinner.
 * - No session: redirects to /auth.
 * - Valid session: renders children.
 */
export default function ProtectedRoute() {
  const { accessToken, isInitialized } = useAppSelector((s) => s.auth)

  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!accessToken) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}
