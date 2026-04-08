const ActivityLog = require('../models/ActivityLog')
const Business = require('../models/Business')
const Order = require('../models/Order')
const User = require('../models/User')
const { sendActivationKeyEmail } = require('../utils/activationMailer')
const {
  generateActivationKey,
  getActivationExpiryDate,
  hashActivationKey,
} = require('../utils/activationKeyUtils')
const { logActivity } = require('../utils/logActivity')
const { SUBSCRIPTION_PLANS, normalizeSubscriptionPlan } = require('../utils/subscriptionPlans')

const getDateMonthsAgo = (monthsAgo) => {
  const date = new Date()
  date.setMonth(date.getMonth() - monthsAgo)
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date
}

const buildRevenueTrend = (orders) => {
  const buckets = Array.from({ length: 6 }).map((_, index) => {
    const date = getDateMonthsAgo(5 - index)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleString('en-LK', { month: 'short' }),
      revenue: 0,
    }
  })

  const map = new Map(buckets.map((entry) => [entry.key, entry]))

  orders.forEach((order) => {
    const createdAt = new Date(order.createdAt)
    const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`
    if (map.has(key)) {
      map.get(key).revenue += Number(order.totalAmount || 0)
    }
  })

  return buckets
}

const getOverview = async (req, res, next) => {
  try {
    const sixMonthsAgo = getDateMonthsAgo(5)

    const [businesses, orders, activityLogs] = await Promise.all([
      Business.find().select('name subscriptionPlan planExpiryDate isActive createdAt').lean(),
      Order.find({ createdAt: { $gte: sixMonthsAgo } }).select('totalAmount createdAt').lean(),
      ActivityLog.find().sort({ createdAt: -1 }).limit(8).lean(),
    ])

    const activeShops = businesses.filter((business) => business.isActive).length
    const subscribedUsers = businesses.filter(
      (business) => normalizeSubscriptionPlan(business.subscriptionPlan) !== 'FREE_TRIAL'
    ).length
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)

    const planDistribution = SUBSCRIPTION_PLANS.map((plan) => ({
      name: plan,
      value: businesses.filter((business) => normalizeSubscriptionPlan(business.subscriptionPlan) === plan).length,
    }))

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalSellers: businesses.length,
          activeShops,
          subscribedUsers,
          totalRevenue,
        },
        revenueTrend: buildRevenueTrend(orders),
        planDistribution,
        recentActivity: activityLogs,
      },
    })
  } catch (error) {
    return next(error)
  }
}

const getSellers = async (req, res, next) => {
  try {
    const businesses = await Business.find()
      .select(
        'name email phone subscriptionPlan planExpiryDate activationStatus activationKeyIssuedAt activationKeyExpiresAt isActive createdAt'
      )
      .sort({ createdAt: -1 })
      .lean()

    const businessIds = businesses.map((business) => business._id)
    const [owners, orderStats] = await Promise.all([
      User.find({ businessId: { $in: businessIds }, role: 'ADMIN' })
        .select('name email businessId status lastLoginAt')
        .lean(),
      Order.aggregate([
        { $match: { businessId: { $in: businessIds } } },
        {
          $group: {
            _id: '$businessId',
            orderCount: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
      ]),
    ])

    const ownerMap = new Map(owners.map((owner) => [String(owner.businessId), owner]))
    const orderStatsMap = new Map(
      orderStats.map((entry) => [
        String(entry._id),
        { orderCount: Number(entry.orderCount || 0), revenue: Number(entry.revenue || 0) },
      ])
    )

    const sellers = businesses.map((business) => {
      const owner = ownerMap.get(String(business._id))
      const stats = orderStatsMap.get(String(business._id)) || { orderCount: 0, revenue: 0 }

      return {
        _id: business._id,
        sellerName: owner?.name || business.name,
        sellerEmail: owner?.email || business.email,
        shopName: business.name,
        phone: business.phone,
        subscriptionPlan: normalizeSubscriptionPlan(business.subscriptionPlan),
        planExpiryDate: business.planExpiryDate,
        activationStatus: business.activationStatus || 'pending',
        activationKeyIssuedAt: business.activationKeyIssuedAt || null,
        activationKeyExpiresAt: business.activationKeyExpiresAt || null,
        status: business.isActive && owner?.status !== 'suspended' ? 'active' : 'suspended',
        orderCount: stats.orderCount,
        revenue: stats.revenue,
        lastLoginAt: owner?.lastLoginAt || null,
        createdAt: business.createdAt,
      }
    })

    return res.status(200).json({
      success: true,
      data: {
        sellers,
      },
    })
  } catch (error) {
    return next(error)
  }
}

const updateSeller = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id)

    if (!business) {
      return res.status(404).json({ success: false, message: 'Seller shop not found.' })
    }

    const owner = await User.findOne({ businessId: business._id, role: 'ADMIN' })
    const previousPlan = normalizeSubscriptionPlan(business.subscriptionPlan)
    const previousStatus = business.isActive ? 'active' : 'suspended'

    if (req.body.subscriptionPlan) {
      business.subscriptionPlan = normalizeSubscriptionPlan(req.body.subscriptionPlan)
    }

    if (req.body.planExpiryDate !== undefined) {
      business.planExpiryDate = req.body.planExpiryDate ? new Date(req.body.planExpiryDate) : null
    }

    if (req.body.status) {
      const isActive = req.body.status === 'active'
      business.isActive = isActive
      if (owner) {
        owner.status = isActive ? 'active' : 'suspended'
        await owner.save()
      }
    }

    await business.save()

    await logActivity({
      actorUserId: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      businessId: business._id,
      targetUserId: owner?._id,
      action: 'SELLER_UPDATED',
      description: `${business.name} seller settings were updated by super admin.`,
      metadata: {
        previousPlan,
        newPlan: business.subscriptionPlan,
        previousStatus,
        newStatus: business.isActive ? 'active' : 'suspended',
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Seller updated successfully.',
      data: {
        seller: {
          _id: business._id,
          sellerName: owner?.name || business.name,
          sellerEmail: owner?.email || business.email,
          shopName: business.name,
          subscriptionPlan: normalizeSubscriptionPlan(business.subscriptionPlan),
          planExpiryDate: business.planExpiryDate,
          activationStatus: business.activationStatus || 'pending',
          activationKeyIssuedAt: business.activationKeyIssuedAt || null,
          activationKeyExpiresAt: business.activationKeyExpiresAt || null,
          status: business.isActive ? 'active' : 'suspended',
        },
      },
    })
  } catch (error) {
    return next(error)
  }
}

const sendSellerActivationKey = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id)

    if (!business) {
      return res.status(404).json({ success: false, message: 'Seller shop not found.' })
    }

    const owner = await User.findOne({ businessId: business._id, role: 'ADMIN' })
    const recipientEmail = owner?.email || business.email

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'No business email address is available for this seller.',
      })
    }

    const activationKey = generateActivationKey(business.subscriptionPlan)
    const activationKeyExpiresAt = getActivationExpiryDate()

    business.activationStatus = 'pending'
    business.activationKeyHash = hashActivationKey(activationKey)
    business.activationKeyIssuedAt = new Date()
    business.activationKeyExpiresAt = activationKeyExpiresAt
    await business.save()

    const emailStatus = await sendActivationKeyEmail({
      activationKey,
      businessName: business.name,
      expiresAt: activationKeyExpiresAt,
      selectedPlan: normalizeSubscriptionPlan(business.subscriptionPlan),
      toEmail: recipientEmail,
    })

    await logActivity({
      actorUserId: req.user?._id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      businessId: business._id,
      targetUserId: owner?._id,
      action: 'SELLER_ACTIVATION_KEY_SENT',
      description: `Activation key was issued for ${business.name} by super admin.`,
      metadata: {
        recipientEmail,
        emailDelivered: emailStatus.delivered,
        activationExpiresAt: activationKeyExpiresAt,
      },
    })

    return res.status(200).json({
      success: true,
      message: emailStatus.delivered
        ? 'Activation key email sent successfully.'
        : 'Activation key generated, but email delivery was skipped. Check SMTP settings.',
      data: {
        seller: {
          _id: business._id,
          sellerName: owner?.name || business.name,
          sellerEmail: recipientEmail,
          shopName: business.name,
          subscriptionPlan: normalizeSubscriptionPlan(business.subscriptionPlan),
          planExpiryDate: business.planExpiryDate,
          activationStatus: business.activationStatus || 'pending',
          activationKeyIssuedAt: business.activationKeyIssuedAt || null,
          activationKeyExpiresAt: business.activationKeyExpiresAt || null,
          status: business.isActive ? 'active' : 'suspended',
        },
        emailDelivered: emailStatus.delivered,
      },
    })
  } catch (error) {
    return next(error)
  }
}

const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return res.status(200).json({
      success: true,
      data: {
        logs,
      },
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getActivityLogs,
  getOverview,
  getSellers,
  sendSellerActivationKey,
  updateSeller,
}
