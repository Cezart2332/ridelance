import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface ImpersonationState {
  /** The admin who started impersonating (their own session lives in the refresh cookie). */
  adminUserId: string
  adminRole: string
  /** Display name of the account being viewed, for the warning banner. */
  targetName: string
}

export interface AuthState {
  accessToken: string | null
  role: string | null
  userId: string | null
  /** Set while an admin is viewing another user's account. */
  impersonation: ImpersonationState | null
  /** null = not yet determined (initial load), false = no session, true = active session */
  isInitialized: boolean
}

const initialState: AuthState = {
  accessToken: null,
  role: null,
  userId: null,
  impersonation: null,
  isInitialized: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ accessToken: string; role: string; userId: string }>
    ) {
      state.accessToken = action.payload.accessToken
      state.role = action.payload.role
      state.userId = action.payload.userId
      // A token refresh always restores the admin session (the cookie is the
      // admin's), so getting the admin's credentials back ends impersonation.
      if (state.impersonation && action.payload.userId === state.impersonation.adminUserId) {
        state.impersonation = null
      }
      state.isInitialized = true
    },
    startImpersonation(state, action: PayloadAction<ImpersonationState>) {
      state.impersonation = action.payload
    },
    clearCredentials(state) {
      state.accessToken = null
      state.role = null
      state.userId = null
      state.impersonation = null
      state.isInitialized = true
    },
    setInitialized(state) {
      state.isInitialized = true
    },
  },
})

export const { setCredentials, startImpersonation, clearCredentials, setInitialized } = authSlice.actions
export default authSlice.reducer
