class TenantContextService {
  constructor({ authSessionService }) {
    if (!authSessionService) {
      throw new Error('authSessionService is required for TenantContextService.')
    }

    this.authSessionService = authSessionService
  }

  normalizeTenant(rawTenant, fallbackBusiness = null) {
    const tenantId =
      rawTenant?.tenantId ||
      rawTenant?.businessId ||
      rawTenant?.id ||
      rawTenant?._id ||
      fallbackBusiness?.id ||
      fallbackBusiness?._id ||
      null

    if (!tenantId) {
      return null
    }

    return {
      tenantId,
      businessId: tenantId,
      businessName: rawTenant?.businessName || rawTenant?.name || fallbackBusiness?.name || 'OrderSync workspace',
      businessTagline: rawTenant?.tagline || fallbackBusiness?.tagline || '',
      planName:
        rawTenant?.current_plan ||
        rawTenant?.subscriptionPlan ||
        fallbackBusiness?.current_plan ||
        fallbackBusiness?.subscriptionPlan ||
        'Unknown',
      business: {
        ...(fallbackBusiness || {}),
        ...(rawTenant || {}),
        id: tenantId,
      },
    }
  }

  listTenants() {
    const session = this.authSessionService.getCurrentSession()

    if (!session) {
      return []
    }

    const rawTenants = Array.isArray(session.availableTenants) ? session.availableTenants : []
    const normalizedTenants = rawTenants
      .map((tenant) => this.normalizeTenant(tenant, session.business))
      .filter(Boolean)

    if (normalizedTenants.length > 0) {
      return normalizedTenants
    }

    const fallbackTenant = this.normalizeTenant(session.business, session.business)
    return fallbackTenant ? [fallbackTenant] : []
  }

  getSelectedTenantId() {
    return this.authSessionService.getCurrentSession()?.selectedTenantId || null
  }

  async selectTenant(tenantId) {
    const tenants = this.listTenants()
    const selectedTenant = tenants.find((tenant) => tenant.tenantId === tenantId)

    if (!selectedTenant) {
      throw new Error('The selected workspace could not be found.')
    }

    this.authSessionService.updateSession({
      tenantId: selectedTenant.tenantId,
      selectedTenantId: selectedTenant.tenantId,
      business: selectedTenant.business,
    })

    return selectedTenant
  }

  clearSelection() {
    const session = this.authSessionService.getCurrentSession()

    if (!session) {
      return null
    }

    return this.authSessionService.updateSession({
      tenantId: null,
      selectedTenantId: null,
      business: null,
    })
  }

  async resolveTenantSelection() {
    const tenants = this.listTenants()

    if (tenants.length === 0) {
      return {
        state: 'missing_tenant',
        tenants: [],
        selectedTenant: null,
      }
    }

    if (tenants.length === 1) {
      const selectedTenant = await this.selectTenant(tenants[0].tenantId)
      return {
        state: 'selected',
        tenants,
        selectedTenant,
      }
    }

    const selectedTenantId = this.getSelectedTenantId()
    const selectedTenant = tenants.find((tenant) => tenant.tenantId === selectedTenantId)

    if (!selectedTenant) {
      return {
        state: 'selection_required',
        tenants,
        selectedTenant: null,
      }
    }

    return {
      state: 'selected',
      tenants,
      selectedTenant,
    }
  }
}

module.exports = {
  TenantContextService,
}
