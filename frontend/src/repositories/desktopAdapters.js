const toBoolean = (value, fallback = true) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') {
      return true
    }
    if (normalized === 'false') {
      return false
    }
  }

  return fallback
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const formDataToObject = (payload) => {
  if (!(payload instanceof FormData)) {
    return payload
  }

  return Object.fromEntries(payload.entries())
}

export const normalizeDesktopProductPayload = (payload) => {
  const source = formDataToObject(payload) || {}
  const normalizedImageUrl =
    typeof source.image_url === 'string'
      ? source.image_url
      : typeof source.image === 'string'
        ? source.image
        : ''

  return {
    entity_id: source.entity_id || source.entityId || source._id || '',
    sku: source.sku || '',
    name: source.name || '',
    category: source.category || '',
    buying_price: toNumber(source.buying_price ?? source.buyingPrice, 0),
    selling_price: toNumber(source.selling_price ?? source.sellingPrice, 0),
    stock_count: toNumber(source.stock_count ?? source.stockCount, 0),
    image_url: normalizedImageUrl,
    is_available: toBoolean(source.is_available ?? source.isAvailable, true),
    notes: source.notes || '',
  }
}

export const normalizeDesktopCustomerPayload = (payload) => {
  const source = formDataToObject(payload) || {}

  return {
    entity_id: source.entity_id || source.entityId || source._id || '',
    name: source.name || '',
    phone: source.phone || '',
    whatsapp_number: source.whatsapp_number ?? source.whatsappNumber ?? '',
    email: source.email || '',
    address_line: source.address_line ?? source.addressLine ?? '',
    nearest_city: source.nearest_city ?? source.nearestCity ?? '',
    district: source.district || '',
    loyalty_status: source.loyalty_status ?? source.loyaltyStatus ?? 'ACTIVE',
    notes: source.notes || '',
  }
}

export const normalizeDesktopProductRecord = (record) => {
  if (!record) {
    return record
  }

  return {
    ...record,
    _id: record._id || record.entity_id || record.cloud_id,
    entityId: record.entityId || record.entity_id || null,
    buyingPrice: toNumber(record.buyingPrice ?? record.buying_price, 0),
    sellingPrice: toNumber(record.sellingPrice ?? record.selling_price, 0),
    stockCount: toNumber(record.stockCount ?? record.stock_count, 0),
    image: record.image || record.image_url || '',
    isAvailable: toBoolean(record.isAvailable ?? record.is_available, true),
    createdAt: record.createdAt || record.created_at || null,
    updatedAt: record.updatedAt || record.updated_at || null,
  }
}

export const normalizeDesktopCustomerRecord = (record) => {
  if (!record) {
    return record
  }

  return {
    ...record,
    _id: record._id || record.entity_id || record.cloud_id,
    entityId: record.entityId || record.entity_id || null,
    whatsappNumber: record.whatsappNumber || record.whatsapp_number || '',
    addressLine: record.addressLine || record.address_line || '',
    nearestCity: record.nearestCity || record.nearest_city || '',
    loyaltyStatus: record.loyaltyStatus || record.loyalty_status || 'ACTIVE',
    orderCount: toNumber(record.orderCount, 0),
    totalSpend: toNumber(record.totalSpend, 0),
    createdAt: record.createdAt || record.created_at || null,
    updatedAt: record.updatedAt || record.updated_at || null,
  }
}

export const normalizeDesktopExpensePayload = (payload) => {
  const source = formDataToObject(payload) || {}

  return {
    entity_id: source.entity_id || source.entityId || source._id || '',
    category: source.category || 'Other',
    amount: toNumber(source.amount, 0),
    description: source.description || '',
    expense_date: source.expense_date ?? source.date ?? '',
  }
}

export const normalizeDesktopExpenseRecord = (record) => {
  if (!record) {
    return record
  }

  return {
    ...record,
    _id: record._id || record.entity_id || record.cloud_id,
    entityId: record.entityId || record.entity_id || null,
    amount: toNumber(record.amount, 0),
    date: record.date || record.expense_date || null,
    createdAt: record.createdAt || record.created_at || null,
    updatedAt: record.updatedAt || record.updated_at || null,
  }
}

const normalizeDesktopOrderItemRecord = (item) => ({
  ...item,
  _id: item?._id || item?.entity_id || item?.cloud_id,
  entityId: item?.entityId || item?.entity_id || null,
  productEntityId: item?.productEntityId || item?.product_entity_id || null,
  unitPrice: toNumber(item?.unitPrice ?? item?.unit_price, 0),
  qty: toNumber(item?.qty, 0),
})

export const normalizeDesktopOrderPayload = (payload) => {
  const source = formDataToObject(payload) || {}

  return {
    entity_id: source.entity_id || source.entityId || source._id || '',
    order_number: source.order_number || source.orderId || '',
    customer_entity_id: source.customer_entity_id || source.customerEntityId || '',
    payment_method: source.payment_method || source.paymentMethod || 'COD',
    customer_name: source.customer_name || source.customerName || '',
    customer_phone: source.customer_phone || source.customerPhone || '',
    customer_address: source.customer_address || source.customerAddress || '',
    district: source.district || '',
    delivery_service: source.delivery_service || source.deliveryService || 'Koombiyo',
    notes: source.notes || '',
    delivery_fee: toNumber(source.delivery_fee ?? source.deliveryFee, 0),
    total_amount: toNumber(source.total_amount ?? source.totalAmount, 0),
    cod_amount: toNumber(source.cod_amount ?? source.codAmount, 0),
    items: Array.isArray(source.items)
      ? source.items.map((item) => ({
          entity_id: item.entity_id || item.entityId || '',
          product_entity_id: item.product_entity_id || item.productEntityId || item.productId || '',
          description: item.description || '',
          qty: toNumber(item.qty, 0),
          unit_price: toNumber(item.unit_price ?? item.unitPrice, 0),
        }))
      : [],
  }
}

export const normalizeDesktopOrderRecord = (record) => {
  if (!record) {
    return record
  }

  return {
    ...record,
    _id: record._id || record.entity_id || record.cloud_id,
    entityId: record.entityId || record.entity_id || null,
    orderId: record.orderId || record.order_number || '',
    customerEntityId: record.customerEntityId || record.customer_entity_id || null,
    paymentMethod: record.paymentMethod || record.payment_method || 'COD',
    customerName: record.customerName || record.customer_name || '',
    customerPhone: record.customerPhone || record.customer_phone || '',
    customerAddress: record.customerAddress || record.customer_address || '',
    deliveryService: record.deliveryService || record.delivery_service || 'Koombiyo',
    trackingNumber: record.trackingNumber || record.tracking_number || '',
    courierShipmentId: record.courierShipmentId || record.courier_shipment_id || '',
    totalAmount: toNumber(record.totalAmount ?? record.total_amount, 0),
    deliveryFee: toNumber(record.deliveryFee ?? record.delivery_fee, 0),
    codAmount: toNumber(record.codAmount ?? record.cod_amount, 0),
    courierSyncStatus: record.courierSyncStatus || record.courier_sync_status || 'PENDING',
    courierSyncError: record.courierSyncError || record.courier_sync_error || '',
    courierLastSyncedAt: record.courierLastSyncedAt || record.courier_last_synced_at || null,
    labelUrl: record.labelUrl || record.label_url || '',
    createdAt: record.createdAt || record.created_at || null,
    updatedAt: record.updatedAt || record.updated_at || null,
    items: Array.isArray(record.items) ? record.items.map(normalizeDesktopOrderItemRecord) : [],
  }
}
