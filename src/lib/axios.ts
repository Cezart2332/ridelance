import axios, { type InternalAxiosRequestConfig } from 'axios'
import { store } from '../store/store'
import { clearCredentials } from '../store/authSlice'
import { isRegistrationPath, refreshAccessToken } from './refreshSession'

// Create the configured Axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Always send cookies (needed for refresh-token cookie)
})

// ── Request Interceptor ──────────────────────────────────────────────────────
// Reads the access token from Redux state (in-memory only) and attaches it.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor — silent token refresh on 401 ──────────────────────
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only attempt refresh for 401 errors on non-refresh endpoints
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/users/refresh-token') ||
      originalRequest.url?.includes('/users/login')
    ) {
      return Promise.reject(error)
    }

    // If a refresh is already in flight, queue this request until it resolves
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { accessToken } = await refreshAccessToken()

      // Retry all queued requests with the new token
      processQueue(null, accessToken)
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      // Refresh failed — log the user out
      processQueue(refreshError, null)
      store.dispatch(clearCredentials())

      const path = window.location.pathname
      if (!path.startsWith('/auth') && !isRegistrationPath(path)) {
        window.location.href = '/auth'
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
