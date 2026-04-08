import apiClient from './api'

export const getOverview = async () => {
  const response = await apiClient.get('/admin/overview')
  return response.data
}

export const getSellers = async () => {
  const response = await apiClient.get('/admin/sellers')
  return response.data
}

export const updateSeller = async (id, data) => {
  const response = await apiClient.put(`/admin/sellers/${id}`, data)
  return response.data
}

export const sendSellerActivationKey = async (id) => {
  const response = await apiClient.post(`/admin/sellers/${id}/send-activation-key`)
  return response.data
}

export const getActivityLogs = async () => {
  const response = await apiClient.get('/admin/activity-logs')
  return response.data
}

const adminService = {
  getActivityLogs,
  getOverview,
  getSellers,
  sendSellerActivationKey,
  updateSeller,
}

export default adminService
