import axios from 'axios'
import { store } from '../store/store'
import { setCredentials } from '../store/authSlice'
import { IS_NATIVE_APP } from '../native/platform'
import { NATIVE_CLIENT_HEADERS, clearRefreshToken, readRefreshToken, storeRefreshToken } from '../native/nativeSession'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export interface RefreshResult {
  accessToken: string
  role: string
  userId: string
  /** Doar pentru aplicația mobilă: tokenul rotit, pe care îl păstrează ea. */
  refreshToken?: string
}

/**
 * Cererea de refresh. Pe site merge pe cookie; în aplicație, pe tokenul păstrat local, trimis prin
 * antet (vezi `native/nativeSession.ts`).
 */
async function requestRefresh(): Promise<RefreshResult> {
  if (!IS_NATIVE_APP) {
    const res = await axios.post<RefreshResult>(`${BASE_URL}/users/refresh-token`, {}, { withCredentials: true })
    return res.data
  }

  const stored = await readRefreshToken()
  if (!stored) throw new Error('No stored refresh token')

  try {
    const res = await axios.post<RefreshResult>(
      `${BASE_URL}/users/refresh-token`,
      {},
      { headers: { ...NATIVE_CLIENT_HEADERS, 'X-Refresh-Token': stored } },
    )
    await storeRefreshToken(res.data.refreshToken)
    return res.data
  } catch (error) {
    // Tokenul respins nu mai are ce căuta în telefon. O cădere de rețea nu-l șterge: la
    // următoarea deschidere, cu internet, sesiunea trebuie să revină.
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    if (status === 400 || status === 401 || status === 403) await clearRefreshToken()
    throw error
  }
}

let refreshPromise: Promise<RefreshResult> | null = null

/** Single in-flight refresh for AuthInitializer and axios 401 handler. */
export function refreshAccessToken(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = requestRefresh()
      .then((data) => {
        const { accessToken, role, userId } = data
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
