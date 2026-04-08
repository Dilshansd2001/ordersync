import { repositories } from '@/repositories'

const unsupportedError = () => {
  throw new Error('This action is not supported yet.')
}

const executeCreateCustomer = async (payload) => repositories.customers.create(payload)

const executeCreateProduct = async (payload) => repositories.products.create(payload)

const executeCreateExpense = async (payload) => {
  const normalizedPayload = {
    ...payload,
    date: payload.date || new Date().toISOString(),
  }

  return repositories.expenses.create(normalizedPayload)
}

const resolveCustomerMatch = async (customerName) => {
  const normalizedTarget = String(customerName || '').trim().toLowerCase()

  if (!normalizedTarget) {
    throw new Error('Customer name is required for delete action.')
  }

  const customers = await repositories.customers.list()
  const exactMatches = customers.filter(
    (customer) => String(customer.name || '').trim().toLowerCase() === normalizedTarget,
  )

  if (exactMatches.length === 0) {
    throw new Error(`No exact customer match found for "${customerName}".`)
  }

  if (exactMatches.length > 1) {
    throw new Error(`Multiple customers matched "${customerName}". Please use a more specific name.`)
  }

  return exactMatches[0]
}

const executeDeleteCustomer = async (payload) => {
  const customer = await resolveCustomerMatch(payload.customerName)
  return repositories.customers.remove(customer._id || customer.entityId)
}

const executeUpdateCustomerName = async (payload) => {
  const customer = await resolveCustomerMatch(payload.currentName)

  return repositories.customers.update(customer._id || customer.entityId, {
    ...customer,
    name: payload.nextName,
  })
}

const executeTriggerSync = async () => {
  const result = await repositories.sync.triggerSync()

  if (result === null) {
    throw new Error('Desktop sync trigger is only available in the desktop app.')
  }

  return result
}

const actionExecutors = {
  create_customer: executeCreateCustomer,
  create_product: executeCreateProduct,
  create_expense: executeCreateExpense,
  delete_customer: executeDeleteCustomer,
  update_customer_name: executeUpdateCustomerName,
  trigger_sync: executeTriggerSync,
}

export const executeChatbotAction = async (actionProposal) => {
  const executor = actionExecutors[actionProposal?.type] || unsupportedError

  const data = await executor(actionProposal?.payload || {})

  return {
    type: actionProposal?.type,
    data,
  }
}

export default {
  executeChatbotAction,
}
