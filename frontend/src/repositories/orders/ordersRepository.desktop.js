import {
  normalizeDesktopOrderPayload,
  normalizeDesktopOrderRecord,
} from '@/repositories/desktopAdapters'

export const createDesktopOrdersRepository = () => ({
  async list(filters = {}) {
    const response = await window.ordersync.listOrders(filters)
    return (response || []).map(normalizeDesktopOrderRecord)
  },
  async getById(id) {
    const response = await window.ordersync.getOrderById(id)
    return normalizeDesktopOrderRecord(response)
  },
  async create(payload) {
    const response = await window.ordersync.createOrder(normalizeDesktopOrderPayload(payload))
    return normalizeDesktopOrderRecord(response)
  },
  async bulkCreate(payload = []) {
    const response = await window.ordersync.bulkCreateOrders(payload.map(normalizeDesktopOrderPayload))
    return (response || []).map(normalizeDesktopOrderRecord)
  },
  async cancel(payload) {
    return window.ordersync.cancelOrder(payload)
  },
  async correct(payload) {
    return window.ordersync.correctOrder(payload)
  },
  async createShipment(id) {
    const response = await window.ordersync.createOrderShipment({
      orderEntityId: id,
    })
    return normalizeDesktopOrderRecord(response)
  },
  async updateStatus(id, data) {
    const response = await window.ordersync.updateOrderStatus({
      orderEntityId: id,
      data,
    })
    return normalizeDesktopOrderRecord(response)
  },
})
