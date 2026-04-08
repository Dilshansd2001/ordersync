const { createHash } = require('node:crypto')
const mongoose = require('mongoose')

const Business = require('../models/Business')
const Customer = require('../models/Customer')
const Expense = require('../models/Expense')
const InventoryMovement = require('../models/InventoryMovement')
const Order = require('../models/Order')
const OrderAction = require('../models/OrderAction')
const Product = require('../models/Product')
const SyncIdempotencyKey = require('../models/SyncIdempotencyKey')
const { sendCustomerMessageEvent } = require('./customerMessagingService')
const {
  assertOrderQuotaAvailable,
  assertPlanFeature,
} = require('./subscriptionAccessService')

const stableStringify = (value) => JSON.stringify(value)

const buildRequestHash = (payload) =>
  createHash('sha256').update(stableStringify(payload)).digest('hex')

const toDate = (value) => (value ? new Date(value) : null)

const resolveBusinessObjectId = (businessId) =>
  businessId instanceof mongoose.Types.ObjectId ? businessId : new mongoose.Types.ObjectId(businessId)

const serializeProduct = (product) => ({
  entity_id: product.entityId,
  cloud_id: String(product._id),
  sku: product.sku,
  name: product.name,
  category: product.category,
  buying_price: product.buyingPrice,
  selling_price: product.sellingPrice,
  stock_count: Number(product.stockCount || 0),
  image_url: product.image,
  is_available: product.isAvailable,
  notes: product.notes || '',
  updated_at: product.updatedAt.toISOString(),
  created_at: product.createdAt.toISOString(),
  deleted_at: product.deletedAt ? product.deletedAt.toISOString() : null,
})

const serializeCustomer = (customer) => ({
  entity_id: customer.entityId,
  cloud_id: String(customer._id),
  name: customer.name,
  phone: customer.phone || '',
  whatsapp_number: customer.whatsappNumber || '',
  email: customer.email || '',
  address_line: customer.addressLine || '',
  nearest_city: customer.nearestCity || '',
  district: customer.district || '',
  loyalty_status: customer.loyaltyStatus,
  notes: customer.notes || '',
  updated_at: customer.updatedAt.toISOString(),
  created_at: customer.createdAt.toISOString(),
  deleted_at: customer.deletedAt ? customer.deletedAt.toISOString() : null,
})

const serializeExpense = (expense) => ({
  entity_id: expense.entityId,
  cloud_id: String(expense._id),
  category: expense.category,
  amount: expense.amount,
  description: expense.description || '',
  expense_date: expense.date ? expense.date.toISOString() : null,
  updated_at: expense.updatedAt.toISOString(),
  created_at: expense.createdAt.toISOString(),
  deleted_at: expense.deletedAt ? expense.deletedAt.toISOString() : null,
})

const serializeInventoryMovement = (movement) => ({
  entity_id: movement.entityId,
  cloud_id: String(movement._id),
  product_entity_id: movement.productEntityId,
  order_entity_id: movement.orderEntityId || '',
  order_action_entity_id: movement.orderActionEntityId || '',
  movement_type: movement.movementType,
  quantity_delta: movement.quantityDelta,
  reason: movement.reason || '',
  updated_at: movement.updatedAt.toISOString(),
  created_at: movement.createdAt.toISOString(),
  deleted_at: movement.deletedAt ? movement.deletedAt.toISOString() : null,
})

const serializeOrderAction = (action) => ({
  entity_id: action.entityId,
  cloud_id: String(action._id),
  order_entity_id: action.orderEntityId,
  action_type: action.actionType,
  reason: action.reason || '',
  replacement_order_entity_id: action.replacementOrderEntityId || '',
  affects_inventory: Boolean(action.affectsInventory),
  updated_at: action.updatedAt.toISOString(),
  created_at: action.createdAt.toISOString(),
  deleted_at: action.deletedAt ? action.deletedAt.toISOString() : null,
})

