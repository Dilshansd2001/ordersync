const { BaseRepository } = require('./BaseRepository')

class InventoryMovementsRepository extends BaseRepository {
  constructor(db) {
    super(db, 'inventory_movements')
  }

  insertMany(movements) {
    const statement = this.db.prepare(
      `INSERT INTO inventory_movements (
        entity_id, cloud_id, product_entity_id, order_entity_id, order_action_entity_id,
        movement_type, quantity_delta, reason, version, sync_status, updated_at,
        last_synced_at, deleted_at, created_at
      ) VALUES (
        @entity_id, @cloud_id, @product_entity_id, @order_entity_id, @order_action_entity_id,
        @movement_type, @quantity_delta, @reason, @version, @sync_status, @updated_at,
        @last_synced_at, @deleted_at, @created_at
      )`
    )

    for (const movement of movements) {
      statement.run(movement)
    }

    return movements
  }

  listByOrderEntityId(orderEntityId) {
    return this.db
      .prepare(
        `SELECT * FROM inventory_movements
         WHERE order_entity_id = ?
         ORDER BY id ASC`
      )
      .all(orderEntityId)
  }
}

module.exports = {
  InventoryMovementsRepository,
}
