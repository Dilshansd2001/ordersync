import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { repositories } from '@/repositories'

const getRecordKey = (record) => record?._id || record?.entityId || record?.entity_id

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
}

export const fetchOrders = createAsyncThunk('orders/fetchAll', async (filters = {}, thunkAPI) => {
  try {
    return await repositories.orders.list(filters)
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to fetch orders.')
  }
})

export const createOrder = createAsyncThunk('orders/create', async (payload, thunkAPI) => {
  try {
    return await repositories.orders.create(payload)
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to create order.')
  }
})

export const bulkCreateOrders = createAsyncThunk('orders/bulkCreate', async (payload, thunkAPI) => {
  try {
    return await repositories.orders.bulkCreate(payload)
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to import orders.')
  }
})

export const fetchOrderById = createAsyncThunk('orders/fetchById', async (id, thunkAPI) => {
  try {
    return await repositories.orders.getById(id)
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to fetch order.')
  }
})

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, data }, thunkAPI) => {
    try {
      return await repositories.orders.updateStatus(id, data)
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to update order status.')
    }
  }
)

export const createCourierShipment = createAsyncThunk(
  'orders/createShipment',
  async (id, thunkAPI) => {
    try {
      return await repositories.orders.createShipment(id)
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to create shipment.')
    }
  }
)

const setLoading = (state) => {
  state.loading = true
  state.error = null
}

const setError = (state, action) => {
  state.loading = false
  state.error = action.payload
}

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, setLoading)
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(fetchOrders.rejected, setError)
      .addCase(createOrder.pending, setLoading)
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false
        state.orders.unshift(action.payload)
        state.currentOrder = action.payload
      })
      .addCase(createOrder.rejected, setError)
      .addCase(bulkCreateOrders.pending, setLoading)
      .addCase(bulkCreateOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = [...action.payload, ...state.orders]
      })
      .addCase(bulkCreateOrders.rejected, setError)
      .addCase(fetchOrderById.pending, setLoading)
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload
      })
      .addCase(fetchOrderById.rejected, setError)
      .addCase(updateOrderStatus.pending, setLoading)
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload
        state.orders = state.orders.map((order) =>
          getRecordKey(order) === getRecordKey(action.payload) ? action.payload : order
        )
      })
      .addCase(updateOrderStatus.rejected, setError)
      .addCase(createCourierShipment.pending, setLoading)
      .addCase(createCourierShipment.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload
        state.orders = state.orders.map((order) =>
          getRecordKey(order) === getRecordKey(action.payload) ? action.payload : order
        )
      })
      .addCase(createCourierShipment.rejected, setError)
  },
})

export const { clearOrderError, clearCurrentOrder } = orderSlice.actions
export default orderSlice.reducer
