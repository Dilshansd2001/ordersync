import {
  normalizeDesktopExpensePayload,
  normalizeDesktopExpenseRecord,
} from '@/repositories/desktopAdapters'

export const createDesktopExpensesRepository = () => ({
  async list(filters = {}) {
    const response = await window.ordersync.listExpenses(filters)
    return (response || []).map(normalizeDesktopExpenseRecord)
  },
  async create(payload) {
    const response = await window.ordersync.createExpense(normalizeDesktopExpensePayload(payload))
    return normalizeDesktopExpenseRecord(response)
  },
  async remove(entityId) {
    const response = await window.ordersync.deleteExpense(entityId)
    return normalizeDesktopExpenseRecord(response)
  },
})
