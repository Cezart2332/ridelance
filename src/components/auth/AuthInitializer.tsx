import { useEffect } from 'react'
import axios from 'axios'
import { setCredentials, clearCredentials } from '../../store/authSlice'
import { useAppDispatch } from '../../store/hooks'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

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
    axios
      .post(
        `${BASE_URL}/users/refresh-token`,
        {},
        { withCredentials: true } // sends the HTTP-only refreshToken cookie
      )
      .then((res) => {
        dispatch(
          setCredentials({
            accessToken: res.data.accessToken,
            role: res.data.role,
            userId: res.data.userId,
          })
        )
      })
      .catch(() => {
        // No valid refresh token → user is not authenticated
        dispatch(clearCredentials())
      })
  }, [dispatch])

  return <>{children}</>
}
