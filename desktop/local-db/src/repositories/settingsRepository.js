const { BaseRepository } = require('./BaseRepository')
const { nowIso } = require('../utils/time')

class SettingsRepository extends BaseRepository {
  constructor(db) {
    super(db, 'settings')
  }

  upsert(setting) {
    const updatedAt = nowIso()
    this.db
      .prepare(
        `INSERT INTO settings (
          entity_id, cloud_id, setting_key, setting_value, value_type,
          version, sync_status, updated_at, last_synced_at, deleted_at, created_at
        ) VALUES (
          @entity_id, @cloud_id, @setting_key, @setting_value, @value_type,
          @version, @sync_status, @updated_at, @last_synced_at, @deleted_at, @created_at
        )
        ON CONFLICT(setting_key) DO UPDATE SET
          setting_value = excluded.setting_value,
          value_type = excluded.value_type,
          version = settings.version + 1,
          sync_status = 'pending_sync',
          updated_at = excluded.updated_at`
      )
      .run({
        ...setting,
        updated_at: updatedAt,
      })

    return this.db
      .prepare('SELECT * FROM settings WHERE setting_key = ? LIMIT 1')
      .get(setting.setting_key)
  }
}

module.exports = {
  SettingsRepository,
}
