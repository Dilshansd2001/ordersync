const { createRepositories } = require('../repositories')
const { newId } = require('../utils/ids')
const { nowIso } = require('../utils/time')
const { buildQueueItem } = require('./serviceUtils')

const normalizeOrderTotals = (items, deliveryFee = 0, explicitTotal = null) => {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.qty || 0) * Number(item.unit_price || 0),
    0
  )

  return {
    subtotal,
    total: explicitTotal != null ? Number(explicitTotal) : subtotal + Number(deliveryFee || 0),
  }
}

const generateNextOrderNumber = (latestOrderNumber) => {
  const latestSequence = latestOrderNumber
    ? Number(String(latestOrderNumber).replace('ORD-', '')) || 1000
    : 1000

  return `ORD-${latestSequence + 1}`
}

class OrderService {
  constructor(db) {
    this.db = db
    this.repositories = createRepositories(db)
  }

  list(filters = {}) {
    return this.repositories.orders.list(filters)
  }

  getById(orderEntityId) {
    return this.repositories.orders.getOrderAggregate(orderEntityId)
  }

  createOrder(input) {
    const { orders, orderItems, inventoryMovements, syncQueue } = this.repositories

    const execute = this.db.transaction((payload) => {
      const timestamp = nowIso()
      const orderEntityId = payload.entity_id || newId()

      const items = (payload.items || []).map((item) => ({
        entity_id: item.entity_id || newId(),
        order_entity_id: orderEntityId,
        product_entity_id: item.product_entity_id || null,
        description: item.description,
        qty: Number(item.qty || 0),
        unit_price: Number(item.unit_price || 0),
        line_total: Number(item.qty || 0) * Number(item.unit_price || 0),
        version: 1,
        sync_status: 'pending_sync',
        updated_at: timestamp,
        last_synced_at: null,
        deleted_at: null,
        created_at: timestamp,
      }))

      const totals = normalizeOrderTotals(items, payload.delivery_fee, payload.total_amount)

      const order = {
        entity_id: orderEntityId,
        cloud_id: null,
        order_number: payload.order_number || generateNextOrderNumber(orders.getLatestOrderNumber()),
        customer_entity_id: payload.customer_entity_id || null,
        replacement_for_order_entity_id: null,
        status: 'PENDING',
        payment_method: payload.payment_method || 'COD',
        customer_name: payload.customer_name || null,
        customer_phone: payload.customer_phone || null,
        customer_address: payload.customer_address || null,
        district: payload.district || null,
        delivery_service: payload.delivery_service || null,
        tracking_number: null,
        courier_shipment_id: null,
        courier_sync_status: 'PENDING',
        courier_sync_error: null,
        courier_last_synced_at: null,
        label_url: null,
        notes: payload.notes || null,
        subtotal_amount: totals.subtotal,
        delivery_fee: Number(payload.delivery_fee || 0),
        total_amount: totals.total,
        cod_amount: Number(payload.cod_amount || 0),
        is_replacement_order: 0,
        version: 1,
        sync_status: 'pending_sync',
        updated_at: timestamp,
        last_synced_at: null,
        deleted_at: null,
        created_at: timestamp,
      }

      orders.insert(order)

      if (items.length) {
        orderItems.insertMany(items)
      }

      const movements = items
        .filter((item) => item.product_entity_id && item.qty > 0)
        .map((item) => ({
          entity_id: newId(),
          cloud_id: null,
          product_entity_id: item.product_entity_id,
          order_entity_id: order.entity_id,
          order_action_entity_id: null,
          movement_type: 'sale_commit',
          quantity_delta: Number(item.qty) * -1,
          reason: `Order ${order.order_number} sale`,
          version: 1,
          sync_status: 'pending_sync',
          updated_at: timestamp,
          last_synced_at: null,
          deleted_at: null,
          created_at: timestamp,
        }))

      if (movements.length) {
        inventoryMovements.insertMany(movements)
      }

      const queueItems = [
        buildQueueItem({
          entityType: 'order',
          entityId: order.entity_id,
          operation: 'create',
          payload: order,
        }),
        ...items.map((item) =>
          buildQueueItem({
            entityType: 'order_item',
            entityId: item.entity_id,
            operation: 'create',
            payload: item,
          })
        ),
        ...movements.map((movement) =>
          buildQueueItem({
            entityType: 'inventory_movement',
            entityId: movement.entity_id,
            operation: 'create',
            payload: movement,
          })
        ),
      ]

      syncQueue.enqueueMany(queueItems)

      return orders.getOrderWithItems(order.entity_id)
    })

    return execute(input)
  }

  createOrders(inputs = []) {
    return inputs.map((input) => this.createOrder(input))
  }

