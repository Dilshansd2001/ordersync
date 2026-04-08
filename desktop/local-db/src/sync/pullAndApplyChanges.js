const { newId } = require('../utils/ids')
const { nowIso } = require('../utils/time')

const SYNC_METADATA_KEYS = {
  lastPullStartedAt: '__sync.last_pull_started_at',
  lastPullCompletedAt: '__sync.last_pull_completed_at',
}

const getInternalSetting = (db, settingKey) => {
  const row = db
    .prepare(
      `SELECT setting_value
       FROM settings
       WHERE setting_key = ?
       LIMIT 1`
    )
    .get(settingKey)

  return row?.setting_value || null
}

const setInternalSetting = (db, settingKey, settingValue) => {
  const existing = db
    .prepare(
      `SELECT entity_id
       FROM settings
       WHERE setting_key = ?
       LIMIT 1`
    )
    .get(settingKey)

  const timestamp = nowIso()

  db.prepare(
    `INSERT INTO settings (
      entity_id, cloud_id, setting_key, setting_value, value_type,
      version, sync_status, updated_at, last_synced_at, deleted_at, created_at
    ) VALUES (?, NULL, ?, ?, 'string', 1, 'synced', ?, ?, NULL, ?)
    ON CONFLICT(setting_key) DO UPDATE SET
      setting_value = excluded.setting_value,
      value_type = excluded.value_type,
      version = settings.version + 1,
      sync_status = 'synced',
      updated_at = excluded.updated_at,
      last_synced_at = excluded.last_synced_at,
      deleted_at = NULL`
  ).run(existing?.entity_id || newId(), settingKey, settingValue, timestamp, timestamp, timestamp)
}

const hasUnsyncedLocalChanges = (localRecord, remoteUpdatedAt) => {
  if (!localRecord) {
    return false
  }

  if (!['local_only', 'pending_sync', 'sync_failed', 'conflict'].includes(localRecord.sync_status)) {
    return false
  }

  if (!localRecord.last_synced_at) {
    return localRecord.sync_status !== 'synced'
  }

  return localRecord.updated_at > localRecord.last_synced_at && remoteUpdatedAt > localRecord.last_synced_at
}

const markConflict = (db, tableName, entityId) => {
  db.prepare(
    `UPDATE ${tableName}
     SET sync_status = 'conflict',
         updated_at = ?
     WHERE entity_id = ?`
  ).run(nowIso(), entityId)
}

const normalizeSqliteValue = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return value
}

const applySoftDelete = (db, tableName, payload, serverTimestamp) => {
  db.prepare(
    `UPDATE ${tableName}
     SET cloud_id = COALESCE(?, cloud_id),
         version = ?,
         sync_status = 'synced',
         updated_at = ?,
         last_synced_at = ?,
         deleted_at = ?
     WHERE entity_id = ?`
  ).run(
    payload.cloud_id || null,
    Number(payload.version || 1),
    payload.updated_at || serverTimestamp,
    serverTimestamp,
    payload.deleted_at || payload.updated_at || serverTimestamp,
    payload.entity_id
  )
}

const upsertFlatEntity = (db, tableName, payload, columns, serverTimestamp) => {
  const localRecord = db
    .prepare(`SELECT * FROM ${tableName} WHERE entity_id = ? LIMIT 1`)
    .get(payload.entity_id)

  if (hasUnsyncedLocalChanges(localRecord, payload.updated_at || serverTimestamp)) {
    markConflict(db, tableName, payload.entity_id)
    return { applied: false, conflict: true }
  }

  const entityId = localRecord?.entity_id || payload.entity_id || newId()
  const timestamp = payload.updated_at || serverTimestamp
  const columnNames = [
    'entity_id',
    'cloud_id',
    ...columns,
    'version',
    'sync_status',
    'updated_at',
    'last_synced_at',
    'deleted_at',
    'created_at',
  ]

  const placeholders = columnNames.map(() => '?').join(', ')
  const updateColumns = [
    'cloud_id',
    ...columns,
    'version',
    'sync_status',
    'updated_at',
    'last_synced_at',
    'deleted_at',
  ]
    .map((column) => `${column} = excluded.${column}`)
    .join(', ')

  const values = [
    entityId,
    payload.cloud_id || null,
    ...columns.map((column) => payload[column] ?? null),
    Number(payload.version || 1),
    'synced',
    timestamp,
    serverTimestamp,
    payload.deleted_at || null,
    payload.created_at || timestamp,
  ].map(normalizeSqliteValue)

  db.prepare(
    `INSERT INTO ${tableName} (${columnNames.join(', ')})
     VALUES (${placeholders})
     ON CONFLICT(entity_id) DO UPDATE SET ${updateColumns}`
  ).run(...values)

  return { applied: true, conflict: false }
}

