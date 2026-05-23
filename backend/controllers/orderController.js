const mongoose = require('mongoose')
const Counter = require('../models/Counter')
const Order = require('../models/Order')
const Product = require('../models/Product')
const Business = require('../models/Business')
const Customer = require('../models/Customer')
const { syncOrderToCourier } = require('../services/courier/courierService')
const { getCourierProviderLabel } = require('../services/courier/providers')
const { sendWhatsApp } = require('../utils/sendWhatsApp')
const { sendCustomerMessageEvent } = require('../services/customerMessagingService')

const calculateItemsTotal = (items = []) =>
  items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0), 0)

const ORDER_COUNTER_KEY = 'order'
const ORDER_ID_BASE = 1000

const formatOrderId = (sequence) => `ORD-${sequence}`

const reserveOrderSequences = async (businessId, count = 1, session = null) => {
  const collection = Counter.collection
  const result = await collection.findOneAndUpdate(
    { businessId: new mongoose.Types.ObjectId(businessId), key: ORDER_COUNTER_KEY },
    [
      {
        $set: {
          businessId: new mongoose.Types.ObjectId(businessId),
          key: ORDER_COUNTER_KEY,
          value: {
            $add: [{ $ifNull: ['$value', ORDER_ID_BASE] }, count],
          },
        },
      },
    ],
    {
      upsert: true,
      returnDocument: 'after',
      session,
    }
  )

  const lastSequence = result.value?.value || ORDER_ID_BASE
  const firstSequence = lastSequence - count + 1

  return Array.from({ length: count }, (_, index) => firstSequence + index)
}

const generateNextOrderId = async (businessId, session = null) => {
  const [nextSequence] = await reserveOrderSequences(businessId, 1, session)
  return formatOrderId(nextSequence)
}

const normalizeOrderPayload = (payload, businessId, orderId) => {
  const items = Array.isArray(payload.items) ? payload.items : []
  const normalizedItems = items.map((item) => ({
    productId: item.productId || undefined,
    description: String(item.description || '').trim(),
    qty: Number(item.qty || 0),
    unitPrice: Number(item.unitPrice || 0),
  }))
  const itemsTotal = calculateItemsTotal(normalizedItems)
  const deliveryFee = Number(payload.deliveryFee || 0)
  const totalAmount = payload.totalAmount != null ? Number(payload.totalAmount) : itemsTotal + deliveryFee

  return {
    ...payload,
    businessId,
    orderId,
    items: normalizedItems,
    deliveryFee,
    codAmount: Number(payload.codAmount || 0),
    totalAmount,
  }
}

const validateOrderInput = (payload = {}) => {
  if (!String(payload.customerName || '').trim()) {
    throw new Error('Customer name is required.')
  }

  if (!String(payload.customerPhone || '').trim()) {
    throw new Error('Customer phone is required.')
  }

  if (!String(payload.customerAddress || '').trim()) {
    throw new Error('Customer address is required.')
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('At least one order item is required.')
  }

  payload.items.forEach((item, index) => {
    if (!String(item.description || '').trim()) {
      throw new Error(`Item ${index + 1} description is required.`)
    }

    if (!Number.isFinite(Number(item.qty)) || Number(item.qty) <= 0) {
      throw new Error(`Item ${index + 1} quantity must be greater than 0.`)
    }

    if (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0) {
      throw new Error(`Item ${index + 1} unit price cannot be negative.`)
    }
  })
}

