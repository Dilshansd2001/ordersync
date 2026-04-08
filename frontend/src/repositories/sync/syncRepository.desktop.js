export const createDesktopSyncRepository = () => ({
  async getDiagnostics() {
    const status = await window.ordersync.getSyncStatus()

    return {
      isDesktop: true,
      isRunning: Boolean(status?.isRunning),
      pendingCount: status?.diagnostics?.pendingCount ?? status?.pendingCount ?? 0,
      failedCount: status?.diagnostics?.failedCount ?? 0,
      conflictCount: status?.diagnostics?.conflictCount ?? 0,
      lastSyncTime: status?.lastSyncTime ?? null,
      lastError: status?.diagnostics?.lastError ?? status?.lastError ?? null,
      issues: status?.diagnostics?.issues ?? [],
    }
  },

  async refresh() {
    return this.getDiagnostics()
  },

  async triggerSync() {
    return window.ordersync.triggerSync()
  },

  async retryIssue(issue) {
    return window.ordersync.retrySyncIssue({
      queueId: issue?.queueId,
    })
  },

  async retrySafeItems() {
    return window.ordersync.retrySafeSyncItems()
  },
})
