const {
  assertOrderQuotaAvailable,
  assertPlanFeature,
} = require('../services/subscriptionAccessService')

const requirePlanFeature = (featureKey) => (req, res, next) => {
  try {
    assertPlanFeature(req.business, featureKey)
    return next()
  } catch (error) {
    return res.status(error.statusCode || 403).json({
      success: false,
      message: error.message,
      code: error.code || 'feature_blocked',
    })
  }
}

const requireOrderQuota = (deriveAdditionalOrders = () => 1) => {
  return async (req, res, next) => {
    try {
      await assertOrderQuotaAvailable({
        business: req.business,
        additionalOrders: deriveAdditionalOrders(req),
      })
      return next()
    } catch (error) {
      return res.status(error.statusCode || 403).json({
        success: false,
        message: error.message,
        code: error.code || 'order_limit_reached',
      })
    }
  }
}

module.exports = {
  requireOrderQuota,
  requirePlanFeature,
}