const deductStockForItems = async (businessId, items = [], session = null) => {
  const inventoryItems = items.filter((item) => item.productId && Number(item.qty) > 0)

  if (!inventoryItems.length) {
    return
  }

  const productIds = inventoryItems.map((item) => item.productId)
  const products = await Product.find({ businessId, _id: { $in: productIds } }).session(session)
  const productMap = new Map(products.map((product) => [String(product._id), product]))

  inventoryItems.forEach((item) => {
    const product = productMap.get(String(item.productId))

    if (!product) {
      throw new Error(`Product not found for item: ${item.description}`)
    }

    if (product.stockCount < Number(item.qty)) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockCount}`)
    }
  })

  await Product.bulkWrite(
    inventoryItems.map((item) => ({
      updateOne: {
        filter: { _id: item.productId, businessId },
        update: { $inc: { stockCount: -Number(item.qty) } },
      },
    })),
    session ? { session } : {}
  )
}

const syncCustomerFromOrder = async (businessId, orderPayload, session = null) => {
  const customerName = String(orderPayload.customerName || '').trim()
  const customerPhone = String(orderPayload.customerPhone || '').trim()

  if (!customerName || !customerPhone) {
    return null
  }

  const existingCustomer = await Customer.findOne({
    businessId,
    phone: customerPhone,
  }).session(session)

  if (existingCustomer) {
    const mergedTotalSpend = Number(existingCustomer.totalSpend || 0) + Number(orderPayload.totalAmount || 0)
    const mergedOrderCount = Number(existingCustomer.orderCount || 0) + 1

    existingCustomer.name = customerName
    existingCustomer.whatsappNumber = existingCustomer.whatsappNumber || customerPhone
    existingCustomer.addressLine = orderPayload.customerAddress || existingCustomer.addressLine || ''
    existingCustomer.district = orderPayload.district || existingCustomer.district || ''
    existingCustomer.totalSpend = mergedTotalSpend
    existingCustomer.orderCount = mergedOrderCount
    existingCustomer.loyaltyStatus = 'ACTIVE'
    await existingCustomer.save({ session })

    return existingCustomer
  }

  const [customer] = await Customer.create(
    [
      {
        businessId,
        name: customerName,
        phone: customerPhone,
        whatsappNumber: customerPhone,
        addressLine: orderPayload.customerAddress || '',
        district: orderPayload.district || '',
        loyaltyStatus: 'ACTIVE',
        totalSpend: Number(orderPayload.totalAmount || 0),
        orderCount: 1,
      },
    ],
    session ? { session } : {}
  )

  return customer
}

const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession()

  try {
    validateOrderInput(req.body)

    let order

    await session.withTransaction(async () => {
      const normalizedOrder = normalizeOrderPayload(
        req.body,
        req.businessId,
        await generateNextOrderId(req.businessId, session)
      )

      await deductStockForItems(req.businessId, normalizedOrder.items, session)
      const customer = await syncCustomerFromOrder(req.businessId, normalizedOrder, session)
      if (customer?.entityId) {
        normalizedOrder.customerEntityId = customer.entityId
      }

      ;[order] = await Order.create([normalizedOrder], { session })
    })

    try {
      await sendCustomerMessageEvent({
        businessId: req.businessId,
        eventKey: 'orderConfirmation',
        order,
      })
    } catch (messageError) {
      console.error('Order confirmation messaging failed:', messageError.message)
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data: order,
    })
  } catch (error) {
    return next(error)
  } finally {
    await session.endSession()
  }
}

const bulkCreateOrders = async (req, res, next) => {
  const session = await mongoose.startSession()

  try {
    const ordersArray = Array.isArray(req.body.orders) ? req.body.orders : []

    if (!ordersArray.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one order is required for bulk upload.',
      })
    }

    ordersArray.forEach((payload) => validateOrderInput(payload))

    let insertedOrders = []

    await session.withTransaction(async () => {
      const sequences = await reserveOrderSequences(req.businessId, ordersArray.length, session)
      const documents = sequences.map((sequence, index) =>
        normalizeOrderPayload(ordersArray[index], req.businessId, formatOrderId(sequence))
      )

      for (const document of documents) {
        await deductStockForItems(req.businessId, document.items, session)
        const customer = await syncCustomerFromOrder(req.businessId, document, session)
        if (customer?.entityId) {
          document.customerEntityId = customer.entityId
        }
      }

      insertedOrders = await Order.insertMany(documents, { ordered: true, session })
    })

    for (const order of insertedOrders) {
      try {
        await sendCustomerMessageEvent({
          businessId: req.businessId,
          eventKey: 'orderConfirmation',
          order,
        })
      } catch (messageError) {
        console.error(`Bulk order messaging failed for ${order.orderId}:`, messageError.message)
      }
    }

    return res.status(201).json({
      success: true,
      message: `${insertedOrders.length} orders imported successfully.`,
      data: insertedOrders,
    })
  } catch (error) {
    return next(error)
  } finally {
    await session.endSession()
  }
}

const getOrders = async (req, res, next) => {
  try {
    const query = { businessId: req.businessId }

    if (req.query.status) {
      query.status = req.query.status
    }

    if (req.query.customerPhone) {
      query.customerPhone = req.query.customerPhone
    }

    const orders = await Order.find(query).sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    })
  } catch (error) {
    return next(error)
  }
}

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, businessId: req.businessId })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    return res.status(200).json({
      success: true,
      data: order,
    })
  } catch (error) {
    return next(error)
  }
}

const createCourierShipment = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, businessId: req.businessId })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    const business = await Business.findById(req.businessId).select('name phone address courierSettings')
    const courierSettings = business?.courierSettings

    if (!courierSettings?.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Courier integration is disabled.',
      })
    }

    if (order.courierShipmentId) {
      return res.status(409).json({
        success: false,
        message: 'A courier shipment has already been created for this order.',
      })
    }

    const syncResult = await syncOrderToCourier({
      order,
      business,
      settings: courierSettings,
    })

    order.courierShipmentId = syncResult.shipment.courierShipmentId
    order.trackingNumber = syncResult.shipment.trackingNumber || order.trackingNumber
    order.labelUrl = syncResult.shipment.labelUrl
    order.deliveryService = getCourierProviderLabel(courierSettings.provider)
    order.courierSyncStatus = 'SYNCED'
    order.courierSyncError = ''
    order.courierLastSyncedAt = new Date()

    if (order.status === 'PENDING') {
      order.status = 'DISPATCHED'
    }

    await order.save()

    try {
      await sendCustomerMessageEvent({
        businessId: req.businessId,
        eventKey: 'orderReady',
        order,
      })
    } catch (messageError) {
      console.error('Shipment messaging failed:', messageError.message)
    }

    return res.status(200).json({
      success: true,
      message: 'Shipment created successfully.',
      data: order,
    })
  } catch (error) {
    return next(error)
  }
}

const updateOrderStatus = async (req, res, next) => {
  try {
    const existingOrder = await Order.findOne({ _id: req.params.id, businessId: req.businessId })

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    const updatePayload = {
      businessId: req.businessId,
    }

    if (req.body.status) {
      updatePayload.status = req.body.status
    }

    if (req.body.trackingNumber !== undefined) {
      updatePayload.trackingNumber = req.body.trackingNumber
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      updatePayload,
      { new: true, runValidators: true }
    )

    if (updatePayload.status === 'DISPATCHED' && existingOrder.status !== 'DISPATCHED') {
      try {
        const business = await Business.findById(req.businessId).select('name phone address courierSettings')
        const courierSettings = business?.courierSettings

        if (courierSettings?.enabled && courierSettings?.autoDispatch) {
          const syncResult = await syncOrderToCourier({
            order,
            business,
            settings: courierSettings,
          })

          order.courierShipmentId = syncResult.shipment.courierShipmentId
          order.trackingNumber = syncResult.shipment.trackingNumber || order.trackingNumber
          order.labelUrl = syncResult.shipment.labelUrl
          order.deliveryService = getCourierProviderLabel(courierSettings.provider)
          order.courierSyncStatus = 'SYNCED'
          order.courierSyncError = ''
          order.courierLastSyncedAt = new Date()
          await order.save()
        } else {
          order.courierSyncStatus = 'SKIPPED'
          order.courierSyncError = courierSettings?.enabled
            ? 'Auto dispatch is disabled for courier sync.'
            : 'Courier integration is disabled.'
          order.courierLastSyncedAt = new Date()
          await order.save()
        }
      } catch (courierError) {
        order.courierSyncStatus = 'FAILED'
        order.courierSyncError = courierError.message
        order.courierLastSyncedAt = new Date()
        await order.save()
        console.error('Courier dispatch failed:', courierError.message)
      }

      try {
        await sendWhatsApp(req.businessId, order)
      } catch (whatsAppError) {
        console.error('WhatsApp dispatch failed:', whatsAppError.message)
      }

      try {
        await sendCustomerMessageEvent({
          businessId: req.businessId,
          eventKey: 'orderReady',
          order,
        })
      } catch (messageError) {
        console.error('Order ready messaging failed:', messageError.message)
      }
    }

    if (updatePayload.status === 'DELIVERED' && existingOrder.status !== 'DELIVERED') {
      try {
        await sendCustomerMessageEvent({
          businessId: req.businessId,
          eventKey: 'thankYou',
          order,
        })
      } catch (messageError) {
        console.error('Thank-you messaging failed:', messageError.message)
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully.',
      data: order,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  bulkCreateOrders,
  createCourierShipment,
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
}
