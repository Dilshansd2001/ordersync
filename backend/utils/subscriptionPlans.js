const PLAN_DEFINITIONS = {
  FREE_TRIAL: {
    key: 'FREE_TRIAL',
    label: 'Free Trial',
    publicSignup: true,
    priceLabel: 'Free for 7 days',
    deviceLimit: 1,
    orderLimit: 50,
    orderLimitPeriod: 'workspace',
    features: {
      aiAssistant: false,
      bulkUpload: false,
      courierSync: false,
      expenses: false,
      inventory: false,
      reports: true,
      teamManagement: false,
    },
  },
  STARTER: {
    key: 'STARTER',
    label: 'Starter',
    publicSignup: true,
    priceLabel: 'LKR 1,250 / month',
    deviceLimit: 1,
    orderLimit: 300,
    orderLimitPeriod: 'month',
    features: {
      aiAssistant: false,
      bulkUpload: false,
      courierSync: false,
      expenses: true,
      inventory: false,
      reports: false,
      teamManagement: false,
    },
  },
  GROWTH: {
    key: 'GROWTH',
    label: 'Growth',
    publicSignup: true,
    priceLabel: 'LKR 2,500 / month',
    deviceLimit: 3,
    orderLimit: null,
    orderLimitPeriod: 'unlimited',
    features: {
      aiAssistant: false,
      bulkUpload: true,
      courierSync: false,
      expenses: true,
      inventory: true,
      reports: true,
      teamManagement: false,
    },
  },
  PRO: {
    key: 'PRO',
    label: 'Pro',
    publicSignup: true,
    priceLabel: 'LKR 4,500 / month',
    deviceLimit: 5,
    orderLimit: null,
    orderLimitPeriod: 'unlimited',
    features: {
      aiAssistant: true,
      bulkUpload: true,
      courierSync: true,
      expenses: true,
      inventory: true,
      reports: true,
      teamManagement: true,
    },
  },
  ENTERPRISE: {
    key: 'ENTERPRISE',
    label: 'Enterprise',
    publicSignup: false,
    priceLabel: 'Custom pricing',
    deviceLimit: 999,
    orderLimit: null,
    orderLimitPeriod: 'unlimited',
    features: {
      aiAssistant: true,
      bulkUpload: true,
      courierSync: true,
      expenses: true,
      inventory: true,
      reports: true,
      teamManagement: true,
    },
  },
}

const PLAN_ALIASES = {
  FREE_TRIAL: 'FREE_TRIAL',
  STARTER: 'STARTER',
  GROWTH: 'GROWTH',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
  BASIC: 'STARTER',
  PREMIUM: 'PRO',
}

const SUBSCRIPTION_PLANS = Object.keys(PLAN_DEFINITIONS)
const PUBLIC_SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS.filter((plan) => PLAN_DEFINITIONS[plan].publicSignup)

const normalizeSubscriptionPlan = (plan) => {
  if (typeof plan !== 'string') {
    return 'GROWTH'
  }

  return PLAN_ALIASES[plan.trim().toUpperCase()] || 'GROWTH'
}

const getPlanDefinition = (plan) => PLAN_DEFINITIONS[normalizeSubscriptionPlan(plan)]

const getPlanFeatures = (plan) => ({
  ...getPlanDefinition(plan).features,
})

const hasPlanFeature = (plan, featureKey) => Boolean(getPlanDefinition(plan).features?.[featureKey])

const isPaidPlan = (plan) => normalizeSubscriptionPlan(plan) !== 'FREE_TRIAL'

const getSubscriptionStatus = (business) => {
  if (!business) {
    return 'inactive'
  }

  if (business.isActive === false) {
    return 'inactive'
  }

  if (business.activationStatus && business.activationStatus !== 'active') {
    return 'pending_activation'
  }

  if (!business.planExpiryDate) {
    return 'valid'
  }

  const expiry = new Date(business.planExpiryDate)

  if (Number.isNaN(expiry.getTime())) {
    return 'valid'
  }

  if (expiry.getTime() >= Date.now()) {
    return 'valid'
  }

  return normalizeSubscriptionPlan(business.subscriptionPlan) === 'FREE_TRIAL'
    ? 'trial_expired'
    : 'inactive'
}

const getOrderUsageWindowStart = (plan) => {
  const definition = getPlanDefinition(plan)

  if (definition.orderLimitPeriod !== 'month') {
    return null
  }

  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

const sanitizePlanCapabilities = (plan, business = null) => {
  const definition = getPlanDefinition(plan)
  const registeredDevices = Array.isArray(business?.registeredDevices) ? business.registeredDevices.length : 0

  return {
    key: definition.key,
    label: definition.label,
    priceLabel: definition.priceLabel,
    deviceLimit: definition.deviceLimit,
    orderLimit: definition.orderLimit,
    orderLimitPeriod: definition.orderLimitPeriod,
    features: {
      ...definition.features,
    },
    activeDevicesCount: registeredDevices,
    subscriptionStatus: business ? getSubscriptionStatus(business) : 'valid',
  }
}

module.exports = {
  PLAN_ALIASES,
  PLAN_DEFINITIONS,
  PUBLIC_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLANS,
  getOrderUsageWindowStart,
  getPlanDefinition,
  getPlanFeatures,
  getSubscriptionStatus,
  hasPlanFeature,
  isPaidPlan,
  normalizeSubscriptionPlan,
  sanitizePlanCapabilities,
}
