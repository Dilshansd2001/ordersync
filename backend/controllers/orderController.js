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

const generateNextOrderId = async (businessId) => {
  const latestOrder = await Order.findOne({ businessId }).sort({ createdAt: -1, _id: -1 })
  const latestSequence = latestOrder?.orderId ? Number(latestOrder.orderId.replace('ORD-', '')) || 1000 : 1000

  return `ORD-${latestSequence + 1}`
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

const deductStockForItems = async (businessId, items = []) => {
  const inventoryItems = items.filter((item) => item.productId && Number(item.qty) > 0)

  if (!inventoryItems.length) {
    return
  }

  const productIds = inventoryItems.map((item) => item.productId)
  const products = await Product.find({ businessId, _id: { $in: productIds } })
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
    }))
  )
}

const syncCustomerFromOrder = async (businessId, orderPayload) => {
  const customerName = String(orderPayload.customerName || '').trim()
  const customerPhone = String(orderPayload.customerPhone || '').trim()

  if (!customerName || !customerPhone) {
    return null
  }

  const existingCustomer = await Customer.findOne({
    businessId,
    phone: customerPhone,
  })

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
    await existingCustomer.save()

    return existingCustomer
  }

  return Customer.create({
    businessId,
    name: customerName,
    phone: customerPhone,
    whatsappNumber: customerPhone,
    addressLine: orderPayload.customerAddress || '',
    district: orderPayload.district || '',
    loyaltyStatus: 'ACTIVE',
    totalSpend: Number(orderPayload.totalAmount || 0),
    orderCount: 1,
  })
}

const createOrder = async (req, res, next) => {
  try {
    const normalizedOrder = normalizeOrderPayload(
      req.body,
      req.businessId,
      await generateNextOrderId(req.businessId)
    )

    await deductStockForItems(req.businessId, normalizedOrder.items)
    const customer = await syncCustomerFromOrder(req.businessId, normalizedOrder)
    if (customer?.entityId) {
      normalizedOrder.customerEntityId = customer.entityId
    }
    const order = await Order.create(normalizedOrder)

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
  }
}

const bulkCreateOrders = async (req, res, next) => {
  try {
    const ordersArray = Array.isArray(req.body.orders) ? req.body.orders : []

    if (!ordersArray.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one order is required for bulk upload.',
      })
    }

    const latestOrder = await Order.findOne({ businessId: req.businessId }).sort({ createdAt: -1, _id: -1 })
    let nextSequence = latestOrder?.orderId
      ? Number(latestOrder.orderId.replace('ORD-', '')) || 1000
      : 1000

    const documents = ordersArray.map((payload) => {
      nextSequence += 1
      return normalizeOrderPayload(payload, req.businessId, `ORD-${nextSequence}`)
    })

    for (const document of documents) {
      await deductStockForItems(req.businessId, document.items)
      const customer = await syncCustomerFromOrder(req.businessId, document)
      if (customer?.entityId) {
        document.customerEntityId = customer.entityId
      }
    }

    const insertedOrders = await Order.insertMany(documents, { ordered: true })

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