  updateStatus({ orderEntityId, status, trackingNumber = null }) {
    const { orders, syncQueue } = this.repositories

    return this.db.transaction((payload) => {
      const existingOrder = orders.getOrderWithItems(payload.orderEntityId)

      if (!existingOrder || existingOrder.deleted_at) {
        throw new Error('Order not found.')
      }

      const updatedOrder = orders.updateStatus({
        entityId: payload.orderEntityId,
        status: payload.status || existingOrder.status,
        trackingNumber: payload.trackingNumber,
        notes: existingOrder.notes,
      })

      syncQueue.enqueue(
        buildQueueItem({
          entityType: 'order',
          entityId: updatedOrder.entity_id,
          operation: 'update',
          payload: updatedOrder,
        })
      )

      return orders.getOrderWithItems(updatedOrder.entity_id)
    })({ orderEntityId, status, trackingNumber })
  }

  cancelOrder({ orderEntityId, reason }) {
    const { orders, orderActions, inventoryMovements, syncQueue } = this.repositories

    const execute = this.db.transaction((payload) => {
      const existingOrder = orders.getOrderWithItems(payload.orderEntityId)

      if (!existingOrder) {
        throw new Error('Order not found.')
      }

      if (existingOrder.status === 'CANCELLED') {
        throw new Error('Order is already cancelled.')
      }

      const timestamp = nowIso()
      const action = {
        entity_id: newId(),
        cloud_id: null,
        order_entity_id: existingOrder.entity_id,
        action_type: 'CANCEL_ORDER',
        reason: payload.reason || 'Order cancelled locally',
        replacement_order_entity_id: null,
        affects_inventory: 1,
        version: 1,
        sync_status: 'pending_sync',
        updated_at: timestamp,
        last_synced_at: null,
        deleted_at: null,
        created_at: timestamp,
      }

      orderActions.insert(action)

      const updatedOrder = orders.updateStatus({
        entityId: existingOrder.entity_id,
        status: 'CANCELLED',
        notes: payload.reason || existingOrder.notes,
      })

      const restockMovements = existingOrder.items
        .filter((item) => item.product_entity_id && Number(item.qty) > 0)
        .map((item) => ({
          entity_id: newId(),
          cloud_id: null,
          product_entity_id: item.product_entity_id,
          order_entity_id: existingOrder.entity_id,
          order_action_entity_id: action.entity_id,
          movement_type: 'cancel_restock',
          quantity_delta: Number(item.qty),
          reason: `Cancellation for order ${existingOrder.order_number}`,
          version: 1,
          sync_status: 'pending_sync',
          updated_at: timestamp,
          last_synced_at: null,
          deleted_at: null,
          created_at: timestamp,
        }))

      if (restockMovements.length) {
        inventoryMovements.insertMany(restockMovements)
      }

      syncQueue.enqueueMany([
        buildQueueItem({
          entityType: 'order_action',
          entityId: action.entity_id,
          operation: 'create',
          payload: action,
        }),
        buildQueueItem({
          entityType: 'order',
          entityId: updatedOrder.entity_id,
          operation: 'update',
          payload: updatedOrder,
        }),
        ...restockMovements.map((movement) =>
          buildQueueItem({
            entityType: 'inventory_movement',
            entityId: movement.entity_id,
            operation: 'create',
            payload: movement,
          })
        ),
      ])

      return {
        order: updatedOrder,
        action,
      }
    })

    return execute({ orderEntityId, reason })
  }

