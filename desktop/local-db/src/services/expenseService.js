const { createRepositories } = require('../repositories')
const { newId } = require('../utils/ids')
const { nowIso } = require('../utils/time')
const { buildQueueItem } = require('./serviceUtils')

class ExpenseService {
  constructor(db) {
    this.db = db
    this.repositories = createRepositories(db)
  }

  list(filters = {}) {
    return this.repositories.expenses.list(filters)
  }

  create(payload) {
    const { expenses, syncQueue } = this.repositories

    return this.db.transaction((input) => {
      const timestamp = nowIso()
      const expense = {
        entity_id: input.entity_id || newId(),
        cloud_id: null,
        category: input.category,
        amount: Number(input.amount || 0),
        description: input.description || '',
        expense_date: input.expense_date || input.date || timestamp,
        version: 1,
        sync_status: 'pending_sync',
        updated_at: timestamp,
        last_synced_at: null,
        deleted_at: null,
        created_at: timestamp,
      }

      const created = expenses.insert(expense)
      syncQueue.enqueue(
        buildQueueItem({
          entityType: 'expense',
          entityId: created.entity_id,
          operation: 'create',
          payload: created,
        })
      )

      return created
    })(payload)
  }

  remove(entityId) {
    const { expenses, syncQueue } = this.repositories

    return this.db.transaction((targetEntityId) => {
      const existing = expenses.getByEntityId(targetEntityId)
      if (!existing || existing.deleted_at) {
        throw new Error('Expense not found.')
      }

      expenses.softDelete(targetEntityId)
      const deleted = expenses.getByEntityId(targetEntityId)

      syncQueue.enqueue(
        buildQueueItem({
          entityType: 'expense',
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
  ExpenseService,
}
