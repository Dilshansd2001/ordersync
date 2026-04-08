import expenseService from '@/services/expenseService'

export const createHttpExpensesRepository = () => ({
  async list(filters = {}) {
    const response = await expenseService.getExpenses(filters)
    return response.data
  },
  async create(payload) {
    const response = await expenseService.createExpense(payload)
    return response.data
  },
  async remove(entityId) {
    await expenseService.deleteExpense(entityId)
    return entityId
  },
})