  correctOrder({ originalOrderEntityId, reason, replacementOrder }) {
    const { orders, orderItems, orderActions, inventoryMovements, syncQueue } = this.repositories

    const execute = this.db.transaction((payload) => {
      const existingOrder = orders.getOrderWithItems(payload.originalOrderEntityId)

      if (!existingOrder) {
        throw new Error('Original order not found.')
      }

      const timestamp = nowIso()
      const replacementEntityId = payload.replacementOrder.entity_id || newId()
      const correctionAction = {
        entity_id: newId(),
        cloud_id: null,
        order_entity_id: existingOrder.entity_id,
        action_type: 'CORRECT_ORDER',
        reason: payload.reason || 'Order corrected locally',
        replacement_order_entity_id: replacementEntityId,
        affects_inventory: 1,
        version: 1,
        sync_status: 'pending_sync',
        updated_at: timestamp,
        last_synced_at: null,
        deleted_at: null,
        created_at: timestamp,
      }

      orderActions.insert(correctionAction)

      const cancelledOrder = orders.updateStatus({
        entityId: existingOrder.entity_id,
        status: 'CANCELLED',
        notes: payload.reason || existingOrder.notes,
      })

      const reversalMovements = existingOrder.items
        .filter((item) => item.product_entity_id && Number(item.qty) > 0)
        .map((item) => ({
          entity_id: newId(),
          cloud_id: null,
          product_entity_id: item.product_entity_id,
          order_entity_id: existingOrder.entity_id,
          order_action_entity_id: correctionAction.entity_id,
          movement_type: 'cancel_restock',
          quantity_delta: Number(item.qty),
          reason: `Correction restock for order ${existingOrder.order_number}`,
          version: 1,
          sync_status: 'pending_sync',
          updated_at: timestamp,
          last_synced_at: null,
          deleted_at: null,
          created_at: timestamp,
        }))

      if (reversalMovements.length) {
        inventoryMovements.insertMany(reversalMovements)
      }

      const replacementItems = (payload.replacementOrder.items || []).map((item) => ({
        entity_id: item.entity_id || newId(),
        order_entity_id: replacementEntityId,
        product_entity_id: item.product_entity_id || null,
        description: item.description,
        qty: Number(item.qty || 0),
        unit_price: Number(item.unit_price || 0),
        line_total: Number(item.qty || 0) * Number(item.unit_price || 0),
        version: 1,
        sync_status: 'pending_sync',
        updated_at: timestamp,
        last_synced_at: null,
        deleted_at: null,
        created_at: timestamp,
      }))

      const totals = normalizeOrderTotals(
        replacementItems,
        payload.replacementOrder.delivery_fee,
        payload.replacementOrder.total_amount
      )

      const replacement = {
        entity_id: replacementEntityId,
        cloud_id: null,
        order_number: payload.replacementOrder.order_number,
        customer_entity_id: payload.replacementOrder.customer_entity_id || null,
        replacement_for_order_entity_id: existingOrder.entity_id,
        status: 'PENDING',
        payment_method: payload.replacementOrder.payment_method || existingOrder.payment_method,
        customer_name: payload.replacementOrder.customer_name || null,
        customer_phone: payload.replacementOrder.customer_phone || null,
        customer_address: payload.replacementOrder.customer_address || null,
        district: payload.replacementOrder.district || null,
        delivery_service: payload.replacementOrder.delivery_service || null,
        tracking_number: null,
        notes: payload.replacementOrder.notes || null,
        subtotal_amount: totals.subtotal,
        delivery_fee: Number(payload.replacementOrder.delivery_fee || 0),
        total_amount: totals.total,
        cod_amount: Number(payload.replacementOrder.cod_amount || 0),
        is_replacement_order: 1,
        version: 1,
        sync_status: 'pending_sync',
        updated_at: timestamp,
        last_synced_at: null,
        deleted_at: null,
        created_at: timestamp,
      }

      orders.insert(replacement)

      if (replacementItems.length) {
        orderItems.insertMany(replacementItems)
      }

      const saleMovements = replacementItems
        .filter((item) => item.product_entity_id && Number(item.qty) > 0)
        .map((item) => ({
          entity_id: newId(),
          cloud_id: null,
          product_entity_id: item.product_entity_id,
          order_entity_id: replacement.entity_id,
          order_action_entity_id: null,
          movement_type: 'sale_commit',
          quantity_delta: Number(item.qty) * -1,
          reason: `Replacement order ${replacement.order_number} sale`,
          version: 1,
          sync_status: 'pending_sync',
          updated_at: timestamp,
          last_synced_at: null,
          deleted_at: null,
          created_at: timestamp,
        }))

      if (saleMovements.length) {
        inventoryMovements.insertMany(saleMovements)
      }

      syncQueue.enqueueMany([
        buildQueueItem({
          entityType: 'order_action',
          entityId: correctionAction.entity_id,
          operation: 'create',
          payload: correctionAction,
        }),
        buildQueueItem({
          entityType: 'order',
          entityId: cancelledOrder.entity_id,
          operation: 'update',
          payload: cancelledOrder,
        }),
        ...reversalMovements.map((movement) =>
          buildQueueItem({
            entityType: 'inventory_movement',
            entityId: movement.entity_id,
            operation: 'create',
            payload: movement,
          })
        ),
        buildQueueItem({
          entityType: 'order',
          entityId: replacement.entity_id,
          operation: 'create',
          payload: replacement,
        }),
        ...replacementItems.map((item) =>
          buildQueueItem({
            entityType: 'order_item',
            entityId: item.entity_id,
            operation: 'create',
            payload: item,
          })
        ),
        ...saleMovements.map((movement) =>
          buildQueueItem({
            entityType: 'inventory_movement',
            entityId: movement.entity_id,
            operation: 'create',
            payload: movement,
          })
        ),
      ])

      return {
        originalOrder: cancelledOrder,
        correctionAction,
        replacementOrder: orders.getOrderWithItems(replacement.entity_id),
      }
    })

    return execute({ originalOrderEntityId, reason, replacementOrder })
  }

  applyCourierUpdate(payload) {
    const { orders } = this.repositories

    return this.db.transaction((input) => {
      const existingOrder = orders.getOrderWithItems(input.orderEntityId)

      if (!existingOrder || existingOrder.deleted_at) {
        throw new Error('Order not found.')
      }

      return orders.applyCourierUpdate({
        entityId: input.orderEntityId,
        status: input.status || existingOrder.status,
        trackingNumber: input.trackingNumber,
        courierShipmentId: input.courierShipmentId,
        courierSyncStatus: input.courierSyncStatus,
        courierSyncError: input.courierSyncError,
        courierLastSyncedAt: input.courierLastSyncedAt,
        labelUrl: input.labelUrl,
        deliveryService: input.deliveryService,
      })
    })(payload)
  }
}

module.exports = {
  OrderService,
}
