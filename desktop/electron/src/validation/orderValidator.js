const { ValidationError } = require('./errors')

const validateOrderPayload = (payload) => {
  const errors = []
  const items = Array.isArray(payload.items) ? payload.items : []

  if (!items.length) {
    errors.push({ field: 'items', message: 'At least one order item is required.' })
  }

  items.forEach((item, index) => {
    if (!String(item.description || '').trim()) {
      errors.push({ field: `items[${index}].description`, message: 'Item description is required.' })
    }

    if (Number(item.qty) <= 0 || Number.isNaN(Number(item.qty))) {
      errors.push({ field: `items[${index}].qty`, message: 'Item quantity must be greater than zero.' })
    }

    if (Number(item.unit_price) < 0 || Number.isNaN(Number(item.unit_price))) {
      errors.push({ field: `items[${index}].unit_price`, message: 'Item unit price must be non-negative.' })
    }
  })

  if (errors.length) {
    throw new ValidationError('Invalid order payload.', errors)
  }

  return true
}

module.exports = {
  validateOrderPayload,
}