const applyPulledOrder = (db, payload, serverTimestamp) => {
  const localOrder = db.prepare('SELECT * FROM orders WHERE entity_id = ? LIMIT 1').get(payload.entity_id)

  if (hasUnsyncedLocalChanges(localOrder, payload.updated_at || serverTimestamp)) {
    markConflict(db, 'orders', payload.entity_id)
    db.prepare(
      `UPDATE order_items
       SET sync_status = 'conflict',
           updated_at = ?
       WHERE order_entity_id = ?`
    ).run(nowIso(), payload.entity_id)

    return { applied: false, conflict: true }
  }

  const orderTimestamp = payload.updated_at || serverTimestamp

  db.prepare(
    `INSERT INTO orders (
      entity_id, cloud_id, order_number, customer_entity_id, replacement_for_order_entity_id,
      status, payment_method, customer_name, customer_phone, customer_address, district,
      delivery_service, tracking_number, courier_shipment_id, courier_sync_status,
      courier_sync_error, courier_last_synced_at, label_url, notes, subtotal_amount,
      delivery_fee, total_amount, cod_amount, is_replacement_order, version, sync_status,
      updated_at, last_synced_at, deleted_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?, ?)
    ON CONFLICT(entity_id) DO UPDATE SET
      cloud_id = excluded.cloud_id,
      order_number = excluded.order_number,
      customer_entity_id = excluded.customer_entity_id,
      replacement_for_order_entity_id = excluded.replacement_for_order_entity_id,
      status = excluded.status,
      payment_method = excluded.payment_method,
      customer_name = excluded.customer_name,
      customer_phone = excluded.customer_phone,
      customer_address = excluded.customer_address,
      district = excluded.district,
      delivery_service = excluded.delivery_service,
      tracking_number = excluded.tracking_number,
      courier_shipment_id = excluded.courier_shipment_id,
      courier_sync_status = excluded.courier_sync_status,
      courier_sync_error = excluded.courier_sync_error,
      courier_last_synced_at = excluded.courier_last_synced_at,
      label_url = excluded.label_url,
      notes = excluded.notes,
      subtotal_amount = excluded.subtotal_amount,
      delivery_fee = excluded.delivery_fee,
      total_amount = excluded.total_amount,
      cod_amount = excluded.cod_amount,
      is_replacement_order = excluded.is_replacement_order,
      version = excluded.version,
      sync_status = 'synced',
      updated_at = excluded.updated_at,
      last_synced_at = excluded.last_synced_at,
      deleted_at = excluded.deleted_at`
  ).run(
    ...[
      payload.entity_id,
      payload.cloud_id || null,
      payload.order_number,
      payload.customer_entity_id || null,
      payload.replacement_for_order_entity_id || null,
      payload.status,
      payload.payment_method || 'COD',
      payload.customer_name || null,
      payload.customer_phone || null,
      payload.customer_address || null,
      payload.district || null,
      payload.delivery_service || null,
      payload.tracking_number || null,
      payload.courier_shipment_id || null,
      payload.courier_sync_status || 'PENDING',
      payload.courier_sync_error || null,
      payload.courier_last_synced_at || null,
      payload.label_url || null,
      payload.notes || null,
      Number(payload.subtotal_amount || 0),
      Number(payload.delivery_fee || 0),
      Number(payload.total_amount || 0),
      Number(payload.cod_amount || 0),
      Number(payload.is_replacement_order || 0),
      Number(payload.version || 1),
      orderTimestamp,
      serverTimestamp,
      payload.deleted_at || null,
      payload.created_at || orderTimestamp,
    ].map(normalizeSqliteValue)
  )

  if (payload.deleted_at) {
    db.prepare(
      `UPDATE order_items
       SET sync_status = 'synced',
           updated_at = ?,
           last_synced_at = ?,
           deleted_at = COALESCE(deleted_at, ?)
       WHERE order_entity_id = ?`
    ).run(orderTimestamp, serverTimestamp, payload.deleted_at, payload.entity_id)

    return { applied: true, conflict: false }
  }

  const incomingItems = Array.isArray(payload.items) ? payload.items : []
  const incomingItemIds = incomingItems.map((item) => item.entity_id)

  for (const item of incomingItems) {
    db.prepare(
      `INSERT INTO order_items (
        entity_id, order_entity_id, product_entity_id, description, qty, unit_price,
        line_total, version, sync_status, updated_at, last_synced_at, deleted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?, ?)
      ON CONFLICT(entity_id) DO UPDATE SET
        order_entity_id = excluded.order_entity_id,
        product_entity_id = excluded.product_entity_id,
        description = excluded.description,
        qty = excluded.qty,
        unit_price = excluded.unit_price,
        line_total = excluded.line_total,
        version = excluded.version,
        sync_status = 'synced',
        updated_at = excluded.updated_at,
        last_synced_at = excluded.last_synced_at,
        deleted_at = excluded.deleted_at`
    ).run(
      ...[
        item.entity_id,
        payload.entity_id,
        item.product_entity_id || null,
        item.description,
        Number(item.qty || 0),
        Number(item.unit_price || 0),
        Number(item.line_total || Number(item.qty || 0) * Number(item.unit_price || 0)),
        Number(item.version || 1),
        item.updated_at || orderTimestamp,
        serverTimestamp,
        item.deleted_at || null,
        item.created_at || item.updated_at || orderTimestamp,
      ].map(normalizeSqliteValue)
    )
  }

  db.prepare(
    `UPDATE order_items
     SET sync_status = 'synced',
         updated_at = ?,
         last_synced_at = ?,
         deleted_at = COALESCE(deleted_at, ?)
     WHERE order_entity_id = ?
       AND entity_id NOT IN (${incomingItemIds.length ? incomingItemIds.map(() => '?').join(', ') : "''"})`
  ).run(
    orderTimestamp,
    serverTimestamp,
    orderTimestamp,
    payload.entity_id,
    ...incomingItemIds
  )

  return { applied: true, conflict: false }
}

