const jwt = require('jsonwebtoken')

const env = require('../config/env')
const User = require('../models/User')
const {
  extractDeviceId,
  loadBusinessAccess,
} = require('../services/subscriptionAccessService')

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Bearer token is required.',
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, env.jwtSecret)

    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User account was not found.',
      })
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      status: user.status,
    }

    return next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Invalid or expired token.',
    })
  }
}

const requireTenant = (req, res, next) => {
  return (async () => {
    const businessId = req.user?.businessId

    if (!businessId) {
      return res.status(403).json({
        success: false,
        message: 'Tenant access denied. Business context is required.',
      })
    }

    const tenantId = businessId.toString()
    const deviceId = extractDeviceId(req)
    const access = await loadBusinessAccess({ businessId: tenantId, deviceId })

    req.businessId = tenantId
    req.business = access.business
    req.planCapabilities = access.capabilities
    req.subscriptionStatus = access.subscriptionStatus
    req.deviceId = deviceId
    req.body = { ...req.body, businessId: tenantId }
    req.query = { ...req.query, businessId: tenantId }

    return next()
  })().catch((error) => {
    return res.status(error.statusCode || 403).json({
      success: false,
      message: error.message || 'Tenant access is restricted.',
      code: error.code || 'tenant_access_blocked',
    })
  })
}

const requireAdmin = (req, res, next) => {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: 'Admin access is required for this resource.',
    })
  }

  return next()
}

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin only.',
    })
  }

  return next()
}

module.exports = {
  protect,
  requireAdmin,
  requireSuperAdmin,
  requireTenant,
}
