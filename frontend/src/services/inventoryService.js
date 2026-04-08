import apiClient from './api'

export const getProducts = async (filters = {}) => {
  const response = await apiClient.get('/products', { params: filters })
  return response.data
}

export const createProduct = async (data) => {
  const response = await apiClient.post('/products', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
  return response.data
}

export const updateProduct = async (id, data) => {
  const response = await apiClient.put(`/products/${id}`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
  return response.data
}

export const deleteProduct = async (id) => {
  const response = await apiClient.delete(`/products/${id}`)
  return response.data
}

const inventoryService = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
}

export default inventoryService
