import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import authService from '@/services/authService'

const storedToken = localStorage.getItem('ordersync_token')
const storedUser = localStorage.getItem('ordersync_user')
const storedBusiness = localStorage.getItem('ordersync_business')

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  business: storedBusiness ? JSON.parse(storedBusiness) : null,
  isAuthenticated: Boolean(storedToken),
  pendingActivation: null,
  loading: false,
  error: null,
}

const persistAuthSession = (response) => {
  localStorage.setItem('ordersync_token', response.token)
  localStorage.setItem('ordersync_user', JSON.stringify(response.user))
  localStorage.setItem('ordersync_business', JSON.stringify(response.business))
}

export const loginUser = createAsyncThunk('auth/login', async (credentials, thunkAPI) => {
  try {
    const response = await authService.login(credentials)

    persistAuthSession(response)

    return response
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Login failed.')
  }
})

export const registerBusinessUser = createAsyncThunk(
  'auth/registerBusiness',
  async (payload, thunkAPI) => {
    try {
      const response = await authService.registerBusiness(payload)

      return response
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Registration failed.')
    }
  }
)

export const verifyBusinessActivation = createAsyncThunk(
  'auth/verifyBusinessActivation',
  async (payload, thunkAPI) => {
    try {
      const response = await authService.verifyActivationKey(payload)
      persistAuthSession(response)
      return response
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Activation failed.')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
      localStorage.setItem('ordersync_user', JSON.stringify(action.payload))
    },
    setBusiness: (state, action) => {
      state.business = action.payload
      localStorage.setItem('ordersync_business', JSON.stringify(action.payload))
    },
    hydrateDesktopSession: (state, action) => {
      state.user = action.payload?.user || null
      state.business = action.payload?.business || null
      state.token = null
      state.pendingActivation = null
      state.isAuthenticated = Boolean(action.payload?.user)
      state.loading = false
      state.error = null
    },
    logout: (state) => {
      localStorage.removeItem('ordersync_token')
      localStorage.removeItem('ordersync_user')
      localStorage.removeItem('ordersync_business')

      state.user = null
      state.token = null
      state.business = null
      state.pendingActivation = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
    },
    clearAuthError: (state) => {
      state.error = null
    },
    clearPendingActivation: (state) => {
      state.pendingActivation = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.business = action.payload.business
        state.pendingActivation = null
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(registerBusinessUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerBusinessUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = null
        state.token = null
        state.business = action.payload.business
        state.pendingActivation = {
          email: action.payload.activation?.email || action.payload.user?.email || '',
          key: '',
          expiresAt: action.payload.activation?.expiresAt || null,
          businessName: action.payload.business?.name || action.payload.user?.name || '',
          plan: action.payload.business?.subscriptionPlan || null,
          status: action.payload.business?.activationStatus || 'pending',
        }
        state.isAuthenticated = false
      })
      .addCase(registerBusinessUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(verifyBusinessActivation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyBusinessActivation.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.business = action.payload.business
        state.pendingActivation = null
        state.isAuthenticated = true
      })
      .addCase(verifyBusinessActivation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { setUser, setBusiness, hydrateDesktopSession, logout, clearAuthError, clearPendingActivation } =
  authSlice.actions
export default authSlice.reducer