const serializeOrder = (order) => ({
  entity_id: order.entityId,
  cloud_id: String(order._id),
  order_number: order.orderId,
  customer_entity_id: order.customerEntityId || '',
  replacement_for_order_entity_id: order.replacementForOrderEntityId || '',
  status: order.status,
  payment_method: order.paymentMethod,
  customer_name: order.customerName || '',
  customer_phone: order.customerPhone || '',
  customer_address: order.customerAddress || '',
  district: order.district || '',
  delivery_service: order.deliveryService || '',
  tracking_number: order.trackingNumber || '',
  courier_shipment_id: order.courierShipmentId || '',
  courier_sync_status: order.courierSyncStatus || 'PENDING',
  courier_sync_error: order.courierSyncError || '',
  courier_last_synced_at: order.courierLastSyncedAt ? order.courierLastSyncedAt.toISOString() : null,
  label_url: order.labelUrl || '',
  notes: order.notes || '',
  subtotal_amount:
    Number(order.totalAmount || 0) - Number(order.deliveryFee || 0),
  delivery_fee: Number(order.deliveryFee || 0),
  total_amount: Number(order.totalAmount || 0),
  cod_amount: Number(order.codAmount || 0),
  is_replacement_order: Boolean(order.isReplacementOrder),
  updated_at: order.updatedAt.toISOString(),
  created_at: order.createdAt.toISOString(),
  deleted_at: order.deletedAt ? order.deletedAt.toISOString() : null,
  items: (order.items || []).map((item) => ({
    entity_id: item.entityId,
    product_entity_id: item.productEntityId || '',
    description: item.description,
    qty: Number(item.qty || 0),
    unit_price: Number(item.unitPrice || 0),
    line_total: Number(item.qty || 0) * Number(item.unitPrice || 0),
    updated_at: order.updatedAt.toISOString(),
    created_at: order.createdAt.toISOString(),
    deleted_at: null,
  })),
})

const serializeSetting = (business) => ({
  entity_id: business.entityId,
  cloud_id: String(business._id),
  setting_key: 'business_profile',
  value_type: 'json',
  setting_value: JSON.stringify({
    name: business.name,
    tagline: business.tagline || '',
    email: business.email,
    phone: business.phone || '',
    address: business.address || '',
    invoice_settings: business.invoiceSettings || {},
  }),
  updated_at: business.updatedAt.toISOString(),
  created_at: business.createdAt.toISOString(),
  deleted_at: business.deletedAt ? business.deletedAt.toISOString() : null,
})

const buildStoredResponse = ({
  entityType,
  entityId,
  result,
  serverUpdatedAt,
  errorCode = null,
  errorMessage = null,
}) => ({
  entity_type: entityType,
  entity_id: entityId,
  result,
  server_updated_at: serverUpdatedAt ? serverUpdatedAt.toISOString() : null,
  error_code: errorCode,
  error_message: errorMessage,
})

class SyncService {
  async handlePushBatch({ businessId, deviceId, items = [] }) {
    const results = []

    for (const item of items) {
      const result = await this.handlePushItem({ businessId, deviceId, item })
      results.push(result)
    }

    return {
      server_time: new Date().toISOString(),
      results,
    }
  }

