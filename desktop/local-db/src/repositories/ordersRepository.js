const { BaseRepository } = require('./BaseRepository')
const { nowIso } = require('../utils/time')

class OrdersRepository extends BaseRepository {
  constructor(db) {
    super(db, 'orders')
  }

  list(filters = {}) {
    const clauses = ['deleted_at IS NULL']
    const params = []
    const search = filters.search ? `%${String(filters.search).trim().toLowerCase()}%` : null

    if (filters.status && filters.status !== 'ALL') {
      clauses.push('status = ?')
      params.push(filters.status)
    }

    if (filters.customerPhone) {
      clauses.push('customer_phone = ?')
      params.push(filters.customerPhone)
    }

    if (search) {
      clauses.push(
        '(LOWER(order_number) LIKE ? OR LOWER(customer_name) LIKE ? OR LOWER(customer_phone) LIKE ?)'
      )
      params.push(search, search, search)
    }

    const whereClause = clauses.join(' AND ')

    return this.db
      .prepare(
        `SELECT *
         FROM orders
         WHERE ${whereClause}
         ORDER BY created_at DESC`
      )
      .all(...params)
      .map((order) => this.getOrderWithItems(order.entity_id))
  }

  insert(order) {
    this.db
      .prepare(
        `INSERT INTO orders (
          entity_id, cloud_id, order_number, customer_entity_id, replacement_for_order_entity_id,
          status, payment_method, customer_name, customer_phone, customer_address, district,
          delivery_service, tracking_number, courier_shipment_id, courier_sync_status,
          courier_sync_error, courier_last_synced_at, label_url, notes, subtotal_amount,
          delivery_fee, total_amount, cod_amount, is_replacement_order, version, sync_status,
          updated_at, last_synced_at, deleted_at, created_at
        ) VALUES (
          @entity_id, @cloud_id, @order_number, @customer_entity_id, @replacement_for_order_entity_id,
          @status, @payment_method, @customer_name, @customer_phone, @customer_address, @district,
          @delivery_service, @tracking_number, @courier_shipment_id, @courier_sync_status,
          @courier_sync_error, @courier_last_synced_at, @label_url, @notes, @subtotal_amount,
          @delivery_fee, @total_amount, @cod_amount, @is_replacement_order, @version,
          @sync_status, @updated_at, @last_synced_at, @deleted_at, @created_at
        )`
      )
      .run(order)

    return this.getByEntityId(order.entity_id)
  }

  updateStatus({ entityId, status, trackingNumber = null, notes = null }) {
    const updatedAt = nowIso()
    this.db
      .prepare(
        `UPDATE orders
         SET status = @status,
             tracking_number = COALESCE(@tracking_number, tracking_number),
             notes = COALESCE(@notes, notes),
             version = version + 1,
             sync_status = 'pending_sync',
             updated_at = @updated_at
         WHERE entity_id = @entity_id`
      )
      .run({
        entity_id: entityId,
        status,
        tracking_number: trackingNumber,
        notes,
        updated_at: updatedAt,
      })

    return this.getByEntityId(entityId)
  }

  applyCourierUpdate({
    entityId,
    status = null,
    trackingNumber = null,
    courierShipmentId = null,
    courierSyncStatus = null,
    courierSyncError = null,
    courierLastSyncedAt = null,
    labelUrl = null,
    deliveryService = null,
  }) {
    const updatedAt = nowIso()

    this.db
      .prepare(
        `UPDATE orders
         SET status = COALESCE(@status, status),
             tracking_number = COALESCE(@tracking_number, tracking_number),
             courier_shipment_id = COALESCE(@courier_shipment_id, courier_shipment_id),
             courier_sync_status = COALESCE(@courier_sync_status, courier_sync_status),
             courier_sync_error = COALESCE(@courier_sync_error, courier_sync_error),
             courier_last_synced_at = COALESCE(@courier_last_synced_at, courier_last_synced_at),
             label_url = COALESCE(@label_url, label_url),
             delivery_service = COALESCE(@delivery_service, delivery_service),
             sync_status = 'synced',
             updated_at = @updated_at,
             last_synced_at = COALESCE(@courier_last_synced_at, last_synced_at)
         WHERE entity_id = @entity_id`
      )
      .run({
        entity_id: entityId,
        status,
        tracking_number: trackingNumber,
        courier_shipment_id: courierShipmentId,
        courier_sync_status: courierSyncStatus,
        courier_sync_error: courierSyncError,
        courier_last_synced_at: courierLastSyncedAt,
        label_url: labelUrl,
        delivery_service: deliveryService,
        updated_at: updatedAt,
      })

    return this.getOrderWithItems(entityId)
  }

  getOrderWithItems(orderEntityId) {
    const order = this.getByEntityId(orderEntityId)

    if (!order) {
      return null
    }

    const items = this.db
      .prepare(
        `SELECT * FROM order_items
         WHERE order_entity_id = ?
           AND deleted_at IS NULL
         ORDER BY id ASC`
      )
      .all(orderEntityId)

    return {
      ...order,
      items,
    }
  }

  getOrderAggregate(orderEntityId) {
    const order = this.getOrderWithItems(orderEntityId)

    if (!order) {
      return null
    }

    const actions = this.db
      .prepare(
        `SELECT * FROM order_actions
         WHERE order_entity_id = ?
           AND deleted_at IS NULL
         ORDER BY created_at ASC`
      )
      .all(orderEntityId)

    const inventoryMovements = this.db
      .prepare(
        `SELECT * FROM inventory_movements
         WHERE order_entity_id = ?
           AND deleted_at IS NULL
         ORDER BY created_at ASC`
      )
      .all(orderEntityId)

    return {
      ...order,
      actions,
      inventory_movements: inventoryMovements,
    }
  }

  getLatestOrderNumber() {
    const row = this.db
      .prepare(
        `SELECT order_number
         FROM orders
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC, id DESC
         LIMIT 1`
      )
      .get()

    return row?.order_number || null
  }
}

module.exports = {
  OrdersRepository,
}
