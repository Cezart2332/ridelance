import axios from 'axios'
import { store } from '../store/store'
import { setCredentials } from '../store/authSlice'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export interface RefreshResult {
  accessToken: string
  role: string
  userId: string
}

let refreshPromise: Promise<RefreshResult> | null = null

/** Single in-flight refresh for AuthInitializer and axios 401 handler. */
export function refreshAccessToken(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshResult>(
        `${BASE_URL}/users/refresh-token`,
        {},
        { withCredentials: true },
      )
      .then((res) => {
        const { accessToken, role, userId } = res.data
        store.dispatch(setCredentials({ accessToken, role, userId }))
        return { accessToken, role, userId }
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export function isRegistrationPath(pathname: string): boolean {
  return pathname.startsWith('/inregistrare')
}
