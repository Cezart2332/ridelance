import { NATIVE_CLIENT_HEADERS, clearRefreshToken, storeRefreshToken } from '../native/nativeSession'
import axios from 'axios'
import { store } from '../store/store'
import { setCredentials, clearCredentials, startImpersonation } from '../store/authSlice'
import { clearNotificationPromptSession } from '../lib/push'
import { refreshAccessToken } from '../lib/refreshSession'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Use a plain axios instance (not the intercepted one) for auth calls
// to avoid circular refresh loops.
const authAxios = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // needed for the refresh token cookie
})

export const authService = {
  login: async (email: string, password: string) => {
    const response = await authAxios.post<{
      accessToken: string
      role: string
      userId: string
      refreshToken?: string
    }>('/users/login', { email, password }, { headers: NATIVE_CLIENT_HEADERS })

    const { accessToken, role, userId } = response.data
    // Aplicația mobilă nu primește cookie: păstrează ea tokenul de refresh.
    await storeRefreshToken(response.data.refreshToken)

    // Store in Redux (in memory only — never localStorage)
    store.dispatch(setCredentials({ accessToken, role, userId }))

    return response.data
  },

  /**
   * Numele nu se mai cere la înregistrare: backendul îl are opțional (RL-05). Telefonul se salvează
   * pe cont așa cum l-a scris omul; forma `+407…` se calculează la trimiterea SMS-ului.
   */
  register: async (
    email: string,
    password: string,
    role: string = 'Client',
    phoneNumber?: string
  ): Promise<string> => {
    const response = await authAxios.post<string>('/users/register', {
      email,
      password,
      role,
      phoneNumber: phoneNumber?.trim() || undefined,
    })
    return response.data
  },

  /** Confirmă adresa cu codul primit pe email. */
  verifyEmail: async (email: string, code: string): Promise<void> => {
    await authAxios.post('/users/verify-email', { email, code })
  },

  /** Cere un cod nou. Serverul răspunde la fel și dacă adresa n-are cont. */
  resendVerification: async (email: string): Promise<void> => {
    await authAxios.post('/users/resend-verification', { email })
  },

  logout: async () => {
    const userId = store.getState().auth.userId ?? undefined
    // Grab the current access token BEFORE clearing Redux
    const token = store.getState().auth.accessToken
    // Clear Redux state immediately so the UI reacts instantly
    store.dispatch(clearCredentials())
    clearNotificationPromptSession(userId)
    await clearRefreshToken()
    // Tell the backend to invalidate the refresh token cookie
    try {
      await authAxios.post('/users/logout', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    } catch {
      // Ignore — the local session is already cleared regardless
    }
  },

  isAuthenticated: (): boolean => {
    return !!store.getState().auth.accessToken
  },

  impersonate: async (userId: string, targetName: string) => {
    const { accessToken: token, userId: adminUserId, role: adminRole } = store.getState().auth
    const response = await authAxios.post<{
      accessToken: string
      role: string
      userId: string
    }>(`/users/impersonate/${userId}`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    const { accessToken, role, userId: targetUserId } = response.data

    // Remember who the admin is (their session stays in the refresh cookie),
    // then switch the in-memory credentials to the impersonated user.
    if (adminUserId && adminRole) {
      store.dispatch(startImpersonation({ adminUserId, adminRole, targetName }))
    }
    store.dispatch(setCredentials({ accessToken, role, userId: targetUserId }))

    return response.data
  },

  /**
   * Ends impersonation by re-running the silent refresh: the refresh cookie
   * still belongs to the admin, so this restores the admin credentials
   * (which also clears the impersonation flag in the store).
   */
  stopImpersonation: async () => {
    return refreshAccessToken()
  },
}
