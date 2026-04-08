const DEFAULT_GRACE_PERIOD_MS = 5 * 24 * 60 * 60 * 1000

const PLAN_DEVICE_LIMITS = {
  FREE_TRIAL: 1,
  BASIC: 1,
  STARTER: 1,
  GROWTH: 3,
  PRO: 5,
  PREMIUM: 5,
  ENTERPRISE: 999,
}

class SubscriptionService {
  constructor({ authSessionService, isOnline = () => true, gracePeriodMs = DEFAULT_GRACE_PERIOD_MS }) {
    if (!authSessionService) {
      throw new Error('authSessionService is required for SubscriptionService.')
    }

    this.authSessionService = authSessionService
    this.isOnline = isOnline
    this.gracePeriodMs = gracePeriodMs
  }

  getBusinessSnapshot() {
    return this.authSessionService.getCurrentSession()?.business || null
  }

  normalizePlanName(business) {
    return business?.current_plan || business?.subscriptionPlan || 'Unknown'
  }

  resolveAllowedDevices(planName, business) {
    if (typeof business?.planCapabilities?.deviceLimit === 'number') {
      return business.planCapabilities.deviceLimit
    }

    if (business?.allowed_devices) {
      return business.allowed_devices
    }

    return PLAN_DEVICE_LIMITS[String(planName || '').toUpperCase()] || 1
  }

  resolveActiveDevicesCount(business, session) {
    if (typeof business?.planCapabilities?.activeDevicesCount === 'number') {
      return business.planCapabilities.activeDevicesCount
    }

    if (typeof business?.active_devices_count === 'number') {
      return business.active_devices_count
    }

    return session?.deviceId ? 1 : 0
  }

  deriveStatusFromBusiness(business) {
    if (!business) {
      return 'inactive'
    }

    if (business?.planCapabilities?.subscriptionStatus) {
      return business.planCapabilities.subscriptionStatus
    }

    if (business.subscription_status) {
      return business.subscription_status
    }

    if (business.isActive === false) {
      return 'inactive'
    }

    const now = Date.now()
    const trialEndDate = business.trial_end_date ? new Date(business.trial_end_date).getTime() : null
    const planExpiryDate = business.planExpiryDate ? new Date(business.planExpiryDate).getTime() : null
    const planName = this.normalizePlanName(business)
    const isTrialPlan = /trial/i.test(String(planName))

    if (trialEndDate && trialEndDate < now) {
      return 'expired_trial'
    }

    if (isTrialPlan && planExpiryDate && planExpiryDate < now) {
      return 'expired_trial'
    }

    if (planExpiryDate && planExpiryDate < now) {
      return 'inactive'
    }

    return 'valid'
  }

  buildCachePayload({ status, planName }) {
    const lastValidatedAt = new Date().toISOString()
    const graceExpiresAt =
      status === 'valid' ? new Date(Date.now() + this.gracePeriodMs).toISOString() : null

    return {
      last_validated_at: lastValidatedAt,
      last_known_subscription_status: status,
      last_known_plan: planName,
      grace_expires_at: graceExpiresAt,
    }
  }

  buildResult({ status, planName, allowedDevices, activeDevicesCount, source, graceExpiresAt = null }) {
    const safeStatus = status === 'expired_trial' ? 'trial_expired' : status
    const accessMode =
      safeStatus === 'valid'
        ? source === 'offline_cache'
          ? 'offline_grace'
          : 'valid'
        : 'blocked'

    return {
      status: safeStatus,
      accessMode,
      source,
      currentPlan: planName,
      allowedDevices,
      activeDevicesCount,
      graceExpiresAt,
      isBlocked: accessMode === 'blocked',
    }
  }

  async resolveAccess() {
    const session = this.authSessionService.getCurrentSession()
    const business = this.getBusinessSnapshot()
    const planName = this.normalizePlanName(business)
    const allowedDevices = this.resolveAllowedDevices(planName, business)
    const activeDevicesCount = this.resolveActiveDevicesCount(business, session)

    if (this.isOnline()) {
      const status = this.deriveStatusFromBusiness(business)
      const cachePayload = this.buildCachePayload({ status, planName })

      this.authSessionService.updateSession({
        subscriptionCache: cachePayload,
      })

      return this.buildResult({
        status,
        planName,
        allowedDevices,
        activeDevicesCount,
        source: 'online',
        graceExpiresAt: cachePayload.grace_expires_at,
      })
    }

    const cached = session?.subscriptionCache || null
    if (
      cached?.last_known_subscription_status === 'valid' &&
      cached?.grace_expires_at &&
      new Date(cached.grace_expires_at).getTime() > Date.now()
    ) {
      return this.buildResult({
        status: 'valid',
        planName: cached.last_known_plan || planName,
        allowedDevices,
        activeDevicesCount,
        source: 'offline_cache',
        graceExpiresAt: cached.grace_expires_at,
      })
    }

    const blockedStatus = cached?.last_known_subscription_status || 'connection_required'

    return this.buildResult({
      status: blockedStatus,
      planName: cached?.last_known_plan || planName,
      allowedDevices,
      activeDevicesCount,
      source: 'offline_cache',
      graceExpiresAt: cached?.grace_expires_at || null,
    })
  }
}

module.exports = {
  SubscriptionService,
}
