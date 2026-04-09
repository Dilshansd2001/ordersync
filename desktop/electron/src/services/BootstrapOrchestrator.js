class BootstrapOrchestrator {
  constructor({
    authSessionService,
    tenantContextService,
    subscriptionService,
    desktopService,
    appVersion,
  }) {
    if (!authSessionService || !tenantContextService || !subscriptionService || !desktopService) {
      throw new Error('BootstrapOrchestrator requires auth, tenant, subscription, and desktop services.')
    }

    this.authSessionService = authSessionService
    this.tenantContextService = tenantContextService
    this.subscriptionService = subscriptionService
    this.desktopService = desktopService
    this.appVersion = appVersion || 'unknown'
    this.workspaceOpened = false
  }

  getSafeMetadata({ session, tenant, subscription, extra = {} } = {}) {
    return {
      appVersion: this.appVersion,
      businessName: tenant?.businessName || session?.business?.name || null,
      businessTagline: tenant?.businessTagline || session?.business?.tagline || '',
      planName: subscription?.currentPlan || session?.business?.subscriptionPlan || null,
      subscriptionStatus: subscription?.status || null,
      graceExpiresAt: subscription?.graceExpiresAt || null,
      userName: session?.user?.name || null,
      userEmail: session?.user?.email || null,
      userRole: session?.user?.role || null,
      allowedDevices: subscription?.allowedDevices ?? null,
      activeDevicesCount: subscription?.activeDevicesCount ?? null,
      ...extra,
    }
  }

  buildShellState(screen, options = {}) {
    return {
      screen,
      isAuthenticated: Boolean(options.isAuthenticated),
      isLoading: false,
      canOpenWorkspace: Boolean(options.canOpenWorkspace),
      accessMode: options.accessMode || null,
      message: options.message || null,
      reason: options.reason || null,
      metadata: options.metadata || {},
      tenants: options.tenants || [],
    }
  }

  async getBootstrapState() {
    const authStatus = await this.authSessionService.bootstrap()
    const session = this.authSessionService.getCurrentSession()

    if (!authStatus?.isAuthenticated || !session) {
      this.workspaceOpened = false
      this.desktopService.stopAutoSync()

      return this.buildShellState('login', {
        isAuthenticated: false,
        message: 'Sign in to continue to your desktop workspace.',
        reason: authStatus?.reason || 'needs_login',
        metadata: this.getSafeMetadata({ session: null }),
      })
    }

    const tenantResolution = await this.tenantContextService.resolveTenantSelection()

    if (tenantResolution.state === 'selection_required') {
      return this.buildShellState('tenant_selector', {
        isAuthenticated: true,
        message: 'Choose the business this device should open.',
        tenants: tenantResolution.tenants,
        metadata: this.getSafeMetadata({
          session,
          extra: {
            tenantCount: tenantResolution.tenants.length,
          },
        }),
      })
    }

    if (tenantResolution.state === 'missing_tenant') {
      return this.buildShellState('login', {
        isAuthenticated: false,
        reason: 'missing_tenant',
        message: 'No business workspace is linked to this account yet.',
        metadata: this.getSafeMetadata({ session }),
      })
    }

    const subscription = await this.subscriptionService.resolveAccess()
    const metadata = this.getSafeMetadata({
      session,
      tenant: tenantResolution.selectedTenant,
      subscription,
    })

    if (subscription.status === 'trial_expired') {
      this.workspaceOpened = false
      this.desktopService.stopAutoSync()

      return this.buildShellState('trial_expired', {
        isAuthenticated: true,
        accessMode: subscription.accessMode,
        reason: subscription.status,
        message: 'Your trial has ended. Upgrade to continue using this workspace.',
        metadata,
      })
    }

    if (subscription.status === 'inactive' || subscription.status === 'connection_required') {
      this.workspaceOpened = false
      this.desktopService.stopAutoSync()

      return this.buildShellState('subscription_inactive', {
        isAuthenticated: true,
        accessMode: subscription.accessMode,
        reason: subscription.status,
        message:
          subscription.status === 'connection_required'
            ? 'Reconnect to verify your subscription before opening the workspace.'
            : 'Your subscription needs attention before this workspace can open.',
        metadata,
      })
    }

    return this.buildShellState('workspace_ready', {
      isAuthenticated: true,
      canOpenWorkspace: true,
      accessMode: subscription.accessMode,
      message:
        subscription.accessMode === 'offline_grace'
          ? 'Opening with temporary offline access.'
          : 'Workspace ready.',
      metadata,
    })
  }

  async login(credentials) {
    try {
      await this.authSessionService.login(credentials)
      this.workspaceOpened = false
      return await this.getBootstrapState()
    } catch (error) {
      console.log('[auth] shell:login:error', {
        phase: error?.phase || 'post_login',
        message: error?.message || 'Unknown authentication error.',
        statusCode: error?.statusCode || null,
      })

      throw error
    }
  }

  async logout() {
    this.workspaceOpened = false
    this.desktopService.stopAutoSync()

    this.tenantContextService.clearSelection()
    await this.authSessionService.logout()

    return this.getBootstrapState()
  }

  async selectTenant(tenantId) {
    await this.tenantContextService.selectTenant(tenantId)
    this.workspaceOpened = false
    return this.getBootstrapState()
  }

  async enterWorkspace(existingState = null) {
    const state =
      existingState && existingState.canOpenWorkspace ? existingState : await this.getBootstrapState()

    if (!state.canOpenWorkspace) {
      return state
    }

    if (!this.workspaceOpened) {
      this.desktopService.startAutoSync()
      this.workspaceOpened = true
    }

    return this.buildShellState('workspace', {
      isAuthenticated: true,
      canOpenWorkspace: true,
      accessMode: state.accessMode,
      message: state.message,
      metadata: state.metadata,
    })
  }
}

module.exports = {
  BootstrapOrchestrator,
}
