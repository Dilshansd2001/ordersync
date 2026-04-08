const emptyDiagnostics = {
  isDesktop: false,
  isRunning: false,
  pendingCount: 0,
  failedCount: 0,
  conflictCount: 0,
  lastSyncTime: null,
  lastError: null,
  issues: [],
}

export const createHttpSyncRepository = () => ({
  async getDiagnostics() {
    return emptyDiagnostics
  },

  async refresh() {
    return emptyDiagnostics
  },

  async triggerSync() {
    return null
  },

  async retryIssue() {
    return null
  },

  async retrySafeItems() {
    return null
  },
})
