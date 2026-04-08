const { ValidationError } = require('./errors')

const validateCustomerPayload = (payload, { partial = false } = {}) => {
  const errors = []

  if (!partial || payload.name !== undefined) {
    if (!String(payload.name || '').trim()) {
      errors.push({ field: 'name', message: 'Customer name is required.' })
    }
  }

  if (!partial || payload.phone !== undefined) {
    if (!String(payload.phone || '').trim()) {
      errors.push({ field: 'phone', message: 'Customer phone is required.' })
    }
  }

  if (payload.email && !String(payload.email).includes('@')) {
    errors.push({ field: 'email', message: 'Email must be valid.' })
  }

  if (errors.length) {
    throw new ValidationError('Invalid customer payload.', errors)
  }

  return true
}

module.exports = {
  validateCustomerPayload,
}
