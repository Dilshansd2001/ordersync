const { BaseRepository } = require('./BaseRepository')
const { nowIso } = require('../utils/time')

class ExpensesRepository extends BaseRepository {
  constructor(db) {
    super(db, 'expenses')
  }

  list(filters = {}) {
    const clauses = ['deleted_at IS NULL']
    const params = []

    if (filters.category) {
      clauses.push('category = ?')
      params.push(filters.category)
    }

    if (filters.from) {
      clauses.push('expense_date >= ?')
      params.push(filters.from)
    }

    if (filters.to) {
      clauses.push('expense_date <= ?')
      params.push(`${filters.to}T23:59:59`)
    }

    const whereClause = clauses.join(' AND ')

    return this.db
      .prepare(
        `SELECT *
         FROM expenses
         WHERE ${whereClause}
         ORDER BY expense_date DESC, created_at DESC`
      )
      .all(...params)
  }

  insert(expense) {
    this.db
      .prepare(
        `INSERT INTO expenses (
          entity_id, cloud_id, category, amount, description, expense_date,
          version, sync_status, updated_at, last_synced_at, deleted_at, created_at
        ) VALUES (
          @entity_id, @cloud_id, @category, @amount, @description, @expense_date,
          @version, @sync_status, @updated_at, @last_synced_at, @deleted_at, @created_at
        )`
      )
      .run(expense)

    return this.getByEntityId(expense.entity_id)
  }

  update(expense) {
    const updatedAt = nowIso()
    this.db
      .prepare(
        `UPDATE expenses
         SET category = @category,
             amount = @amount,
             description = @description,
             expense_date = @expense_date,
             version = version + 1,
             sync_status = 'pending_sync',
             updated_at = @updated_at
         WHERE entity_id = @entity_id`
      )
      .run({
        ...expense,
        updated_at: updatedAt,
      })

    return this.getByEntityId(expense.entity_id)
  }
}

module.exports = {
  ExpensesRepository,
}
