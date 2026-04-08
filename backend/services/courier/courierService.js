const CourierClient = require('./CourierClient')

const assertCourierSettingsReady = (settings = {}) => {
  if (!settings.enabled) {
    throw new Error('Courier integration is disabled for this workspace.')
  }

  if (!String(settings.baseUrl || '').trim()) {
    throw new Error('Courier base URL is required.')
  }

  if (!String(settings.apiToken || settings.apiKey || '').trim()) {
    throw new Error('Add a courier API token or API key before testing sync.')
  }
}

const buildShipmentPayload = (order, business, settings = {}) => ({
  provider: settings.provider || 'KOOMBIYO',
  orderId: order.orderId,
  customer: {
    name: order.customerName || '',
    phone: order.customerPhone || '',
    address: order.customerAddress || '',
    district: order.district || '',
  },
  sender: {
    name: settings.senderName || business?.name || '',
    phone: settings.senderPhone || business?.phone || '',
    address: settings.senderAddress || business?.address || '',
  },
  serviceType: settings.defaultServiceType || 'STANDARD',
  paymentMethod: order.paymentMethod || 'COD',
  amountToCollect: Number(order.codAmount || order.totalAmount || 0),
  deliveryFee: Number(order.deliveryFee || 0),
  notes: order.notes || '',
  items: Array.isArray(order.items)
    ? order.items.map((item) => ({
        description: item.description,
        qty: Number(item.qty || 0),
        unitPrice: Number(item.unitPrice || 0),
      }))
    : [],
})

const extractShipmentData = (responseData = {}, order) => ({
  courierShipmentId:
    responseData.shipmentId ||
    responseData.consignmentId ||
    responseData.reference ||
    responseData.id ||
    '',
  trackingNumber:
    responseData.trackingNumber ||
    responseData.tracking_no ||
    responseData.awb ||
    responseData.waybill ||
    order.trackingNumber ||
    '',
  labelUrl:
    responseData.labelUrl ||
    responseData.label_url ||
    responseData.label ||
    '',
})

const pingCourierConnection = async (settings = {}) => {
  const client = new CourierClient(settings)
  return client.ping()
}

const syncOrderToCourier = async ({ order, business, settings }) => {
  assertCourierSettingsReady(settings)

  const client = new CourierClient(settings)
  const payload = buildShipmentPayload(order, business, settings)
  const response = await client.createShipment(payload)
  const shipment = extractShipmentData(response.data, order)

  return {
    request: payload,
    response: response.data,
    shipment,
  }
}

module.exports = {
  assertCourierSettingsReady,
  buildShipmentPayload,
  pingCourierConnection,
  syncOrderToCourier,
}
