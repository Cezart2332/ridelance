import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress } from '@mui/material'
import { fleetOnboardingService } from '../../../services/fleetOnboarding.service'
import { useAppSelector } from '../../../store/hooks'
import { IS_NATIVE_APP, nativeUnavailablePath } from '../../../native/platform'

export function FleetAccessGate({ children }: { children: ReactNode }) {
  const role = useAppSelector((s) => s.auth.role)
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let cancelled = false
    fleetOnboardingService
      .get()
      .then((s) => {
        if (!cancelled) setAllowed(s.dashboardAllowed)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])
  if (role !== 'CarPoster') return <Navigate to="/app" replace />
  if (failed)
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Nu am putut verifica accesul.</Alert>
        <Button onClick={() => window.location.reload()}>Reîncearcă</Button>
      </Box>
    )
  if (allowed === null)
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    )
  // Configurarea contului SRL nu se face din aplicația mobilă.
  return allowed ? children : <Navigate to={IS_NATIVE_APP ? nativeUnavailablePath('srl') : '/onboarding-srl'} replace />
}