const applyChange = (db, change, serverTimestamp) => {
  const payload = change.payload || {}

  switch (change.entity_type) {
    case 'product':
      return upsertFlatEntity(
        db,
        'products',
        payload,
        [
          'sku',
          'name',
          'category',
          'buying_price',
          'selling_price',
          'stock_count',
          'image_url',
          'is_available',
          'notes',
        ],
        serverTimestamp
      )
    case 'customer':
      return upsertFlatEntity(
        db,
        'customers',
        payload,
        ['name', 'phone', 'whatsapp_number', 'email', 'address_line', 'nearest_city', 'district', 'loyalty_status', 'notes'],
        serverTimestamp
      )
    case 'order':
      return applyPulledOrder(db, payload, serverTimestamp)
    case 'order_action':
      return upsertFlatEntity(
        db,
        'order_actions',
        payload,
        ['order_entity_id', 'action_type', 'reason', 'replacement_order_entity_id', 'affects_inventory'],
        serverTimestamp
      )
    case 'inventory_movement':
      return upsertFlatEntity(
        db,
        'inventory_movements',
        payload,
        ['product_entity_id', 'order_entity_id', 'order_action_entity_id', 'movement_type', 'quantity_delta', 'reason'],
        serverTimestamp
      )
    case 'expense':
      return upsertFlatEntity(
        db,
        'expenses',
        payload,
        ['category', 'amount', 'description', 'expense_date'],
        serverTimestamp
      )
    case 'setting':
      return upsertFlatEntity(
        db,
        'settings',
        payload,
        ['setting_key', 'setting_value', 'value_type'],
        serverTimestamp
      )
    default:
      return { applied: false, skipped: true }
  }
}

const pullAndApplyChanges = async ({
  db,
  apiClient,
  tenantId,
  pageSize = 100,
}) => {
  const startedAt = nowIso()
  const lastCompletedAt = getInternalSetting(db, SYNC_METADATA_KEYS.lastPullCompletedAt)

  setInternalSetting(db, SYNC_METADATA_KEYS.lastPullStartedAt, startedAt)

  let page = 1
  let hasMore = true
  let applied = 0
  let conflicts = 0

  while (hasMore) {
    const response = await apiClient.pullChanges({
      tenantId,
      updatedSince: lastCompletedAt,
      limit: pageSize,
      page,
    })

    const changes = Array.isArray(response.changes) ? response.changes : []
    const serverTimestamp = response.server_time || nowIso()

    db.transaction(() => {
      for (const change of changes) {
        const result = applyChange(db, change, serverTimestamp)
        if (result.conflict) {
          conflicts += 1
        } else if (result.applied) {
          applied += 1
        }
      }
    })()

    hasMore = Boolean(response.has_more)
    page += 1
  }

  setInternalSetting(db, SYNC_METADATA_KEYS.lastPullCompletedAt, startedAt)

  return {
    applied,
    conflicts,
    updatedSince: lastCompletedAt,
    completedAt: startedAt,
  }
}

module.exports = {
  SYNC_METADATA_KEYS,
  applyPulledOrder,
  pullAndApplyChanges,
}
