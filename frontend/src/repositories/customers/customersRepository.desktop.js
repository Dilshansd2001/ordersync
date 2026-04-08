import {
  normalizeDesktopCustomerPayload,
  normalizeDesktopCustomerRecord,
} from '@/repositories/desktopAdapters'

export const createDesktopCustomersRepository = () => ({
  async list(filters = {}) {
    const response = await window.ordersync.listCustomers(filters)
    return (response?.items || []).map(normalizeDesktopCustomerRecord)
  },
  async create(payload) {
    const response = await window.ordersync.createCustomer(normalizeDesktopCustomerPayload(payload))
    return normalizeDesktopCustomerRecord(response)
  },
  async update(entityId, data) {
    const response = await window.ordersync.updateCustomer({
      entityId,
      data: normalizeDesktopCustomerPayload(data),
    })
    return normalizeDesktopCustomerRecord(response)
  },
  async remove(entityId) {
    const response = await window.ordersync.deleteCustomer(entityId)
    return normalizeDesktopCustomerRecord(response)
  },
})
