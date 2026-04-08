import { configureStore } from '@reduxjs/toolkit'
import adminReducer from '@/store/adminSlice'
import authReducer from './authSlice'
import customerReducer from './customerSlice'
import expenseReducer from './expenseSlice'
import inventoryReducer from './inventorySlice'
import orderReducer from './orderSlice'

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    auth: authReducer,
    customers: customerReducer,
    expenses: expenseReducer,
    inventory: inventoryReducer,
    orders: orderReducer,
  },
})
