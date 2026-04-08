import apiClient from './api'

export const getOrders = async (filters = {}) => {
  const response = await apiClient.get('/orders', { params: filters })
  return response.data
}

export const createOrder = async (data) => {
  const response = await apiClient.post('/orders', data)
  return response.data
}

export const bulkCreateOrders = async (orders) => {
  const response = await apiClient.post('/orders/bulk', { orders })
  return response.data
}

export const getOrderById = async (id) => {
  const response = await apiClient.get(`/orders/${id}`)
  return response.data
}

export const updateOrderStatus = async (id, data) => {
  const response = await apiClient.patch(`/orders/${id}/status`, data)
  return response.data
}

export const createShipment = async (id) => {
  const response = await apiClient.post(`/orders/${id}/shipment`)
  return response.data
}

const orderService = {
  createShipment,
  getOrders,
  createOrder,
  bulkCreateOrders,
  getOrderById,
  updateOrderStatus,
}

export default orderService
