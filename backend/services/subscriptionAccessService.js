const Business = require('../models/Business')
const Order = require('../models/Order')
const {
  getOrderUsageWindowStart,
  getPlanDefinition,
  getSubscriptionStatus,
  hasPlanFeature,
  normalizeSubscriptionPlan,
  sanitizePlanCapabilities,
} = require('../utils/subscriptionPlans')

const DEVICE_ID_SOURCES = ['x-device-id', 'x-ordersync-device-id']

const buildError = (message, statusCode = 403, code = 'subscription_restricted') => {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  return error
}

const extractDeviceId = (req) => {
  const headerDeviceId = DEVICE_ID_SOURCES.map((header) => req.headers?.[header]).find(Boolean)
  return String(headerDeviceId || req.body?.device_id || req.query?.device_id || '').trim()
}

const getBusinessAccessContext = (business) => {
  const normalizedPlan = normalizeSubscriptionPlan(business?.subscriptionPlan)
  const definition = getPlanDefinition(normalizedPlan)
  const subscriptionStatus = getSubscriptionStatus(business)

  return {
    plan: normalizedPlan,
    definition,
    subscriptionStatus,
    capabilities: sanitizePlanCapabilities(normalizedPlan, business),
  }
}

const assertBusinessSubscriptionActive = (business) => {
  const { subscriptionStatus } = getBusinessAccessContext(business)

  if (subscriptionStatus === 'valid') {
    return
  }

  if (subscriptionStatus === 'pending_activation') {
    throw buildError('Your workspace is not activated yet.', 403, 'pending_activation')
  }

  if (subscriptionStatus === 'trial_expired') {
    throw buildError('Your free trial has expired. Upgrade to continue.', 403, 'trial_expired')
  }

  throw buildError('Your subscription needs attention before you can continue.', 403, 'subscription_inactive')
}

const ensureDeviceAllowedForBusiness = async ({ business, deviceId }) => {
  const safeDeviceId = String(deviceId || '').trim()
  const context = getBusinessAccessContext(business)

  if (!safeDeviceId) {
    return context.capabilities
  }

  const registeredDevices = Array.isArray(business.registeredDevices) ? [...business.registeredDevices] : []
  const existing = registeredDevices.find((entry) => entry.deviceId === safeDeviceId)

  if (!existing && registeredDevices.length >= context.definition.deviceLimit) {
    throw buildError(
      `Your ${context.definition.label} plan allows up to ${context.definition.deviceLimit} device${
        context.definition.deviceLimit === 1 ? '' : 's'
      }.`,
      403,
      'device_limit_reached'
    )
  }

  if (existing) {
    existing.lastSeenAt = new Date()
  } else {
    registeredDevices.push({
      deviceId: safeDeviceId,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    })
  }

  business.registeredDevices = registeredDevices
  await business.save()

  return sanitizePlanCapabilities(context.plan, business)
}

const assertPlanFeature = (business, featureKey) => {
  const plan = normalizeSubscriptionPlan(business?.subscriptionPlan)

  if (hasPlanFeature(plan, featureKey)) {
    return
  }

  const definition = getPlanDefinition(plan)
  throw buildError(`${definition.label} plan does not include this feature.`, 403, `feature_${featureKey}_blocked`)
}

const countOrdersForBusinessPlan = async ({ business, session = null }) => {
  const plan = normalizeSubscriptionPlan(business?.subscriptionPlan)
  const definition = getPlanDefinition(plan)

  if (definition.orderLimit == null) {
    return {
      count: 0,
      limit: null,
      period: definition.orderLimitPeriod,
    }
  }

  const query = {
    businessId: business._id,
    deletedAt: null,
  }
  const windowStart = getOrderUsageWindowStart(plan)

  if (windowStart) {
    query.createdAt = { $gte: windowStart }
  }

  const counter = session ? Order.countDocuments(query).session(session) : Order.countDocuments(query)
  const count = await counter

  return {
    count,
    limit: definition.orderLimit,
    period: definition.orderLimitPeriod,
  }
}

const assertOrderQuotaAvailable = async ({ business, additionalOrders = 1, session = null }) => {
  const usage = await countOrdersForBusinessPlan({ business, session })

  if (usage.limit == null) {
    return usage
  }

  if (usage.count + Number(additionalOrders || 0) <= usage.limit) {
    return usage
  }

  const periodLabel = usage.period === 'month' ? 'this month' : 'for this workspace'
  throw buildError(
    `Your ${normalizeSubscriptionPlan(business.subscriptionPlan)} plan allows up to ${usage.limit} orders ${periodLabel}.`,
    403,
    'order_limit_reached'
  )
}

const loadBusinessAccess = async ({ businessId, deviceId = '' }) => {
  const business = await Business.findById(businessId)

  if (!business) {
    throw buildError('Business workspace was not found.', 404, 'business_not_found')
  }

  assertBusinessSubscriptionActive(business)
  const capabilities = await ensureDeviceAllowedForBusiness({ business, deviceId })

  return {
    business,
    capabilities,
    subscriptionStatus: getSubscriptionStatus(business),
  }
}

module.exports = {
  assertBusinessSubscriptionActive,
  assertOrderQuotaAvailable,
  assertPlanFeature,
  countOrdersForBusinessPlan,
  ensureDeviceAllowedForBusiness,
  extractDeviceId,
  getBusinessAccessContext,
  loadBusinessAccess,
}
