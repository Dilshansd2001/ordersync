const { EventEmitter } = require('node:events')

class AuthSessionService extends EventEmitter {
  constructor({
    apiBaseUrl,
    secureStore,
    isOnline = () => true,
    fetchImpl = global.fetch,
    validationTtlMs = 15 * 60 * 1000,
  }) {
    super()

    if (!apiBaseUrl) {
      throw new Error('apiBaseUrl is required for AuthSessionService.')
    }

    if (!secureStore) {
      throw new Error('secureStore is required for AuthSessionService.')
    }

    this.apiBaseUrl = apiBaseUrl.replace(/\/+$/, '')
    this.secureStore = secureStore
    this.isOnline = isOnline
    this.fetchImpl = fetchImpl
    this.validationTtlMs = validationTtlMs
    this.currentSession = null
    this.status = this.buildUnauthenticatedStatus('first_run')
  }

  logDebug(step, details = {}) {
    console.log(`[auth] ${step}`, details)
  }

  async parseErrorResponse(response) {
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const payload = await response.json().catch(() => null)
      const message = payload?.message || payload?.error || null

      return {
        message,
        payload,
        raw: payload ? JSON.stringify(payload) : null,
      }
    }

    const text = await response.text().catch(() => '')

    return {
      message: text || null,
      payload: null,
      raw: text || null,
    }
  }

  buildUnauthenticatedStatus(reason = 'signed_out') {
    return {
      mode: 'unauthenticated',
      isAuthenticated: false,
      canOfflineReenter: false,
      tenantId: null,
      user: null,
      business: null,
      deviceRegistered: false,
      lastValidatedAt: null,
      reason,
      error: null,
    }
  }

  buildAuthenticatedStatus(session, mode = 'authenticated_online', reason = null) {
    return {
      mode,
      isAuthenticated: true,
      canOfflineReenter: true,
      tenantId: session.tenantId,
      user: session.user,
      business: session.business,
      deviceRegistered: Boolean(session.deviceId),
      lastValidatedAt: session.lastValidatedAt || null,
      reason,
      error: null,
    }
  }

  emitStatus() {
    this.emit('auth-status', this.status)
    return this.status
  }

  getSessionStatus() {
    return this.status
  }

  getCurrentSession() {
    return this.currentSession
  }

  updateSession(patch = {}) {
    if (!this.currentSession) {
      throw new Error('No authenticated session is available.')
    }

    this.currentSession = {
      ...this.currentSession,
      ...patch,
    }

    this.secureStore.saveSession(this.currentSession)
    return this.currentSession
  }

  async bootstrap() {
    const persisted = this.secureStore.loadSession()

    if (!persisted?.token || !persisted?.tenantId) {
      this.currentSession = null
      this.status = this.buildUnauthenticatedStatus('first_run')
      return this.emitStatus()
    }

    this.currentSession = persisted

    if (!this.isOnline()) {
      this.status = this.buildAuthenticatedStatus(persisted, 'authenticated_offline', 'offline_reentry')
      return this.emitStatus()
    }

    return this.revalidateSession({ bootstrap: true })
  }

  async login({ email, password }) {
    if (!this.isOnline()) {
      throw new Error('Initial desktop login requires an internet connection.')
    }

    const endpoint = `${this.apiBaseUrl}/auth/login`
    const payloadShape = {
      email,
      passwordProvided: typeof password === 'string' && password.length > 0,
      passwordLength: typeof password === 'string' ? password.length : 0,
    }

    this.logDebug('login:request', {
      endpoint,
      payloadShape,
    })

    const response = await this.fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    }).catch((error) => {
      this.logDebug('login:request:network-error', {
        endpoint,
        message: error?.message || 'Unknown network error.',
      })
      error.phase = 'login'
      throw error
    })

    if (!response.ok) {
      const errorResponse = await this.parseErrorResponse(response)
      const backendMessage = errorResponse.message || 'Login failed.'

      this.logDebug('login:response:error', {
        endpoint,
        status: response.status,
        backendMessage,
        responseBody: errorResponse.payload || errorResponse.raw,
      })

      const error = new Error(backendMessage)
      error.statusCode = response.status
      error.body = errorResponse.raw
      error.backendMessage = backendMessage
      error.endpoint = endpoint
      error.phase = 'login'
      throw error
    }

    const payload = await response.json()

    this.logDebug('login:response:success', {
      endpoint,
      status: response.status,
      hasToken: Boolean(payload?.token),
      userId: payload?.user?.id || null,
      businessId: payload?.user?.businessId || payload?.business?.id || null,
      role: payload?.user?.role || null,
    })

    const deviceIdentity = this.secureStore.provisionDeviceIdentity(this.secureStore.loadSession())
    const tenantId = payload.user?.businessId || payload.business?.id || null

    if (!tenantId) {
      this.logDebug('login:response:missing-tenant', {
        endpoint,
        hasUser: Boolean(payload?.user),
        hasBusiness: Boolean(payload?.business),
        availableKeys: Object.keys(payload || {}),
      })
      throw new Error('Login response did not include tenant context.')
    }

    this.currentSession = {
      token: payload.token,
      tenantId,
      selectedTenantId: tenantId,
      availableTenants: payload.tenants || null,
      user: payload.user,
      business: payload.business,
      deviceId: deviceIdentity.deviceId,
      deviceRegisteredAt: deviceIdentity.deviceRegisteredAt,
      loggedInAt: new Date().toISOString(),
      lastValidatedAt: new Date().toISOString(),
    }

    this.secureStore.saveSession(this.currentSession)
    this.status = this.buildAuthenticatedStatus(this.currentSession, 'authenticated_online', 'login_success')
    return this.emitStatus()
  }

  async logout() {
    this.currentSession = null
    this.secureStore.clearSession()
    this.status = this.buildUnauthenticatedStatus('signed_out')
    return this.emitStatus()
  }

  async revalidateSession({ bootstrap = false } = {}) {
    if (!this.currentSession?.token) {
      this.status = this.buildUnauthenticatedStatus('missing_session')
      return this.emitStatus()
    }

    if (!this.isOnline()) {
      this.status = this.buildAuthenticatedStatus(
        this.currentSession,
        'authenticated_offline',
        bootstrap ? 'offline_bootstrap' : 'offline_reentry'
      )
      return this.emitStatus()
    }

    const endpoint = `${this.apiBaseUrl}/tenant/context`

    this.logDebug('session:revalidate:request', {
      endpoint,
      bootstrap,
      hasToken: Boolean(this.currentSession?.token),
      tenantId: this.currentSession?.tenantId || null,
    })

    const response = await this.fetchImpl(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.currentSession.token}`,
        'x-device-id': this.currentSession.deviceId || '',
      },
    }).catch((error) => {
      error.isNetworkError = true
      throw error
    })

    if (response.ok) {
      const payload = await response.json().catch(() => null)

      this.logDebug('session:revalidate:success', {
        endpoint,
        status: response.status,
        bootstrap,
      })

      if (payload?.tenant) {
        this.currentSession.business = {
          ...(this.currentSession.business || {}),
          ...(payload.tenant || {}),
          id: payload.tenant.businessId || this.currentSession.business?.id || this.currentSession.tenantId,
        }
      }

      this.currentSession.lastValidatedAt = new Date().toISOString()
      this.secureStore.saveSession(this.currentSession)
      this.status = this.buildAuthenticatedStatus(
        this.currentSession,
        'authenticated_online',
        bootstrap ? 'bootstrap_validated' : 'session_valid'
      )
      return this.emitStatus()
    }

    const errorResponse = await this.parseErrorResponse(response)

    this.logDebug('session:revalidate:error', {
      endpoint,
      status: response.status,
      bootstrap,
      backendMessage: errorResponse.message || null,
      responseBody: errorResponse.payload || errorResponse.raw,
    })

    if ([401, 403].includes(response.status)) {
      const reason = response.status === 401 ? 'token_expired' : 'session_revoked'
      this.currentSession = null
      this.secureStore.clearSession()
      this.status = this.buildUnauthenticatedStatus(reason)
      return this.emitStatus()
    }

    if (bootstrap) {
      this.status = this.buildAuthenticatedStatus(this.currentSession, 'authenticated_offline', 'validation_unavailable')
      return this.emitStatus()
    }

    return this.getSessionStatus()
  }

  async resolveTenantContext() {
    await this.ensureValidSession()

    if (!this.currentSession?.tenantId || !this.currentSession?.deviceId) {
      throw new Error('No authenticated tenant session is available.')
    }

    return {
      tenantId: this.currentSession.tenantId,
      deviceId: this.currentSession.deviceId,
      user: this.currentSession.user,
      business: this.currentSession.business,
    }
  }

  async getAuthHeaders() {
    await this.ensureValidSession()

    if (!this.currentSession?.token) {
      throw new Error('No authenticated session token is available.')
    }

    return {
      Authorization: `Bearer ${this.currentSession.token}`,
    }
  }

  async ensureValidSession() {
    if (!this.currentSession?.token) {
      throw new Error('No authenticated session is available.')
    }

    if (!this.isOnline()) {
      return this.currentSession
    }

    const lastValidatedAt = this.currentSession.lastValidatedAt
      ? new Date(this.currentSession.lastValidatedAt).getTime()
      : 0

    if (Date.now() - lastValidatedAt < this.validationTtlMs) {
      return this.currentSession
    }

    const status = await this.revalidateSession()
    if (!status.isAuthenticated) {
      throw new Error('Session is no longer valid.')
    }

    return this.currentSession
  }
}

module.exports = {
  AuthSessionService,
}
