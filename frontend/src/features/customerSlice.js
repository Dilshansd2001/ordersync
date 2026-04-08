import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { repositories } from '@/repositories'

const getRecordKey = (record) => record?._id || record?.entityId || record?.entity_id

const initialState = {
  customers: [],
  loading: false,
  error: null,
}

export const fetchCustomers = createAsyncThunk(
  'customers/fetchAll',
  async (filters = {}, thunkAPI) => {
    try {
      return await repositories.customers.list(filters)
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data?.message || error?.message || 'Failed to fetch customers.'
      )
    }
  }
)

export const createCustomer = createAsyncThunk(
  'customers/create',
  async (payload, thunkAPI) => {
    try {
      return await repositories.customers.create(payload)
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data?.message || error?.message || 'Failed to create customer.'
      )
    }
  }
)

export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, data }, thunkAPI) => {
    try {
      return await repositories.customers.update(id, data)
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data?.message || error?.message || 'Failed to update customer.'
      )
    }
  }
)

export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (id, thunkAPI) => {
    try {
      const response = await repositories.customers.remove(id)
      return getRecordKey(response) || id
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data?.message || error?.message || 'Failed to delete customer.'
      )
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

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearCustomerError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, setLoading)
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false
        state.customers = action.payload
      })
      .addCase(fetchCustomers.rejected, setError)
      .addCase(createCustomer.pending, setLoading)
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false
        state.customers.unshift(action.payload)
      })
      .addCase(createCustomer.rejected, setError)
      .addCase(updateCustomer.pending, setLoading)
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false
        state.customers = state.customers.map((customer) =>
          getRecordKey(customer) === getRecordKey(action.payload) ? action.payload : customer
        )
      })
      .addCase(updateCustomer.rejected, setError)
      .addCase(deleteCustomer.pending, setLoading)
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false
        state.customers = state.customers.filter((customer) => getRecordKey(customer) !== action.payload)
      })
      .addCase(deleteCustomer.rejected, setError)
  },
})

export const { clearCustomerError } = customerSlice.actions
export default customerSlice.reducer
