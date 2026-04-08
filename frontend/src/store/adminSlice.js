import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import adminService from '@/services/adminService'

const initialState = {
  overview: {
    stats: {
      totalSellers: 0,
      activeShops: 0,
      subscribedUsers: 0,
      totalRevenue: 0,
    },
    revenueTrend: [],
    planDistribution: [],
    recentActivity: [],
  },
  sellers: [],
  logs: [],
  loading: false,
  sellerUpdating: false,
  sellerSendingActivation: false,
  error: null,
}

export const fetchAdminOverview = createAsyncThunk('admin/fetchOverview', async (_, thunkAPI) => {
  try {
    const response = await adminService.getOverview()
    return response.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load admin overview.')
  }
})

export const fetchAdminSellers = createAsyncThunk('admin/fetchSellers', async (_, thunkAPI) => {
  try {
    const response = await adminService.getSellers()
    return response.data.sellers
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load sellers.')
  }
})

export const fetchActivityLogs = createAsyncThunk('admin/fetchActivityLogs', async (_, thunkAPI) => {
  try {
    const response = await adminService.getActivityLogs()
    return response.data.logs
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load activity logs.')
  }
})

export const updateSellerAdmin = createAsyncThunk(
  'admin/updateSeller',
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await adminService.updateSeller(id, data)
      return response.data.seller
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update seller.')
    }
  }
)

export const sendSellerActivationKeyAdmin = createAsyncThunk(
  'admin/sendSellerActivationKey',
  async (id, thunkAPI) => {
    try {
      const response = await adminService.sendSellerActivationKey(id)
      return response.data
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to send activation key.'
      )
    }
  }
)

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOverview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAdminOverview.fulfilled, (state, action) => {
        state.loading = false
        state.overview = action.payload
      })
      .addCase(fetchAdminOverview.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchAdminSellers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAdminSellers.fulfilled, (state, action) => {
        state.loading = false
        state.sellers = action.payload
      })
      .addCase(fetchAdminSellers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.logs = action.payload
      })
      .addCase(updateSellerAdmin.pending, (state) => {
        state.sellerUpdating = true
        state.error = null
      })
      .addCase(updateSellerAdmin.fulfilled, (state, action) => {
        state.sellerUpdating = false
        state.sellers = state.sellers.map((seller) =>
          seller._id === action.payload._id ? { ...seller, ...action.payload } : seller
        )
      })
      .addCase(updateSellerAdmin.rejected, (state, action) => {
        state.sellerUpdating = false
        state.error = action.payload
      })
      .addCase(sendSellerActivationKeyAdmin.pending, (state) => {
        state.sellerSendingActivation = true
        state.error = null
      })
      .addCase(sendSellerActivationKeyAdmin.fulfilled, (state, action) => {
        state.sellerSendingActivation = false
        state.sellers = state.sellers.map((seller) =>
          seller._id === action.payload.seller._id ? { ...seller, ...action.payload.seller } : seller
        )
      })
      .addCase(sendSellerActivationKeyAdmin.rejected, (state, action) => {
        state.sellerSendingActivation = false
        state.error = action.payload
      })
  },
})

export default adminSlice.reducer
