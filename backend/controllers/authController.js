const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const env = require('../config/env')
const Business = require('../models/Business')
const User = require('../models/User')
const { sendActivationKeyEmail } = require('../utils/activationMailer')
const {
  generateActivationKey,
  getActivationExpiryDate,
  hashActivationKey,
} = require('../utils/activationKeyUtils')
const { logActivity } = require('../utils/logActivity')
const {
  normalizeSubscriptionPlan,
  sanitizePlanCapabilities,
  getSubscriptionStatus,
} = require('../utils/subscriptionPlans')

const FREE_TRIAL_VALIDITY_DAYS = 4

const getPlanExpiryDate = (plan) => {
  if (normalizeSubscriptionPlan(plan) !== 'FREE_TRIAL') {
    return null
  }

  const expiry = new Date()
  expiry.setDate(expiry.getDate() + FREE_TRIAL_VALIDITY_DAYS)
  return expiry
}

const generateToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      businessId: user.businessId,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: '7d' }
  )

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  businessId: user.businessId,
  status: user.status,
  lastLoginAt: user.lastLoginAt,
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
  planExpiryDate: business?.planExpiryDate,
  activationStatus: business?.activationStatus,
  activeModules: business?.activeModules,
  allowed_devices: sanitizePlanCapabilities(business?.subscriptionPlan, business).deviceLimit,
  active_devices_count: sanitizePlanCapabilities(business?.subscriptionPlan, business).activeDevicesCount,
  subscription_status: getSubscriptionStatus(business),
  planCapabilities: sanitizePlanCapabilities(business?.subscriptionPlan, business),
  invoiceSettings: business?.invoiceSettings,
  whatsappSettings: business?.whatsappSettings,
  isActive: business?.isActive,
})

const sanitizeOptionalBusiness = (business) => (business ? sanitizeBusiness(business) : null)

const registerBusiness = async (req, res, next) => {
  try {
    const { businessName, phone, email, password, plan } = req.body

    if (!businessName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Business name, email, and password are required.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const [existingBusiness, existingUser] = await Promise.all([
      Business.findOne({ email: normalizedEmail }),
      User.findOne({ email: normalizedEmail }),
    ])

    if (existingBusiness || existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account already exists with this email address.',
      })
    }

    const normalizedPlan = normalizeSubscriptionPlan(plan)

    const business = await Business.create({
      name: businessName,
      phone,
      email: normalizedEmail,
      subscriptionPlan: normalizedPlan,
      planExpiryDate: getPlanExpiryDate(normalizedPlan),
      activationStatus: 'pending',
      activationKeyHash: '',
      activationKeyIssuedAt: null,
      activationKeyExpiresAt: null,
      isActive: true,
    })

    let user

    try {
      user = await User.create({
        businessId: business._id,
        name: businessName,
        email: normalizedEmail,
        password,
        role: 'ADMIN',
        status: 'active',
      })
    } catch (userError) {
      await Business.deleteOne({ _id: business._id })
      console.error('ADMIN user creation failed during registration:', userError.message)
      throw userError
    }

    await logActivity({
      actorUserId: user._id,
      actorName: user.name,
      actorRole: user.role,
      businessId: business._id,
      targetUserId: user._id,
      action: 'SELLER_REGISTERED',
      description: `${business.name} workspace registered on plan ${normalizedPlan}.`,
      metadata: {
        subscriptionPlan: normalizedPlan,
        activationStatus: 'pending',
      },
    })

    return res.status(201).json({
      success: true,
      message:
        'Business registered successfully. Your workspace is pending payment review. A super admin will email your activation key after approval.',
      user: sanitizeUser(user),
      business: sanitizeBusiness(business),
      activation: {
        email: normalizedEmail,
        key: '',
        expiresAt: null,
        emailDelivered: false,
      },
    })
  } catch (error) {
    console.error('Business registration failed:', error.message)
    return next(error)
  }
}

const verifyActivationKey = async (req, res, next) => {
  try {
    const { email, key } = req.body

    if (!email || !key) {
      return res.status(400).json({
        success: false,
        message: 'Email and activation key are required.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account was found for this email address.',
      })
    }

    const business = user.businessId ? await Business.findById(user.businessId) : null

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business account was not found for this activation request.',
      })
    }

    if (business.activationStatus === 'active') {
      const token = generateToken(user)

      return res.status(200).json({
        success: true,
        message: 'Account is already active. You can continue into the workspace.',
        token,
        user: sanitizeUser(user),
        business: sanitizeBusiness(business),
      })
    }

    if (!business.activationKeyHash) {
      return res.status(400).json({
        success: false,
        message:
          'Your activation key has not been issued yet. Please wait for super admin approval and check your email.',
      })
    }

    if (business.activationKeyExpiresAt && business.activationKeyExpiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'This activation key has expired. Please contact support for a new key.',
      })
    }

    if (hashActivationKey(key.trim().toUpperCase()) !== business.activationKeyHash) {
      return res.status(401).json({
        success: false,
        message: 'Activation key is invalid.',
      })
    }

    business.activationStatus = 'active'
    business.activationKeyHash = ''
    business.activationKeyIssuedAt = null
    business.activationKeyExpiresAt = null
    await business.save()

    user.lastLoginAt = new Date()
    await user.save()

    await logActivity({
      actorUserId: user._id,
      actorName: user.name,
      actorRole: user.role,
      businessId: business._id,
      targetUserId: user._id,
      action: 'SELLER_ACTIVATED',
      description: `${business.name} workspace was activated successfully.`,
      metadata: {
        subscriptionPlan: normalizeSubscriptionPlan(business.subscriptionPlan),
      },
    })

    const token = generateToken(user)

    return res.status(200).json({
      success: true,
      message: 'Activation successful. Your workspace is now ready.',
      token,
      user: sanitizeUser(user),
      business: sanitizeBusiness(business),
    })
  } catch (error) {
    return next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      console.error(`Login failed: user not found for ${normalizedEmail}`)
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      console.error(`Login failed: password mismatch for ${normalizedEmail}`)
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This user account is suspended.',
      })
    }

    const business = user.businessId ? await Business.findById(user.businessId) : null

    if (user.role !== 'SUPER_ADMIN' && (!business || !business.isActive)) {
      console.error(`Login failed: business inactive or missing for ${normalizedEmail}`)
      return res.status(403).json({
        success: false,
        message: 'This business account is inactive.',
      })
    }

    if (user.role !== 'SUPER_ADMIN' && business.activationStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not activated yet. Verify your activation key first.',
      })
    }

    user.lastLoginAt = new Date()
    await user.save()

    await logActivity({
      actorUserId: user._id,
      actorName: user.name,
      actorRole: user.role,
      businessId: user.businessId,
      targetUserId: user._id,
      action: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN_LOGIN' : 'SELLER_LOGIN',
      description:
        user.role === 'SUPER_ADMIN'
          ? `${user.name} signed into the super admin panel.`
          : `${user.name} signed into ${business?.name || 'their'} workspace.`,
    })

    const token = generateToken(user)

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: sanitizeUser(user),
      business: sanitizeOptionalBusiness(business),
    })
  } catch (error) {
    console.error('Login controller error:', error.message)
    return next(error)
  }
}

module.exports = {
  registerBusiness,
  verifyActivationKey,
  login,
}
