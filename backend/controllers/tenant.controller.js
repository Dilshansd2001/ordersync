const { normalizeSubscriptionPlan, sanitizePlanCapabilities } = require('../utils/subscriptionPlans')

const getTenantContext = (req, res) => {
  const business = req.business
  const planCapabilities = req.planCapabilities || sanitizePlanCapabilities(business?.subscriptionPlan, business)

  return res.status(200).json({
    success: true,
    message: 'Tenant context resolved.',
    businessId: req.businessId || null,
    tenant: {
      tenantId: req.businessId || null,
      businessId: req.businessId || null,
      name: business?.name || '',
      tagline: business?.tagline || '',
      subscriptionPlan: normalizeSubscriptionPlan(business?.subscriptionPlan),
      current_plan: normalizeSubscriptionPlan(business?.subscriptionPlan),
      planExpiryDate: business?.planExpiryDate || null,
      activationStatus: business?.activationStatus || 'pending',
      isActive: business?.isActive !== false,
      allowed_devices: planCapabilities.deviceLimit,
      active_devices_count: planCapabilities.activeDevicesCount,
      subscription_status: planCapabilities.subscriptionStatus,
      planCapabilities,
    },
  })
}

module.exports = {
  getTenantContext,
}
