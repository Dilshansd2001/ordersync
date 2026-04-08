import apiClient from './api'

export const getDashboardStats = async () => {
  const response = await apiClient.get('/analytics/dashboard')
  return response.data
}

export const getFinancialReport = async (filters = {}) => {
  const response = await apiClient.get('/analytics/reports', { params: filters })
  return response.data
}

const analyticsService = {
  getDashboardStats,
  getFinancialReport,
}

export default analyticsService
