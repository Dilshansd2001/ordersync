const Business = require('../models/Business')
const User = require('../models/User')
const { buildFileUrl } = require('../utils/cloudinary')
const {
  assertCourierSettingsReady,
  pingCourierConnection,
} = require('../services/courier/courierService')
const { defaultSmsTemplate } = require('../utils/sendTextMessage')
const {
  getSubscriptionStatus,
  normalizeSubscriptionPlan,
  sanitizePlanCapabilities,
} = require('../utils/subscriptionPlans')

const defaultWhatsAppTemplate =
  'Hi {customer_name}, your order {order_id} has been dispatched! Tracking: {tracking_number}. Amount to pay: {amount}'

const defaultMessageEvents = {
  orderConfirmation: {
    enabled: true,
    template:
      'Hi {customerName}, your order {orderId} has been successfully placed. Total: Rs.{amount}. Thank you for shopping with us! - {businessName}',
  },
  orderReady: {
    enabled: false,
    template:
      'Your order #{orderId} is ready for pickup. Tracking ID: {trackingId}. It will reach you shortly. - {businessName}',
  },
  thankYou: {
    enabled: false,
    template:
      'Thank you for your visit to {businessName}! We hope to see you again soon. Have a great day!',
  },
}

const defaultInvoiceSettings = {
  template: 'Modern',
  printFormat: 'A4',
  prefix: 'INV-',
  startingNumber: 1001,
  toggles: {
    showLogo: true,
    showBusinessAddress: true,
    showPhone: true,
    showPaymentNotes: true,
  },
}

const defaultCourierSettings = {
  enabled: false,
  provider: 'KOOMBIYO',
  apiToken: '',
  apiKey: '',
  apiSecret: '',
  baseUrl: '',
  createShipmentPath: '/shipments',
  healthCheckPath: '/health',
  senderName: '',
  senderPhone: '',
  senderAddress: '',
  defaultServiceType: 'STANDARD',
  autoDispatch: false,
}

const defaultSmsSettings = {
  enabled: false,
  apiToken: '',
  senderId: '',
  defaultTemplate: defaultSmsTemplate,
  events: defaultMessageEvents,
}

const defaultWhatsAppSettings = {
  enabled: false,
  apiToken: '',
  phoneNumberId: '',
  messageTemplate: defaultWhatsAppTemplate,
  events: defaultMessageEvents,
}

const buildMessageEvents = (source = {}) => ({
  orderConfirmation: {
    enabled: source.orderConfirmation?.enabled ?? defaultMessageEvents.orderConfirmation.enabled,
    template: source.orderConfirmation?.template?.trim() || defaultMessageEvents.orderConfirmation.template,
  },
  orderReady: {
    enabled: source.orderReady?.enabled ?? defaultMessageEvents.orderReady.enabled,
    template: source.orderReady?.template?.trim() || defaultMessageEvents.orderReady.template,
  },
  thankYou: {
    enabled: source.thankYou?.enabled ?? defaultMessageEvents.thankYou.enabled,
    template: source.thankYou?.template?.trim() || defaultMessageEvents.thankYou.template,
  },
})

const maskSecret = (value) => {
  const normalized = String(value || '').trim()

  if (!normalized) {
    return ''
  }

  if (normalized.length <= 4) {
    return '*'.repeat(normalized.length)
  }

  return `${'*'.repeat(Math.max(normalized.length - 4, 4))}${normalized.slice(-4)}`
}

const sanitizeCourierSettings = (settings = {}) => ({
  enabled: Boolean(settings.enabled),
  provider: settings.provider || defaultCourierSettings.provider,
  apiToken: maskSecret(settings.apiToken),
  apiKey: maskSecret(settings.apiKey),
  apiSecret: maskSecret(settings.apiSecret),
  baseUrl: settings.baseUrl || '',
  createShipmentPath: settings.createShipmentPath || defaultCourierSettings.createShipmentPath,
  healthCheckPath: settings.healthCheckPath || defaultCourierSettings.healthCheckPath,
  senderName: settings.senderName || '',
  senderPhone: settings.senderPhone || '',
  senderAddress: settings.senderAddress || '',
  defaultServiceType: settings.defaultServiceType || defaultCourierSettings.defaultServiceType,
  autoDispatch: Boolean(settings.autoDispatch),
  hasApiToken: Boolean(settings.apiToken),
  hasApiKey: Boolean(settings.apiKey),
  hasApiSecret: Boolean(settings.apiSecret),
})

