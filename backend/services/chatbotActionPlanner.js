const amountPattern = /(?:lkr|rs\.?|rs|amount)?\s*([0-9]+(?:\.[0-9]+)?)/i

const categoryKeywords = [
  'Advertisement',
  'Packing',
  'Delivery',
  'Utilities',
  'Supplies',
  'Other',
]

const normalizeWhitespace = (value = '') => value.replace(/\s+/g, ' ').trim()

const extractAfterKeyword = (message, keyword) => {
  const index = message.toLowerCase().indexOf(keyword)

  if (index === -1) {
    return ''
  }

  return normalizeWhitespace(message.slice(index + keyword.length))
}

const parseExpenseAction = (message) => {
  if (!/(add|create|record|log|danna|hadanna).*(expense)|expense.*(add|create|record|log|danna|hadanna)/i.test(message)) {
    return null
  }

  const amountMatch = message.match(amountPattern)

  if (!amountMatch) {
    return null
  }

  const amount = Number(amountMatch[1])
  const category =
    categoryKeywords.find((item) => new RegExp(item, 'i').test(message)) || 'Other'

  let description = ''
  const forMatch = message.match(/\bfor\b(.+)$/i)

  if (forMatch?.[1]) {
    description = normalizeWhitespace(forMatch[1])
  } else {
    description = normalizeWhitespace(message.replace(amountMatch[0], '').replace(/expense/gi, '').replace(/add|create|record|log|danna|hadanna/gi, ''))
  }

  return {
    type: 'create_expense',
    title: 'Add expense',
    summary: `Add a ${category} expense for LKR ${amount.toFixed(2)}.`,
    confirmationMessage: 'Confirm to add this expense to the workspace.',
    payload: {
      category,
      amount,
      description: description || `${category} expense`,
      date: new Date().toISOString(),
    },
  }
}

const parseCustomerAction = (message) => {
  if (!/(add|create|new|danna|hadanna).*(customer)|customer.*(add|create|new|danna|hadanna)/i.test(message)) {
    return null
  }

  const phoneMatch = message.match(/(?:phone|mobile|number)\s*[:\-]?\s*(\+?[0-9]{9,15})/i)
  const nameMatch = message.match(/customer\s+named?\s+([^,]+?)(?:\s+phone|\s+mobile|\s+number|$)/i) ||
    message.match(/add\s+customer\s+([^,]+?)(?:\s+phone|\s+mobile|\s+number|$)/i)

  if (!phoneMatch || !nameMatch) {
    return null
  }

  const emailMatch = message.match(/email\s*[:\-]?\s*([^\s,]+@[^\s,]+)/i)
  const districtMatch = message.match(/district\s*[:\-]?\s*([^,]+)$/i)

  return {
    type: 'create_customer',
    title: 'Create customer',
    summary: `Create customer ${normalizeWhitespace(nameMatch[1])} with phone ${phoneMatch[1]}.`,
    confirmationMessage: 'Confirm to create this customer in the workspace.',
    payload: {
      name: normalizeWhitespace(nameMatch[1]),
      phone: phoneMatch[1],
      whatsappNumber: phoneMatch[1],
      email: emailMatch?.[1] || '',
      district: districtMatch ? normalizeWhitespace(districtMatch[1]) : '',
      addressLine: '',
      nearestCity: '',
      loyaltyStatus: 'ACTIVE',
      notes: 'Created by ODERSYNC AI ASSISTANT after user confirmation.',
    },
  }
}

const parseDeleteCustomerAction = (message) => {
  if (!/(delete|remove|erase|delete karanna|remove karanna).*(customer)|customer.*(delete|remove|erase|delete karanna|remove karanna)/i.test(message)) {
    return null
  }

  const nameMatch =
    message.match(/customer\s+(.+?)(?:\s+delete|\s+remove|$)/i) ||
    message.match(/delete\s+customer\s+(.+)$/i) ||
    message.match(/remove\s+customer\s+(.+)$/i)

  if (!nameMatch?.[1]) {
    return null
  }

  const customerName = normalizeWhitespace(nameMatch[1])

  return {
    type: 'delete_customer',
    title: 'Delete customer',
    summary: `Delete customer "${customerName}" if exactly one matching customer is found.`,
    confirmationMessage: 'This is a destructive action. Confirm only if you want to permanently delete this customer.',
    payload: {
      customerName,
    },
  }
}

