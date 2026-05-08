import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface AuthState {
  accessToken: string | null
  role: string | null
  userId: string | null
  /** null = not yet determined (initial load), false = no session, true = active session */
  isInitialized: boolean
}

const initialState: AuthState = {
  accessToken: null,
  role: null,
  userId: null,
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
      state.isInitialized = true
    },
    clearCredentials(state) {
      state.accessToken = null
      state.role = null
      state.userId = null
      state.isInitialized = true
    },
    setInitialized(state) {
      state.isInitialized = true
    },
  },
})

export const { setCredentials, clearCredentials, setInitialized } = authSlice.actions
export default authSlice.reducer
