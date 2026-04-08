import apiClient from './api'

export const getWhatsAppSettings = async () => {
  const response = await apiClient.get('/settings/whatsapp')
  return response.data
}

export const getWhatsAppOnboardingStatus = async () => {
  const response = await apiClient.get('/settings/whatsapp/onboarding')
  return response.data
}

export const getProfileSettings = async () => {
  const response = await apiClient.get('/settings/profile')
  return response.data
}

export const updateProfileSettings = async (data) => {
  const response = await apiClient.put('/settings/profile', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
  return response.data
}

export const getInvoiceSettings = async () => {
  const response = await apiClient.get('/settings/invoice')
  return response.data
}

export const getSmsSettings = async () => {
  const response = await apiClient.get('/settings/sms')
  return response.data
}

export const updateInvoiceSettings = async (data) => {
  const response = await apiClient.put('/settings/invoice', data)
  return response.data
}

export const updateSmsSettings = async (data) => {
  const response = await apiClient.put('/settings/sms', data)
  return response.data
}

export const updateWhatsAppSettings = async (data) => {
  const response = await apiClient.put('/settings/whatsapp', data)
  return response.data
}

export const getCourierSettings = async () => {
  const response = await apiClient.get('/settings/courier')
  return response.data
}

export const updateCourierSettings = async (data) => {
  const response = await apiClient.put('/settings/courier', data)
  return response.data
}

export const testCourierSettings = async () => {
  const response = await apiClient.post('/settings/courier/test')
  return response.data
}

export const getStaff = async () => {
  const response = await apiClient.get('/settings/team')
  return response.data
}

export const inviteStaff = async (data) => {
  const response = await apiClient.post('/settings/team', data)
  return response.data
}

export const updateStaff = async (id, data) => {
  const response = await apiClient.put(`/settings/team/${id}`, data)
  return response.data
}

export const deleteStaff = async (id) => {
  const response = await apiClient.delete(`/settings/team/${id}`)
  return response.data
}

export const resetStaffPassword = async (id, password) => {
  const response = await apiClient.patch(`/settings/team/${id}/reset-password`, { password })
  return response.data
}

const settingsService = {
  getProfileSettings,
  updateProfileSettings,
  getInvoiceSettings,
  getSmsSettings,
  updateInvoiceSettings,
  updateSmsSettings,
  getWhatsAppSettings,
  getWhatsAppOnboardingStatus,
  updateWhatsAppSettings,
  getCourierSettings,
  updateCourierSettings,
  testCourierSettings,
  getStaff,
  inviteStaff,
  updateStaff,
  deleteStaff,
  resetStaffPassword,
}

export default settingsService
