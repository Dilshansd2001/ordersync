import inventoryService from '@/services/inventoryService'

export const createHttpProductsRepository = () => ({
  async list(filters = {}) {
    const response = await inventoryService.getProducts(filters)
    return response.data
  },
  async create(payload) {
    const response = await inventoryService.createProduct(payload)
    return response.data
  },
  async update(entityId, data) {
    const response = await inventoryService.updateProduct(entityId, data)
    return response.data
  },
  async remove(entityId) {
    await inventoryService.deleteProduct(entityId)
    return entityId
  },
})