const parseUpdateCustomerNameAction = (message) => {
  if (!/(update|change|rename).*(customer).*(name)|customer.*(update|change|rename).*(name)/i.test(message)) {
    return null
  }

  const match =
    message.match(/update\s+customer\s+name\s+(.+?)\s+to\s+(.+)$/i) ||
    message.match(/change\s+customer\s+name\s+(.+?)\s+to\s+(.+)$/i) ||
    message.match(/rename\s+customer\s+(.+?)\s+to\s+(.+)$/i)

  if (!match?.[1] || !match?.[2]) {
    return null
  }

  const currentName = normalizeWhitespace(match[1])
  const nextName = normalizeWhitespace(match[2])

  if (!currentName || !nextName || currentName.toLowerCase() === nextName.toLowerCase()) {
    return null
  }

  return {
    type: 'update_customer_name',
    title: 'Update customer name',
    summary: `Rename customer "${currentName}" to "${nextName}" if exactly one matching customer is found.`,
    confirmationMessage: 'Confirm to update this customer name.',
    payload: {
      currentName,
      nextName,
    },
  }
}

const parseProductAction = (message) => {
  if (!/(add|create|new|danna|hadanna).*(product)|product.*(add|create|new|danna|hadanna)/i.test(message)) {
    return null
  }

  const nameMatch = message.match(/product\s+named?\s+([^,]+?)(?:\s+sku|\s+selling|\s+buying|\s+stock|$)/i) ||
    message.match(/add\s+product\s+([^,]+?)(?:\s+sku|\s+selling|\s+buying|\s+stock|$)/i)
  const skuMatch = message.match(/sku\s*[:\-]?\s*([A-Za-z0-9_-]+)/i)
  const sellingMatch = message.match(/selling\s*(?:price)?\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i)
  const buyingMatch = message.match(/buying\s*(?:price)?\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i)
  const stockMatch = message.match(/stock\s*[:\-]?\s*([0-9]+)/i)
  const categoryMatch = message.match(/category\s*[:\-]?\s*([^,]+?)(?:\s+sku|\s+selling|\s+buying|\s+stock|$)/i)

  if (!nameMatch || !skuMatch || !sellingMatch || !buyingMatch) {
    return null
  }

  const stockCount = Number(stockMatch?.[1] || 0)

  return {
    type: 'create_product',
    title: 'Create product',
    summary: `Create product ${normalizeWhitespace(nameMatch[1])} with SKU ${skuMatch[1]}.`,
    confirmationMessage: 'Confirm to create this product in the workspace.',
    payload: {
      name: normalizeWhitespace(nameMatch[1]),
      sku: skuMatch[1],
      category: categoryMatch ? normalizeWhitespace(categoryMatch[1]) : '',
      buyingPrice: Number(buyingMatch[1]),
      sellingPrice: Number(sellingMatch[1]),
      stockCount,
      image: '',
      isAvailable: stockCount > 0,
      notes: 'Created by ODERSYNC AI ASSISTANT after user confirmation.',
    },
  }
}

const parseSyncAction = (message, runtime) => {
  if (runtime !== 'desktop') {
    return null
  }

  if (!/(sync).*(run|start|trigger|retry|karanna|yanna)|(?:run|start|trigger|retry|karanna).*(sync)/i.test(message)) {
    return null
  }

  return {
    type: 'trigger_sync',
    title: 'Trigger desktop sync',
    summary: 'Run the desktop sync now.',
    confirmationMessage: 'Confirm to start a desktop sync now.',
    payload: {},
  }
}

const planChatbotAction = ({ message, runtime = 'web' }) => {
  const normalized = normalizeWhitespace(message || '')

  if (!normalized) {
    return null
  }

  return (
    parseSyncAction(normalized, runtime) ||
    parseUpdateCustomerNameAction(normalized) ||
    parseDeleteCustomerAction(normalized) ||
    parseExpenseAction(normalized) ||
    parseCustomerAction(normalized) ||
    parseProductAction(normalized)
  )
}

module.exports = {
  planChatbotAction,
}
