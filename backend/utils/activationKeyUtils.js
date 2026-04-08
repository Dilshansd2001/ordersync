const crypto = require('node:crypto')
const { normalizeSubscriptionPlan } = require('./subscriptionPlans')

const ACTIVATION_KEY_VALIDITY_DAYS = 14

const hashActivationKey = (key) => crypto.createHash('sha256').update(key).digest('hex')

const generateActivationKey = (plan) => {
  const prefix = normalizeSubscriptionPlan(plan).replace(/_/g, '').slice(0, 4).padEnd(4, 'X')
  const segments = Array.from({ length: 3 }).map(() =>
    crypto.randomBytes(2).toString('hex').toUpperCase()
  )

  return `OSLK-${prefix}-${segments.join('-')}`
}

const getActivationExpiryDate = () => {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + ACTIVATION_KEY_VALIDITY_DAYS)
  return expiry
}

module.exports = {
  ACTIVATION_KEY_VALIDITY_DAYS,
  generateActivationKey,
  getActivationExpiryDate,
  hashActivationKey,
}
