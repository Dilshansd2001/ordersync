const { createRepositories } = require('../repositories')
const { TenantSyncLock } = require('./TenantSyncLock')
const { pushPendingChanges } = require('./pushPendingChanges')
const { pullAndApplyChanges } = require('./pullAndApplyChanges')

class SyncManager {
  constructor({
    databaseManager,
    apiClient,
    deviceIdProvider,
    lock = new TenantSyncLock(),
    pushBatchSize = 25,
    pullPageSize = 100,
  }) {
    this.databaseManager = databaseManager
    this.apiClient = apiClient
    this.deviceIdProvider = deviceIdProvider
    this.lock = lock
    this.pushBatchSize = pushBatchSize
    this.pullPageSize = pullPageSize
  }

  isSyncRunning(tenantId) {
    return this.lock.isLocked(tenantId)
  }

  async syncTenant(tenantId) {
    return this.lock.runExclusive(tenantId, async () => {
      const db = this.databaseManager.getConnection(tenantId)
      const repositories = createRepositories(db)
      repositories.db = db

      const deviceId =
        typeof this.deviceIdProvider === 'function'
          ? await this.deviceIdProvider(tenantId)
          : this.deviceIdProvider

      if (!deviceId) {
        throw new Error('deviceId is required to run tenant sync.')
      }

      const pushResult = await pushPendingChanges({
        db,
        repositories,
        apiClient: this.apiClient,
        tenantId,
        deviceId,
        batchSize: this.pushBatchSize,
      })

      const pullResult = await pullAndApplyChanges({
        db,
        apiClient: this.apiClient,
        tenantId,
        pageSize: this.pullPageSize,
      })

      return {
        skipped: false,
        tenantId,
        push: pushResult,
        pull: pullResult,
      }
    })
  }
}

module.exports = {
  SyncManager,
}
