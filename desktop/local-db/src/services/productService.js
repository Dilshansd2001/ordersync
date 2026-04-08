const { createRepositories } = require('../repositories')
const { newId } = require('../utils/ids')
const { nowIso } = require('../utils/time')
const { buildQueueItem } = require('./serviceUtils')

class ProductService {
  constructor(db) {
    this.db = db
    this.repositories = createRepositories(db)
  }

  list(filters = {}) {
    return this.repositories.products.list(filters)
  }

  create(payload) {
    const { products, syncQueue } = this.repositories

    return this.db.transaction((input) => {
      const timestamp = nowIso()
      const stockCount = Number(input.stock_count || 0)
      const isAvailable =
        input.is_available === undefined || input.is_available === null
          ? stockCount > 0
          : input.is_available !== false && input.is_available !== 0
      const product = {
        entity_id: input.entity_id || newId(),
        cloud_id: null,
        sku: input.sku,
        name: input.name,
        category: input.category || '',
        buying_price: Number(input.buying_price || 0),
        selling_price: Number(input.selling_price || 0),
        stock_count: stockCount,
        image_url: input.image_url || '',
        is_available: isAvailable ? 1 : 0,
        notes: input.notes || '',
        version: 1,
        sync_status: 'pending_sync',
        updated_at: timestamp,
        last_synced_at: null,
        deleted_at: null,
        created_at: timestamp,
      }

      const created = products.insert(product)
      syncQueue.enqueue(
        buildQueueItem({
          entityType: 'product',
          entityId: created.entity_id,
          operation: 'create',
          payload: created,
        })
      )

      return created
    })(payload)
  }

  update({ entityId, data }) {
    const { products, syncQueue } = this.repositories

    return this.db.transaction((input) => {
      const existing = products.getByEntityId(input.entityId)
      if (!existing || existing.deleted_at) {
        throw new Error('Product not found.')
      }

      const stockCount = Number(input.data.stock_count ?? existing.stock_count ?? 0)
      const isAvailable =
        input.data.is_available === undefined || input.data.is_available === null
          ? stockCount > 0
          : input.data.is_available !== false && input.data.is_available !== 0

      const updated = products.update({
        entity_id: input.entityId,
        sku: input.data.sku ?? existing.sku,
        name: input.data.name ?? existing.name,
        category: input.data.category ?? existing.category,
        buying_price: Number(input.data.buying_price ?? existing.buying_price ?? 0),
        selling_price: Number(input.data.selling_price ?? existing.selling_price ?? 0),
        stock_count: stockCount,
        image_url: input.data.image_url ?? existing.image_url,
        is_available: isAvailable ? 1 : 0,
        notes: input.data.notes ?? existing.notes,
      })

      syncQueue.enqueue(
        buildQueueItem({
          entityType: 'product',
          entityId: updated.entity_id,
          operation: 'update',
          payload: updated,
        })
      )

      return updated
    })({ entityId, data })
  }

  remove(entityId) {
    const { products, syncQueue } = this.repositories

    return this.db.transaction((targetEntityId) => {
      const existing = products.getByEntityId(targetEntityId)
      if (!existing || existing.deleted_at) {
        throw new Error('Product not found.')
      }

      products.softDelete(targetEntityId)
      const deleted = products.getByEntityId(targetEntityId)

      syncQueue.enqueue(
        buildQueueItem({
          entityType: 'product',
          entityId: targetEntityId,
          operation: 'delete',
          payload: deleted,
        })
      )

      return deleted
    })(entityId)
  }
}

module.exports = {
  ProductService,
}
