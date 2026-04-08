const { createRepositories } = require('../repositories')
const { newId } = require('../utils/ids')
const { nowIso } = require('../utils/time')
const { buildQueueItem } = require('./serviceUtils')

class CustomerService {
  constructor(db) {
    this.db = db
    this.repositories = createRepositories(db)
  }

  list(filters = {}) {
    return this.repositories.customers.list(filters)
  }

  create(payload) {
    const { customers, syncQueue } = this.repositories

    return this.db.transaction((input) => {
      const timestamp = nowIso()
      const customer = {
        entity_id: input.entity_id || newId(),
        cloud_id: null,
        name: input.name,
        phone: input.phone || '',
        whatsapp_number: input.whatsapp_number || '',
        email: input.email || '',
        address_line: input.address_line || '',
        nearest_city: input.nearest_city || '',
        district: input.district || '',
        loyalty_status: input.loyalty_status || 'ACTIVE',
        notes: input.notes || '',
        version: 1,
        sync_status: 'pending_sync',
        updated_at: timestamp,
        last_synced_at: null,
        deleted_at: null,
        created_at: timestamp,
      }

      const created = customers.insert(customer)
      syncQueue.enqueue(
        buildQueueItem({
          entityType: 'customer',
          entityId: created.entity_id,
          operation: 'create',
          payload: created,
        })
      )

      return created
    })(payload)
  }

  update({ entityId, data }) {
    const { customers, syncQueue } = this.repositories

    return this.db.transaction((input) => {
      const existing = customers.getByEntityId(input.entityId)
      if (!existing || existing.deleted_at) {
        throw new Error('Customer not found.')
      }

      const updated = customers.update({
        entity_id: input.entityId,
        name: input.data.name ?? existing.name,
        phone: input.data.phone ?? existing.phone,
        whatsapp_number: input.data.whatsapp_number ?? existing.whatsapp_number,
        email: input.data.email ?? existing.email,
        address_line: input.data.address_line ?? existing.address_line,
        nearest_city: input.data.nearest_city ?? existing.nearest_city,
        district: input.data.district ?? existing.district,
        loyalty_status: input.data.loyalty_status ?? existing.loyalty_status,
        notes: input.data.notes ?? existing.notes,
      })

      syncQueue.enqueue(
        buildQueueItem({
          entityType: 'customer',
          entityId: updated.entity_id,
          operation: 'update',
          payload: updated,
        })
      )

      return updated
    })({ entityId, data })
  }

  remove(entityId) {
    const { customers, syncQueue } = this.repositories

    return this.db.transaction((targetEntityId) => {
      const existing = customers.getByEntityId(targetEntityId)
      if (!existing || existing.deleted_at) {
        throw new Error('Customer not found.')
      }

      customers.softDelete(targetEntityId)
      const deleted = customers.getByEntityId(targetEntityId)

      syncQueue.enqueue(
        buildQueueItem({
          entityType: 'customer',
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
  CustomerService,
}
