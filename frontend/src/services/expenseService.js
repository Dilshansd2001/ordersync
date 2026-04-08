import apiClient from './api'

export const getExpenses = async (filters = {}) => {
  const response = await apiClient.get('/expenses', { params: filters })
  return response.data
}

export const createExpense = async (data) => {
  const response = await apiClient.post('/expenses', data)
  return response.data
}

export const deleteExpense = async (id) => {
  const response = await apiClient.delete(`/expenses/${id}`)
  return response.data
}

const expenseService = {
  getExpenses,
  createExpense,
  deleteExpense,
}

export default expenseService
