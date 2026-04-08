import apiClient from './api'

export const login = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials)
  return response.data
}

export const registerBusiness = async (data) => {
  const response = await apiClient.post('/auth/register-business', data)
  return response.data
}

export const verifyActivationKey = async (data) => {
  const response = await apiClient.post('/auth/verify-activation-key', data)
  return response.data
}

const authService = {
  login,
  registerBusiness,
  verifyActivationKey,
}

export default authService
