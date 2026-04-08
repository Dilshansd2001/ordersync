import orderService from '@/services/orderService'

export const createHttpOrdersRepository = () => ({
  async list(filters = {}) {
    const response = await orderService.getOrders(filters)
    return response.data
  },
  async getById(id) {
    const response = await orderService.getOrderById(id)
    return response.data
  },
  async create(payload) {
    const response = await orderService.createOrder(payload)
    return response.data
  },
  async bulkCreate(payload) {
    const response = await orderService.bulkCreateOrders(payload)
    return response.data
  },
  async cancel() {
    throw new Error('Order cancel is not implemented in web mode yet.')
  },
  async correct() {
    throw new Error('Order correction is not implemented in web mode yet.')
  },
  async createShipment(id) {
    const response = await orderService.createShipment(id)
    return response.data
  },
  async updateStatus(id, data) {
    const response = await orderService.updateOrderStatus(id, data)
    return response.data
  },
})
