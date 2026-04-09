const CourierClient = require('./CourierClient')
const { getCourierProviderConfig, normalizeCourierProvider } = require('./providers')

const hasCredential = (settings = {}) =>
  Boolean(String(settings.apiToken || settings.apiKey || '').trim())

const buildNormalizedShipmentPayload = (order, business, settings = {}) => ({
  provider: normalizeCourierProvider(settings.provider),
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

const extractGenericShipmentData = (responseData = {}, order) => ({
  courierShipmentId:
    responseData.shipmentId ||
    responseData.consignmentId ||
    responseData.reference ||
    responseData.id ||
    responseData.orderId ||
    '',
  trackingNumber:
    responseData.trackingNumber ||
    responseData.tracking_no ||
    responseData.awb ||
    responseData.waybill ||
    responseData.airwayBillNumber ||
    order.trackingNumber ||
    '',
  labelUrl:
    responseData.labelUrl ||
    responseData.label_url ||
    responseData.label ||
    responseData.awbUrl ||
    '',
})

class BaseCourierAdapter {
  constructor(provider) {
    this.provider = normalizeCourierProvider(provider)
    this.config = getCourierProviderConfig(this.provider)
  }

  assertReady(settings = {}) {
    if (!settings.enabled) {
      throw new Error('Courier integration is disabled for this workspace.')
    }

    if (!String(settings.baseUrl || '').trim()) {
      throw new Error(`${this.config.label} base URL is required.`)
    }

    if (!hasCredential(settings)) {
      throw new Error(`Add a ${this.config.label} API token or API key before testing sync.`)
    }
  }

  createClient(settings = {}) {
    return new CourierClient(settings, this.config)
  }

  buildShipmentPayload(order, business, settings = {}) {
    return buildNormalizedShipmentPayload(order, business, settings)
  }

  extractShipmentData(responseData = {}, order) {
    return extractGenericShipmentData(responseData, order)
  }

  async ping(settings = {}) {
    this.assertReady(settings)
    const client = this.createClient(settings)
    return client.ping()
  }

  async createShipment({ order, business, settings }) {
    this.assertReady(settings)
    const client = this.createClient(settings)
    const payload = this.buildShipmentPayload(order, business, settings)
    const response = await client.createShipment(payload)

    return {
      request: payload,
      response: response.data,
      shipment: this.extractShipmentData(response.data, order),
    }
  }
}

class KoombiyoCourierAdapter extends BaseCourierAdapter {
  constructor() {
    super('KOOMBIYO')
  }
}

class DexCourierAdapter extends BaseCourierAdapter {
  constructor() {
    super('DEX')
  }

  buildShipmentPayload(order, business, settings = {}) {
    const payload = super.buildShipmentPayload(order, business, settings)

    return {
      ...payload,
      merchantReference: payload.orderId,
      delivery: {
        serviceType: payload.serviceType,
        paymentMethod: payload.paymentMethod,
        amountToCollect: payload.amountToCollect,
      },
    }
  }
}

class CustomCourierAdapter extends BaseCourierAdapter {
  constructor() {
    super('CUSTOM')
  }
}

const createCourierAdapter = (provider) => {
  const normalized = normalizeCourierProvider(provider)

  if (normalized === 'KOOMBIYO') {
    return new KoombiyoCourierAdapter()
  }

  if (normalized === 'DEX') {
    return new DexCourierAdapter()
  }

  if (normalized === 'CUSTOM') {
    return new CustomCourierAdapter()
  }

  throw new Error(`${getCourierProviderConfig(normalized).label} API adapter is not implemented yet.`)
}

module.exports = {
  createCourierAdapter,
  extractGenericShipmentData,
}