const sanitizeStaff = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
})

const withPlanCapabilities = (business) => {
  if (!business) {
    return business
  }

  const source = typeof business.toObject === 'function' ? business.toObject() : business
  const planCapabilities = sanitizePlanCapabilities(source.subscriptionPlan, source)

  return {
    ...source,
    subscriptionPlan: normalizeSubscriptionPlan(source.subscriptionPlan),
    current_plan: normalizeSubscriptionPlan(source.subscriptionPlan),
    planCapabilities,
    allowed_devices: planCapabilities.deviceLimit,
    active_devices_count: planCapabilities.activeDevicesCount,
    subscription_status: getSubscriptionStatus(source),
  }
}

const getProfileSettings = async (req, res, next) => {
  try {
    const business = await Business.findOne({ _id: req.businessId }).select(
      'name tagline email phone address logo subscriptionPlan activeModules invoiceSettings whatsappSettings isActive registeredDevices'
    )

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' })
    }

    return res.status(200).json({ success: true, data: { business: withPlanCapabilities(business) } })
  } catch (error) {
    return next(error)
  }
}

const updateProfileSettings = async (req, res, next) => {
  try {
    const updatePayload = {
      name: req.body.name?.trim(),
      tagline: req.body.tagline?.trim() || '',
      email: req.body.email?.trim().toLowerCase(),
      phone: req.body.phone?.trim() || '',
      address: req.body.address?.trim() || '',
    }

    if (req.file) {
      updatePayload.logo = buildFileUrl(req, req.file)
    } else if (req.body.logo !== undefined) {
      updatePayload.logo = req.body.logo?.trim() || ''
    }

    const business = await Business.findOneAndUpdate(
      { _id: req.businessId },
      updatePayload,
      { new: true, runValidators: true }
    ).select(
      'name tagline email phone address logo subscriptionPlan activeModules invoiceSettings whatsappSettings isActive registeredDevices'
    )

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' })
    }

    return res.status(200).json({
      success: true,
      message: 'Business profile updated successfully.',
      data: { business: withPlanCapabilities(business) },
    })
  } catch (error) {
    return next(error)
  }
}

const getInvoiceSettings = async (req, res, next) => {
  try {
    const business = await Business.findOne({ _id: req.businessId }).select(
      'name logo phone address invoiceSettings subscriptionPlan isActive registeredDevices'
    )

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' })
    }

    return res.status(200).json({ success: true, data: { business: withPlanCapabilities(business) } })
  } catch (error) {
    return next(error)
  }
}

const updateInvoiceSettings = async (req, res, next) => {
  try {
    const invoiceSettings = {
      template: req.body.template || defaultInvoiceSettings.template,
      printFormat: req.body.printFormat || defaultInvoiceSettings.printFormat,
      prefix: req.body.prefix?.trim() || defaultInvoiceSettings.prefix,
      startingNumber: Number(req.body.startingNumber) || defaultInvoiceSettings.startingNumber,
      toggles: {
        showLogo: Boolean(req.body.toggles?.showLogo),
        showBusinessAddress: Boolean(req.body.toggles?.showBusinessAddress),
        showPhone: Boolean(req.body.toggles?.showPhone),
        showPaymentNotes: Boolean(req.body.toggles?.showPaymentNotes),
      },
    }

    const business = await Business.findOneAndUpdate(
      { _id: req.businessId },
      { invoiceSettings },
      { new: true, runValidators: true }
    ).select(
      'name tagline email phone address logo subscriptionPlan activeModules invoiceSettings whatsappSettings isActive registeredDevices'
    )

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' })
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice settings updated successfully.',
      data: { business: withPlanCapabilities(business) },
    })
  } catch (error) {
    return next(error)
  }
}

