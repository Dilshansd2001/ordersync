const { BaseRepository } = require('./BaseRepository')

class OrderItemsRepository extends BaseRepository {
  constructor(db) {
    super(db, 'order_items')
  }

  insertMany(items) {
    const statement = this.db.prepare(
      `INSERT INTO order_items (
        entity_id, order_entity_id, product_entity_id, description, qty, unit_price,
        line_total, version, sync_status, updated_at, last_synced_at, deleted_at, created_at
      ) VALUES (
        @entity_id, @order_entity_id, @product_entity_id, @description, @qty, @unit_price,
        @line_total, @version, @sync_status, @updated_at, @last_synced_at, @deleted_at, @created_at
      )`
    )

    for (const item of items) {
      statement.run(item)
    }

    return this.listByOrderEntityId(items[0]?.order_entity_id)
  }

  listByOrderEntityId(orderEntityId) {
    return this.db
      .prepare(
        `SELECT * FROM order_items
         WHERE order_entity_id = ?
         ORDER BY id ASC`
      )
      .all(orderEntityId)
  }
}

module.exports = {
  OrderItemsRepository,
}
