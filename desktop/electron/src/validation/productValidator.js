const { ValidationError } = require('./errors')

const validateProductPayload = (payload, { partial = false } = {}) => {
  const errors = []

  if (!partial || payload.sku !== undefined) {
    if (!String(payload.sku || '').trim()) {
      errors.push({ field: 'sku', message: 'SKU is required.' })
    }
  }

  if (!partial || payload.name !== undefined) {
    if (!String(payload.name || '').trim()) {
      errors.push({ field: 'name', message: 'Product name is required.' })
    }
  }

  if (!partial || payload.buying_price !== undefined) {
    if (Number(payload.buying_price) < 0 || Number.isNaN(Number(payload.buying_price))) {
      errors.push({ field: 'buying_price', message: 'Buying price must be a non-negative number.' })
    }
  }

  if (!partial || payload.selling_price !== undefined) {
    if (Number(payload.selling_price) < 0 || Number.isNaN(Number(payload.selling_price))) {
      errors.push({ field: 'selling_price', message: 'Selling price must be a non-negative number.' })
    }
  }

  if (!partial || payload.stock_count !== undefined) {
    if (Number(payload.stock_count) < 0 || Number.isNaN(Number(payload.stock_count))) {
      errors.push({ field: 'stock_count', message: 'Stock count must be a non-negative number.' })
    }
  }

  if (errors.length) {
    throw new ValidationError('Invalid product payload.', errors)
  }

  return true
}

module.exports = {
  validateProductPayload,
}
