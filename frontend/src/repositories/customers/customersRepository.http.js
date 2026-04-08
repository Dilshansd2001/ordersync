import customerService from '@/services/customerService'

export const createHttpCustomersRepository = () => ({
  async list(filters = {}) {
    const response = await customerService.getCustomers(filters)
    return response.data
  },
  async create(payload) {
    const response = await customerService.createCustomer(payload)
    return response.data
  },
  async update(entityId, data) {
    const response = await customerService.updateCustomer(entityId, data)
    return response.data
  },
  async remove(entityId) {
    await customerService.deleteCustomer(entityId)
    return entityId
  },
})
