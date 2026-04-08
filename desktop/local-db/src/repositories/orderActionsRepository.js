const { BaseRepository } = require('./BaseRepository')

class OrderActionsRepository extends BaseRepository {
  constructor(db) {
    super(db, 'order_actions')
  }

  insert(action) {
    this.db
      .prepare(
        `INSERT INTO order_actions (
          entity_id, cloud_id, order_entity_id, action_type, reason, replacement_order_entity_id,
          affects_inventory, version, sync_status, updated_at, last_synced_at, deleted_at, created_at
        ) VALUES (
          @entity_id, @cloud_id, @order_entity_id, @action_type, @reason, @replacement_order_entity_id,
          @affects_inventory, @version, @sync_status, @updated_at, @last_synced_at, @deleted_at, @created_at
        )`
      )
      .run(action)

    return this.getByEntityId(action.entity_id)
  }
}

module.exports = {
  OrderActionsRepository,
}