  async handlePushItem({ businessId, deviceId, item }) {
    const businessObjectId = resolveBusinessObjectId(businessId)
    const business = await Business.findById(businessObjectId)

    if (!business) {
      return {
        queue_id: item.queue_id,
        ...buildStoredResponse({
          entityType: item.entity_type,
          entityId: item.entity_id,
          result: 'rejected',
          errorCode: 'business_not_found',
          errorMessage: 'Business workspace was not found.',
        }),
      }
    }

    const requestHash = buildRequestHash(item.payload || {})
    const existingKey = await SyncIdempotencyKey.findOne({
      businessId: businessObjectId,
      idempotencyKey: item.idempotency_key,
    }).lean()

    if (existingKey) {
      if (existingKey.requestHash !== requestHash) {
        return {
          queue_id: item.queue_id,
          ...buildStoredResponse({
            entityType: item.entity_type,
            entityId: item.entity_id,
            result: 'conflict',
            errorCode: 'idempotency_mismatch',
            errorMessage: 'This idempotency key was already used for a different payload.',
          }),
        }
      }

      return {
        queue_id: item.queue_id,
        ...existingKey.responsePayload,
      }
    }

    let responsePayload

    try {
      switch (item.entity_type) {
        case 'product':
          assertPlanFeature(business, 'inventory')
          responsePayload = await this.upsertProduct({
            businessId: businessObjectId,
            deviceId,
            operation: item.operation,
            payload: item.payload,
          })
          break
        case 'customer':
          responsePayload = await this.upsertCustomer({
            businessId: businessObjectId,
            deviceId,
            operation: item.operation,
            payload: item.payload,
          })
          break
        case 'expense':
          assertPlanFeature(business, 'expenses')
          responsePayload = await this.upsertExpense({
            businessId: businessObjectId,
            deviceId,
            operation: item.operation,
            payload: item.payload,
          })
          break
        case 'inventory_movement':
          responsePayload = await this.upsertInventoryMovement({
            businessId: businessObjectId,
            deviceId,
            operation: item.operation,
            payload: item.payload,
          })
          break
        case 'order_action':
          responsePayload = await this.upsertOrderAction({
            businessId: businessObjectId,
            deviceId,
            operation: item.operation,
            payload: item.payload,
          })
          break
        case 'order':
          responsePayload = await this.upsertOrderAggregate({
            business,
            businessId: businessObjectId,
            deviceId,
            operation: item.operation,
            payload: item.payload,
          })
          break
        case 'setting':
          if (item.payload?.setting_key === 'courier_settings') {
            assertPlanFeature(business, 'courierSync')
          }
          responsePayload = await this.upsertBusinessSettings({
            businessId: businessObjectId,
            deviceId,
            operation: item.operation,
            payload: item.payload,
          })
          break
        default:
          responsePayload = buildStoredResponse({
            entityType: item.entity_type,
            entityId: item.entity_id,
            result: 'rejected',
            errorCode: 'unsupported_entity_type',
            errorMessage: `Entity type ${item.entity_type} is not supported by sync.`,
          })
          break
      }
    } catch (error) {
      responsePayload = buildStoredResponse({
        entityType: item.entity_type,
        entityId: item.entity_id,
        result: 'rejected',
        errorCode: error.code || 'push_rejected',
        errorMessage: error.message || 'Sync item was rejected.',
      })
    }

    await SyncIdempotencyKey.create({
      businessId: businessObjectId,
      idempotencyKey: item.idempotency_key,
      entityType: item.entity_type,
      entityId: item.entity_id,
      operation: item.operation,
      requestHash,
      responsePayload,
    })

    return {
      queue_id: item.queue_id,
      ...responsePayload,
    }
  }

