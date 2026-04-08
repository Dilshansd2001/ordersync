const { nowIso } = require('../utils/time')

class BaseRepository {
  constructor(db, tableName) {
    this.db = db
    this.tableName = tableName
  }

  getByEntityId(entityId) {
    return this.db
      .prepare(`SELECT * FROM ${this.tableName} WHERE entity_id = ? LIMIT 1`)
      .get(entityId)
  }

  listPendingSync(limit = 100) {
    return this.db
      .prepare(
        `SELECT * FROM ${this.tableName}
         WHERE deleted_at IS NULL
           AND sync_status IN ('local_only', 'pending_sync', 'sync_failed', 'conflict')
         ORDER BY updated_at ASC
         LIMIT ?`
      )
      .all(limit)
  }

  markSyncStatus(entityId, syncStatus, lastSyncedAt = null) {
    const updatedAt = nowIso()
    this.db
      .prepare(
        `UPDATE ${this.tableName}
         SET sync_status = ?,
             last_synced_at = COALESCE(?, last_synced_at),
             updated_at = ?
         WHERE entity_id = ?`
      )
      .run(syncStatus, lastSyncedAt, updatedAt, entityId)
  }

  softDelete(entityId) {
    const timestamp = nowIso()
    this.db
      .prepare(
        `UPDATE ${this.tableName}
         SET deleted_at = ?,
             sync_status = 'pending_sync',
             version = version + 1,
             updated_at = ?
         WHERE entity_id = ?`
      )
      .run(timestamp, timestamp, entityId)
  }
}

module.exports = {
  BaseRepository,
}
