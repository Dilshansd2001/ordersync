import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { repositories } from '@/repositories'

const getRecordKey = (record) => record?._id || record?.entityId || record?.entity_id

const initialState = {
  products: [],
  loading: false,
  error: null,
}

export const fetchProducts = createAsyncThunk('inventory/fetchAll', async (filters = {}, thunkAPI) => {
  try {
    return await repositories.products.list(filters)
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to fetch products.')
  }
})

export const createProduct = createAsyncThunk('inventory/create', async (payload, thunkAPI) => {
  try {
    return await repositories.products.create(payload)
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to create product.')
  }
})

export const updateProduct = createAsyncThunk('inventory/update', async ({ id, data }, thunkAPI) => {
  try {
    return await repositories.products.update(id, data)
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to update product.')
  }
})

export const deleteProduct = createAsyncThunk('inventory/delete', async (id, thunkAPI) => {
  try {
    const response = await repositories.products.remove(id)
    return getRecordKey(response) || id
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to delete product.')
  }
})

const setLoading = (state) => {
  state.loading = true
  state.error = null
}

const setError = (state, action) => {
  state.loading = false
  state.error = action.payload
}

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearInventoryError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, setLoading)
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.products = action.payload
      })
      .addCase(fetchProducts.rejected, setError)
      .addCase(createProduct.pending, setLoading)
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false
        state.products.unshift(action.payload)
      })
      .addCase(createProduct.rejected, setError)
      .addCase(updateProduct.pending, setLoading)
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false
        state.products = state.products.map((product) =>
          getRecordKey(product) === getRecordKey(action.payload) ? action.payload : product
        )
      })
      .addCase(updateProduct.rejected, setError)
      .addCase(deleteProduct.pending, setLoading)
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false
        state.products = state.products.filter((product) => getRecordKey(product) !== action.payload)
      })
      .addCase(deleteProduct.rejected, setError)
  },
})

export const { clearInventoryError } = inventorySlice.actions
export default inventorySlice.reducer
