import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { repositories } from '@/repositories'

const getRecordKey = (record) => record?._id || record?.entityId || record?.entity_id

const initialState = {
  expenses: [],
  loading: false,
  error: null,
}

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchAll',
  async (filters = {}, thunkAPI) => {
    try {
      return await repositories.expenses.list(filters)
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to fetch expenses.')
    }
  }
)

export const createExpense = createAsyncThunk(
  'expenses/create',
  async (payload, thunkAPI) => {
    try {
      return await repositories.expenses.create(payload)
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to create expense.')
    }
  }
)

export const deleteExpense = createAsyncThunk(
  'expenses/delete',
  async (id, thunkAPI) => {
    try {
      const response = await repositories.expenses.remove(id)
      return getRecordKey(response) || id
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to delete expense.')
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

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearExpenseError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, setLoading)
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false
        state.expenses = action.payload
      })
      .addCase(fetchExpenses.rejected, setError)
      .addCase(createExpense.pending, setLoading)
      .addCase(createExpense.fulfilled, (state, action) => {
        state.loading = false
        state.expenses.unshift(action.payload)
      })
      .addCase(createExpense.rejected, setError)
      .addCase(deleteExpense.pending, setLoading)
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.loading = false
        state.expenses = state.expenses.filter((expense) => getRecordKey(expense) !== action.payload)
      })
      .addCase(deleteExpense.rejected, setError)
  },
})

export const { clearExpenseError } = expenseSlice.actions
export default expenseSlice.reducer
