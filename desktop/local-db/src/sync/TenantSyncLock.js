class TenantSyncLock {
  constructor() {
    this.activeTenants = new Set()
  }

  isLocked(tenantId) {
    return this.activeTenants.has(tenantId)
  }

  async runExclusive(tenantId, work) {
    if (this.isLocked(tenantId)) {
      return {
        skipped: true,
        reason: 'sync_already_running',
      }
    }

    this.activeTenants.add(tenantId)

    try {
      return await work()
    } finally {
      this.activeTenants.delete(tenantId)
    }
  }
}

module.exports = {
  TenantSyncLock,
}