const getWhatsAppSettings = async (req, res, next) => {
  try {
    const business = await Business.findOne({ _id: req.businessId }).select(
      'name phone whatsappSettings activeModules subscriptionPlan isActive registeredDevices'
    )

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        business: withPlanCapabilities(business),
      },
    })
  } catch (error) {
    return next(error)
  }
}

const getWhatsAppOnboardingStatus = async (req, res, next) => {
  try {
    const business = await Business.findOne({ _id: req.businessId }).select('name whatsappSettings')

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      })
    }

    const metaAppId = String(process.env.WHATSAPP_META_APP_ID || '').trim()
    const metaConfigId = String(process.env.WHATSAPP_META_CONFIG_ID || '').trim()
    const redirectUri =
      String(process.env.WHATSAPP_EMBEDDED_SIGNUP_REDIRECT_URI || '').trim() ||
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings/whatsapp`

    return res.status(200).json({
      success: true,
      data: {
        meta: {
          appId: metaAppId,
          configId: metaConfigId,
          redirectUri,
          embeddedSignupConfigured: Boolean(metaAppId && metaConfigId),
        },
        business: {
          name: business.name,
          whatsappSettings: business.whatsappSettings,
        },
        links: {
          appDashboard: 'https://developers.facebook.com/apps/',
          whatsappManager: 'https://business.facebook.com/wa/manage/home/',
          cloudApiOverview: 'https://meta-preview.mintlify.io/docs/whatsapp/cloud-api/overview',
        },
      },
    })
  } catch (error) {
    return next(error)
  }
}

const getSmsSettings = async (req, res, next) => {
  try {
    const business = await Business.findOne({ _id: req.businessId }).select(
      'name phone smsSettings subscriptionPlan isActive registeredDevices'
    )

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        business: {
          ...withPlanCapabilities(business),
          smsSettings: {
            enabled: Boolean(business.smsSettings?.enabled),
            apiToken: business.smsSettings?.apiToken || '',
            senderId: business.smsSettings?.senderId || '',
            defaultTemplate:
              business.smsSettings?.defaultTemplate || defaultSmsSettings.defaultTemplate,
            events: buildMessageEvents(business.smsSettings?.events),
          },
        },
      },
    })
  } catch (error) {
    return next(error)
  }
}

const updateWhatsAppSettings = async (req, res, next) => {
  try {
    const whatsappEvents = buildMessageEvents(req.body.events)
    const whatsappSettings = {
      enabled: Boolean(req.body.enabled),
      apiToken: req.body.apiToken?.trim() || '',
      phoneNumberId: req.body.phoneNumberId?.trim() || '',
      messageTemplate: req.body.messageTemplate?.trim() || defaultWhatsAppTemplate,
      events: whatsappEvents,
    }

    const business = await Business.findOneAndUpdate(
      { _id: req.businessId },
      {
        'whatsappSettings.enabled': whatsappSettings.enabled,
        'whatsappSettings.apiToken': whatsappSettings.apiToken,
        'whatsappSettings.phoneNumberId': whatsappSettings.phoneNumberId,
        'whatsappSettings.messageTemplate': whatsappSettings.messageTemplate,
        'whatsappSettings.events.orderConfirmation.enabled': Boolean(
          whatsappEvents.orderConfirmation.enabled
        ),
        'whatsappSettings.events.orderConfirmation.template':
          whatsappEvents.orderConfirmation.template,
        'whatsappSettings.events.orderReady.enabled': Boolean(whatsappEvents.orderReady.enabled),
        'whatsappSettings.events.orderReady.template': whatsappEvents.orderReady.template,
        'whatsappSettings.events.thankYou.enabled': Boolean(whatsappEvents.thankYou.enabled),
        'whatsappSettings.events.thankYou.template': whatsappEvents.thankYou.template,
        'activeModules.whatsappAlerts': whatsappSettings.enabled,
      },
      { new: true, runValidators: true }
    ).select('name email phone whatsappSettings activeModules subscriptionPlan isActive registeredDevices')

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'WhatsApp settings updated successfully.',
      data: {
        business: withPlanCapabilities(business),
      },
    })
  } catch (error) {
    return next(error)
  }
}

const updateSmsSettings = async (req, res, next) => {
  try {
    const smsEvents = buildMessageEvents(req.body.events)
    const smsSettings = {
      enabled: Boolean(req.body.enabled),
      apiToken: req.body.apiToken?.trim() || '',
      senderId: req.body.senderId?.trim() || '',
      defaultTemplate: req.body.defaultTemplate?.trim() || defaultSmsSettings.defaultTemplate,
      events: smsEvents,
    }

    const business = await Business.findOneAndUpdate(
      { _id: req.businessId },
      {
        'smsSettings.enabled': smsSettings.enabled,
        'smsSettings.apiToken': smsSettings.apiToken,
        'smsSettings.senderId': smsSettings.senderId,
        'smsSettings.defaultTemplate': smsSettings.defaultTemplate,
        'smsSettings.events.orderConfirmation.enabled': Boolean(
          smsEvents.orderConfirmation.enabled
        ),
        'smsSettings.events.orderConfirmation.template': smsEvents.orderConfirmation.template,
        'smsSettings.events.orderReady.enabled': Boolean(smsEvents.orderReady.enabled),
        'smsSettings.events.orderReady.template': smsEvents.orderReady.template,
        'smsSettings.events.thankYou.enabled': Boolean(smsEvents.thankYou.enabled),
        'smsSettings.events.thankYou.template': smsEvents.thankYou.template,
      },
      { new: true, runValidators: true }
    ).select('name email phone smsSettings activeModules subscriptionPlan isActive registeredDevices')

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'SMS settings updated successfully.',
      data: {
        business: {
          ...withPlanCapabilities(business),
          smsSettings: {
            enabled: Boolean(business.smsSettings?.enabled),
            apiToken: business.smsSettings?.apiToken || '',
            senderId: business.smsSettings?.senderId || '',
            defaultTemplate:
              business.smsSettings?.defaultTemplate || defaultSmsSettings.defaultTemplate,
            events: buildMessageEvents(business.smsSettings?.events),
          },
        },
      },
    })
  } catch (error) {
    return next(error)
  }
}

const getCourierSettings = async (req, res, next) => {
  try {
    const business = await Business.findOne({ _id: req.businessId }).select(
      'name phone address courierSettings activeModules subscriptionPlan isActive registeredDevices'
    )

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        business: {
          ...withPlanCapabilities(business),
          courierSettings: sanitizeCourierSettings(business.courierSettings),
        },
      },
    })
  } catch (error) {
    return next(error)
  }
}

const updateCourierSettings = async (req, res, next) => {
  try {
    const existingBusiness = await Business.findById(req.businessId).select('courierSettings')

    if (!existingBusiness) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      })
    }

    const currentSettings = existingBusiness.courierSettings || defaultCourierSettings
    const courierSettings = {
      enabled: Boolean(req.body.enabled),
      provider: req.body.provider === 'CUSTOM' ? 'CUSTOM' : 'KOOMBIYO',
      apiToken:
        req.body.apiToken === undefined
          ? currentSettings.apiToken || ''
          : req.body.apiToken?.trim() || '',
      apiKey:
        req.body.apiKey === undefined ? currentSettings.apiKey || '' : req.body.apiKey?.trim() || '',
      apiSecret:
        req.body.apiSecret === undefined
          ? currentSettings.apiSecret || ''
          : req.body.apiSecret?.trim() || '',
      baseUrl: req.body.baseUrl?.trim() || '',
      createShipmentPath:
        req.body.createShipmentPath?.trim() || defaultCourierSettings.createShipmentPath,
      healthCheckPath: req.body.healthCheckPath?.trim() || defaultCourierSettings.healthCheckPath,
      senderName: req.body.senderName?.trim() || '',
      senderPhone: req.body.senderPhone?.trim() || '',
      senderAddress: req.body.senderAddress?.trim() || '',
      defaultServiceType:
        req.body.defaultServiceType?.trim() || defaultCourierSettings.defaultServiceType,
      autoDispatch: Boolean(req.body.autoDispatch),
    }

    const business = await Business.findOneAndUpdate(
      { _id: req.businessId },
      {
        courierSettings,
        'activeModules.koombiyoSync': courierSettings.enabled,
      },
      { new: true, runValidators: true }
    ).select('name email phone courierSettings activeModules subscriptionPlan isActive registeredDevices')

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Courier settings updated successfully.',
      data: {
        business: {
          ...withPlanCapabilities(business),
          courierSettings: sanitizeCourierSettings(business.courierSettings),
        },
      },
    })
  } catch (error) {
    return next(error)
  }
}

const testCourierSettings = async (req, res, next) => {
  try {
    const business = await Business.findById(req.businessId).select('courierSettings')

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      })
    }

    assertCourierSettingsReady(business.courierSettings)
    const result = await pingCourierConnection(business.courierSettings)

    return res.status(200).json({
      success: true,
      message: 'Courier connection successful.',
      data: result,
    })
  } catch (error) {
    if (error.message) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    return next(error)
  }
}

const getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ businessId: req.businessId })
      .select('name email role createdAt')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      data: {
        staff: staff.map(sanitizeStaff),
      },
    })
  } catch (error) {
    return next(error)
  }
}

const inviteStaff = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await User.findOne({ email: normalizedEmail, businessId: req.businessId })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A team member already exists with this email address.',
      })
    }

    const user = await User.create({
      businessId: req.businessId,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role === 'STAFF' ? 'STAFF' : 'ADMIN',
    })

    return res.status(201).json({
      success: true,
      message: 'Team member added successfully.',
      data: {
        user: sanitizeStaff(user),
      },
    })
  } catch (error) {
    return next(error)
  }
}

const updateStaff = async (req, res, next) => {
  try {
    const updates = {
      name: req.body.name?.trim(),
      email: req.body.email?.trim().toLowerCase(),
      role: req.body.role === 'STAFF' ? 'STAFF' : 'ADMIN',
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      updates,
      { new: true, runValidators: true }
    ).select('name email role createdAt')

    if (!user) {
      return res.status(404).json({ success: false, message: 'Team member not found.' })
    }

    return res.status(200).json({
      success: true,
      message: 'Team member updated successfully.',
      data: { user: sanitizeStaff(user) },
    })
  } catch (error) {
    return next(error)
  }
}

const deleteStaff = async (req, res, next) => {
  try {
    if (String(req.user?._id) === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' })
    }

    const user = await User.findOneAndDelete({ _id: req.params.id, businessId: req.businessId })

    if (!user) {
      return res.status(404).json({ success: false, message: 'Team member not found.' })
    }

    return res.status(200).json({
      success: true,
      message: 'Team member deleted successfully.',
    })
  } catch (error) {
    return next(error)
  }
}

const resetStaffPassword = async (req, res, next) => {
  try {
    if (!req.body.password) {
      return res.status(400).json({ success: false, message: 'New password is required.' })
    }

    const user = await User.findOne({ _id: req.params.id, businessId: req.businessId })

    if (!user) {
      return res.status(404).json({ success: false, message: 'Team member not found.' })
    }

    user.password = req.body.password
    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  deleteStaff,
  getProfileSettings,
  getStaff,
  updateProfileSettings,
  getInvoiceSettings,
  getSmsSettings,
  getWhatsAppSettings,
  getWhatsAppOnboardingStatus,
  getCourierSettings,
  inviteStaff,
  resetStaffPassword,
  testCourierSettings,
  updateInvoiceSettings,
  updateSmsSettings,
  updateStaff,
  updateCourierSettings,
  updateWhatsAppSettings,
}
