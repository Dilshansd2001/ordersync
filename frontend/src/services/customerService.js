import apiClient from './api'

export const getCustomers = async (filters = {}) => {
  const response = await apiClient.get('/customers', { params: filters })
  return response.data
}

export const createCustomer = async (data) => {
  const response = await apiClient.post('/customers', data)
  return response.data
}

export const updateCustomer = async (id, data) => {
  const response = await apiClient.put(`/customers/${id}`, data)
  return response.data
}

export const deleteCustomer = async (id) => {
  const response = await apiClient.delete(`/customers/${id}`)
  return response.data
}

export const sendCustomerMessage = async (id, data) => {
  const response = await apiClient.post(`/customers/${id}/send-message`, data)
  return response.data
}

const customerService = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  sendCustomerMessage,
}

export default customerService
