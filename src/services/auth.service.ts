import axios from 'axios'
import { store } from '../store/store'
import { setCredentials, clearCredentials } from '../store/authSlice'
import { clearNotificationPromptSession } from '../lib/push'

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
    }>('/users/login', { email, password })

    const { accessToken, role, userId } = response.data

    // Store in Redux (in memory only — never localStorage)
    store.dispatch(setCredentials({ accessToken, role, userId }))

    return response.data
  },

  register: async (
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    role: string = 'Client'
  ): Promise<string> => {
    const response = await authAxios.post<string>('/users/register', {
      email,
      firstName,
      lastName,
      password,
      role,
    })
    return response.data
  },

  logout: async () => {
    const userId = store.getState().auth.userId ?? undefined
    // Grab the current access token BEFORE clearing Redux
    const token = store.getState().auth.accessToken
    // Clear Redux state immediately so the UI reacts instantly
    store.dispatch(clearCredentials())
    clearNotificationPromptSession(userId)
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

  impersonate: async (userId: string) => {
    const token = store.getState().auth.accessToken
    const response = await authAxios.post<{
      accessToken: string
      role: string
      userId: string
    }>(`/users/impersonate/${userId}`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    const { accessToken, role, userId: targetUserId } = response.data

    // Store the new impersonated credentials in Redux
    store.dispatch(setCredentials({ accessToken, role, userId: targetUserId }))

    return response.data
  },
}
