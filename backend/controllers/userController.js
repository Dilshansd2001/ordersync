const bcrypt = require('bcryptjs')

const Business = require('../models/Business')
const User = require('../models/User')
const {
  getSubscriptionStatus,
  normalizeSubscriptionPlan,
  sanitizePlanCapabilities,
} = require('../utils/subscriptionPlans')

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  businessId: user.businessId,
})

const sanitizeBusiness = (business) => ({
  id: business?._id,
  name: business?.name,
  tagline: business?.tagline,
  email: business?.email,
  phone: business?.phone,
  address: business?.address,
  logo: business?.logo,
  subscriptionPlan: normalizeSubscriptionPlan(business?.subscriptionPlan),
  current_plan: normalizeSubscriptionPlan(business?.subscriptionPlan),
  planCapabilities: sanitizePlanCapabilities(business?.subscriptionPlan, business),
  allowed_devices: sanitizePlanCapabilities(business?.subscriptionPlan, business).deviceLimit,
  active_devices_count: sanitizePlanCapabilities(business?.subscriptionPlan, business).activeDevicesCount,
  subscription_status: getSubscriptionStatus(business),
  activeModules: business?.activeModules,
  invoiceSettings: business?.invoiceSettings,
  whatsappSettings: business?.whatsappSettings,
  isActive: business?.isActive,
})

const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    const nextName = req.body.name?.trim()
    const nextEmail = req.body.email?.trim().toLowerCase()
    const nextWorkspace = req.body.workspace?.trim()
    const currentPassword = req.body.currentPassword || ''
    const newPassword = req.body.password || req.body.newPassword || ''

    if (nextEmail && nextEmail !== user.email) {
      const existingUser = await User.findOne({ email: nextEmail, _id: { $ne: user._id } })

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'This email address is already in use.',
        })
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        })
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password)

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        })
      }

      user.password = newPassword
    }

    if (nextName) {
      user.name = nextName
    }

    if (nextEmail) {
      user.email = nextEmail
    }

    await user.save()

    let business = null

    if (user.businessId) {
      business = await Business.findById(user.businessId).select(
        'name tagline email phone address logo subscriptionPlan activeModules invoiceSettings whatsappSettings isActive registeredDevices'
      )

      if (business && nextWorkspace) {
        business.name = nextWorkspace
        await business.save()
      }
    }

    return res.status(200).json({
      success: true,
      message: newPassword ? 'Profile and password updated successfully.' : 'Profile updated successfully.',
      data: {
        user: sanitizeUser(user),
        business: business ? sanitizeBusiness(business) : null,
      },
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  updateUserProfile,
}