  async upsertProduct({ businessId, deviceId, operation, payload }) {
    const existing = await Product.findOne({ businessId, entityId: payload.entity_id })

    if (operation === 'delete' || payload.deleted_at) {
      if (!existing) {
        return buildStoredResponse({
          entityType: 'product',
          entityId: payload.entity_id,
          result: 'already_applied',
        })
      }

      existing.deletedAt = toDate(payload.deleted_at) || new Date()
      existing.originDeviceId = deviceId
      await existing.save()

      return buildStoredResponse({
        entityType: 'product',
        entityId: payload.entity_id,
        result: 'applied',
        serverUpdatedAt: existing.updatedAt,
      })
    }

    const document = await Product.findOneAndUpdate(
      { businessId, entityId: payload.entity_id },
      {
        businessId,
        entityId: payload.entity_id,
        sku: payload.sku,
        name: payload.name,
        category: payload.category || '',
        buyingPrice: Number(payload.buying_price || 0),
        sellingPrice: Number(payload.selling_price || 0),
        stockCount: Number(payload.stock_count || 0),
        image: payload.image_url || '',
        isAvailable:
          payload.is_available === undefined || payload.is_available === null
            ? Number(payload.stock_count || 0) > 0
            : payload.is_available !== false,
        notes: payload.notes || '',
        originDeviceId: deviceId,
        deletedAt: null,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    )

    return buildStoredResponse({
      entityType: 'product',
      entityId: payload.entity_id,
      result: existing ? 'applied' : 'applied',
      serverUpdatedAt: document.updatedAt,
    })
  }

  async upsertCustomer({ businessId, deviceId, operation, payload }) {
    const existing = await Customer.findOne({ businessId, entityId: payload.entity_id })

    if (operation === 'delete' || payload.deleted_at) {
      if (!existing) {
        return buildStoredResponse({
          entityType: 'customer',
          entityId: payload.entity_id,
          result: 'already_applied',
        })
      }

      existing.deletedAt = toDate(payload.deleted_at) || new Date()
      existing.originDeviceId = deviceId
      await existing.save()

      return buildStoredResponse({
        entityType: 'customer',
        entityId: payload.entity_id,
        result: 'applied',
        serverUpdatedAt: existing.updatedAt,
      })
    }

    const document = await Customer.findOneAndUpdate(
      { businessId, entityId: payload.entity_id },
      {
        businessId,
        entityId: payload.entity_id,
        name: payload.name,
        phone: payload.phone || '',
        whatsappNumber: payload.whatsapp_number || '',
        email: payload.email || '',
        addressLine: payload.address_line || '',
        nearestCity: payload.nearest_city || '',
        district: payload.district || '',
        loyaltyStatus: payload.loyalty_status || 'ACTIVE',
        notes: payload.notes || '',
        originDeviceId: deviceId,
        deletedAt: null,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    )

    return buildStoredResponse({
      entityType: 'customer',
      entityId: payload.entity_id,
      result: 'applied',
      serverUpdatedAt: document.updatedAt,
    })
  }

  async upsertExpense({ businessId, deviceId, operation, payload }) {
    const existing = await Expense.findOne({ businessId, entityId: payload.entity_id })

    if (operation === 'delete' || payload.deleted_at) {
      if (!existing) {
        return buildStoredResponse({
          entityType: 'expense',
          entityId: payload.entity_id,
          result: 'already_applied',
        })
      }

      existing.deletedAt = toDate(payload.deleted_at) || new Date()
      existing.originDeviceId = deviceId
      await existing.save()

      return buildStoredResponse({
        entityType: 'expense',
        entityId: payload.entity_id,
        result: 'applied',
        serverUpdatedAt: existing.updatedAt,
      })
    }

    const document = await Expense.findOneAndUpdate(
      { businessId, entityId: payload.entity_id },
      {
        businessId,
        entityId: payload.entity_id,
        category: payload.category,
        amount: Number(payload.amount || 0),
        description: payload.description || '',
        date: toDate(payload.expense_date) || new Date(),
        originDeviceId: deviceId,
        deletedAt: null,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    )

    return buildStoredResponse({
      entityType: 'expense',
      entityId: payload.entity_id,
      result: 'applied',
      serverUpdatedAt: document.updatedAt,
    })
  }

  async upsertInventoryMovement({ businessId, deviceId, operation, payload, session = null }) {
    const existing = await InventoryMovement.findOne({ businessId, entityId: payload.entity_id }).session(session)

    if (existing) {
      return buildStoredResponse({
        entityType: 'inventory_movement',
        entityId: payload.entity_id,
        result: 'already_applied',
        serverUpdatedAt: existing.updatedAt,
      })
    }

    if (operation === 'delete' || payload.deleted_at) {
      return buildStoredResponse({
        entityType: 'inventory_movement',
        entityId: payload.entity_id,
        result: 'already_applied',
      })
    }

    const product = await Product.findOne({
      businessId,
      entityId: payload.product_entity_id,
    }).session(session)

    const order = payload.order_entity_id
      ? await Order.findOne({ businessId, entityId: payload.order_entity_id }).session(session)
      : null

    const document = await InventoryMovement.create(
      [
        {
          businessId,
          entityId: payload.entity_id,
          productId: product?._id || undefined,
          productEntityId: payload.product_entity_id,
          orderId: order?._id || undefined,
          orderEntityId: payload.order_entity_id || '',
          orderActionEntityId: payload.order_action_entity_id || '',
          movementType: payload.movement_type,
          quantityDelta: Number(payload.quantity_delta || 0),
          reason: payload.reason || '',
          originDeviceId: deviceId,
          deletedAt: null,
        },
      ],
      session ? { session } : {}
    )

    return buildStoredResponse({
      entityType: 'inventory_movement',
      entityId: payload.entity_id,
      result: 'applied',
      serverUpdatedAt: document[0].updatedAt,
    })
  }

  async upsertOrderAction({ businessId, deviceId, operation, payload, session = null }) {
    const existing = await OrderAction.findOne({ businessId, entityId: payload.entity_id }).session(session)

    if (existing) {
      return buildStoredResponse({
        entityType: 'order_action',
        entityId: payload.entity_id,
        result: 'already_applied',
        serverUpdatedAt: existing.updatedAt,
      })
    }

    if (operation === 'delete' || payload.deleted_at) {
      return buildStoredResponse({
        entityType: 'order_action',
        entityId: payload.entity_id,
        result: 'already_applied',
      })
    }

    const order = payload.order_entity_id
      ? await Order.findOne({ businessId, entityId: payload.order_entity_id }).session(session)
      : null

    const created = await OrderAction.create(
      [
        {
          businessId,
          entityId: payload.entity_id,
          orderId: order?._id || undefined,
          orderEntityId: payload.order_entity_id,
          actionType: payload.action_type,
          reason: payload.reason || '',
          replacementOrderEntityId: payload.replacement_order_entity_id || '',
          affectsInventory: payload.affects_inventory !== false,
          originDeviceId: deviceId,
          deletedAt: null,
        },
      ],
      session ? { session } : {}
    )

    return buildStoredResponse({
      entityType: 'order_action',
      entityId: payload.entity_id,
      result: 'applied',
      serverUpdatedAt: created[0].updatedAt,
    })
  }

  async upsertOrderAggregate({ business, businessId, deviceId, operation, payload }) {
    const session = await mongoose.startSession()
    const messageEventsToSend = []

    try {
      let responsePayload

      await session.withTransaction(async () => {
        const existing = await Order.findOne({ businessId, entityId: payload.entity_id }).session(session)

        if (existing && existing.deletedAt && (operation === 'delete' || payload.deleted_at)) {
          responsePayload = buildStoredResponse({
            entityType: 'order',
            entityId: payload.entity_id,
            result: 'already_applied',
            serverUpdatedAt: existing.updatedAt,
          })
          return
        }

        if (operation === 'delete' || payload.deleted_at) {
          if (!existing) {
            responsePayload = buildStoredResponse({
              entityType: 'order',
              entityId: payload.entity_id,
              result: 'already_applied',
            })
            return
          }

          existing.deletedAt = toDate(payload.deleted_at) || new Date()
          existing.originDeviceId = deviceId
          await existing.save({ session })

          responsePayload = buildStoredResponse({
            entityType: 'order',
            entityId: payload.entity_id,
            result: 'applied',
            serverUpdatedAt: existing.updatedAt,
          })
          return
        }

        const mappedItems = await Promise.all(
          (payload.items || []).map(async (item) => {
            const product = item.product_entity_id
              ? await Product.findOne({
                  businessId,
                  entityId: item.product_entity_id,
                }).session(session)
              : null

            return {
              entityId: item.entity_id,
              productId: product?._id || undefined,
              productEntityId: item.product_entity_id || '',
              description: item.description,
              qty: Number(item.qty || 0),
              unitPrice: Number(item.unit_price || 0),
            }
          })
        )

        if (!existing && operation !== 'delete' && !payload.deleted_at) {
          await assertOrderQuotaAvailable({
            business,
            additionalOrders: 1,
            session,
          })
        }

        const order = await Order.findOneAndUpdate(
          { businessId, entityId: payload.entity_id },
          {
            businessId,
            entityId: payload.entity_id,
            orderId: payload.order_number,
            customerEntityId: payload.customer_entity_id || '',
            replacementForOrderEntityId: payload.replacement_for_order_entity_id || '',
            isReplacementOrder: Boolean(payload.is_replacement_order),
            status: payload.status || 'PENDING',
            paymentMethod: payload.payment_method || 'COD',
            customerName: payload.customer_name || '',
            customerPhone: payload.customer_phone || '',
            customerAddress: payload.customer_address || '',
            district: payload.district || '',
            deliveryService: payload.delivery_service || 'Koombiyo',
            trackingNumber: payload.tracking_number || '',
            courierShipmentId: payload.courier_shipment_id || '',
            courierSyncStatus: payload.courier_sync_status || 'PENDING',
            courierSyncError: payload.courier_sync_error || '',
            courierLastSyncedAt: toDate(payload.courier_last_synced_at),
            labelUrl: payload.label_url || '',
            notes: payload.notes || '',
            totalAmount: Number(payload.total_amount || 0),
            deliveryFee: Number(payload.delivery_fee || 0),
            codAmount: Number(payload.cod_amount || 0),
            items: mappedItems,
            originDeviceId: deviceId,
            deletedAt: null,
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
            session,
          }
        )

        if (!payload.deleted_at) {
          const previousStatus = existing?.status || null
          const nextStatus = order.status

          if (!existing) {
            messageEventsToSend.push({
              eventKey: 'orderConfirmation',
              orderId: order._id,
            })
          }

          if (previousStatus !== 'DISPATCHED' && nextStatus === 'DISPATCHED') {
            messageEventsToSend.push({
              eventKey: 'orderReady',
              orderId: order._id,
            })
          }

          if (previousStatus !== 'DELIVERED' && nextStatus === 'DELIVERED') {
            messageEventsToSend.push({
              eventKey: 'thankYou',
              orderId: order._id,
            })
          }
        }

        for (const movement of payload.inventory_movements || []) {
          await this.upsertInventoryMovement({
            businessId,
            deviceId,
            operation: 'create',
            payload: movement,
            session,
          })
        }

        responsePayload = buildStoredResponse({
          entityType: 'order',
          entityId: payload.entity_id,
          result: existing ? 'applied' : 'applied',
          serverUpdatedAt: order.updatedAt,
        })
      })

      for (const event of messageEventsToSend) {
        try {
          const order = await Order.findById(event.orderId).lean()

          if (!order) {
            continue
          }

          await sendCustomerMessageEvent({
            businessId,
            eventKey: event.eventKey,
            order,
          })
        } catch (messageError) {
          console.error(`Sync order messaging failed for ${event.eventKey}:`, messageError.message)
        }
      }

      return responsePayload
    } finally {
      await session.endSession()
    }
  }

  async upsertBusinessSettings({ businessId, deviceId, operation, payload }) {
    const business = await Business.findById(businessId)

    if (!business) {
      return buildStoredResponse({
        entityType: 'setting',
        entityId: payload.entity_id,
        result: 'rejected',
        errorCode: 'business_not_found',
        errorMessage: 'Business workspace not found.',
      })
    }

    if (operation === 'delete' || payload.deleted_at) {
      business.deletedAt = toDate(payload.deleted_at) || new Date()
      business.originDeviceId = deviceId
      await business.save()

      return buildStoredResponse({
        entityType: 'setting',
        entityId: business.entityId,
        result: 'applied',
        serverUpdatedAt: business.updatedAt,
      })
    }

    let parsedValue = {}
    try {
      parsedValue = JSON.parse(payload.setting_value || '{}')
    } catch (error) {
      return buildStoredResponse({
        entityType: 'setting',
        entityId: business.entityId,
        result: 'rejected',
        errorCode: 'invalid_setting_payload',
        errorMessage: 'setting_value must be valid JSON.',
      })
    }

    business.name = parsedValue.name || business.name
    business.tagline = parsedValue.tagline || ''
    business.phone = parsedValue.phone || ''
    business.address = parsedValue.address || ''
    business.invoiceSettings = parsedValue.invoice_settings || business.invoiceSettings
    business.originDeviceId = deviceId
    business.deletedAt = null
    await business.save()

    return buildStoredResponse({
      entityType: 'setting',
      entityId: business.entityId,
      result: 'applied',
      serverUpdatedAt: business.updatedAt,
    })
  }

  async pullChanges({ businessId, updatedSince, limit = 100, page = 1 }) {
    const businessObjectId = resolveBusinessObjectId(businessId)
    const sinceDate = updatedSince ? new Date(updatedSince) : new Date(0)
    const baseQuery = {
      businessId: businessObjectId,
      updatedAt: { $gt: sinceDate },
    }

    const [products, customers, expenses, orders, orderActions, inventoryMovements, business] = await Promise.all([
      Product.find(baseQuery).sort({ updatedAt: 1 }).lean(),
      Customer.find(baseQuery).sort({ updatedAt: 1 }).lean(),
      Expense.find(baseQuery).sort({ updatedAt: 1 }).lean(),
      Order.find(baseQuery).sort({ updatedAt: 1 }).lean(),
      OrderAction.find(baseQuery).sort({ updatedAt: 1 }).lean(),
      InventoryMovement.find(baseQuery).sort({ updatedAt: 1 }).lean(),
      Business.findOne({ _id: businessObjectId, updatedAt: { $gt: sinceDate } }).lean(),
    ])

    const mergedChanges = [
      ...products.map((doc) => ({
        entity_type: 'product',
        updated_at: doc.updatedAt,
        payload: serializeProduct(doc),
      })),
      ...customers.map((doc) => ({
        entity_type: 'customer',
        updated_at: doc.updatedAt,
        payload: serializeCustomer(doc),
      })),
      ...expenses.map((doc) => ({
        entity_type: 'expense',
        updated_at: doc.updatedAt,
        payload: serializeExpense(doc),
      })),
      ...orders.map((doc) => ({
        entity_type: 'order',
        updated_at: doc.updatedAt,
        payload: serializeOrder(doc),
      })),
      ...orderActions.map((doc) => ({
        entity_type: 'order_action',
        updated_at: doc.updatedAt,
        payload: serializeOrderAction(doc),
      })),
      ...inventoryMovements.map((doc) => ({
        entity_type: 'inventory_movement',
        updated_at: doc.updatedAt,
        payload: serializeInventoryMovement(doc),
      })),
      ...(business
        ? [
            {
              entity_type: 'setting',
              updated_at: business.updatedAt,
              payload: serializeSetting(business),
            },
          ]
        : []),
    ].sort((left, right) => new Date(left.updated_at) - new Date(right.updated_at))

    const total = mergedChanges.length
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500)
    const safePage = Math.max(Number(page) || 1, 1)
    const start = (safePage - 1) * safeLimit
    const end = start + safeLimit
    const pageItems = mergedChanges.slice(start, end)

    return {
      server_time: new Date().toISOString(),
      page: safePage,
      limit: safeLimit,
      has_more: end < total,
      changes: pageItems,
    }
  }
}

module.exports = {
  SyncService,
}
