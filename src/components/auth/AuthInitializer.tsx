import { useEffect } from 'react'
import { clearCredentials } from '../../store/authSlice'
import { useAppDispatch } from '../../store/hooks'
import { refreshAccessToken } from '../../lib/refreshSession'

/**
 * Runs once at app startup.
 * Attempts a silent token refresh using the HTTP-only refreshToken cookie.
 * On success → populates Redux with the new access token.
 * On failure → marks auth as cleared (unauthenticated).
 *
 * This makes the session persist across page refreshes without ever storing
 * the access token in localStorage.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    refreshAccessToken().catch(() => {
      // No valid refresh token → user is not authenticated
      dispatch(clearCredentials())
    })
  }, [dispatch])

  return <>{children}</>
}
