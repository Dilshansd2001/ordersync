const { BaseRepository } = require('./BaseRepository')
const { nowIso } = require('../utils/time')

class CustomersRepository extends BaseRepository {
  constructor(db) {
    super(db, 'customers')
  }

  list(filters = {}) {
    const clauses = ['deleted_at IS NULL']
    const params = []
    const search = filters.search ? `%${String(filters.search).trim().toLowerCase()}%` : null
    const page = Math.max(Number(filters.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(filters.pageSize) || 25, 1), 200)
    const offset = (page - 1) * pageSize

    if (filters.phone) {
      clauses.push('phone = ?')
      params.push(filters.phone)
    }

    if (filters.loyalty_status) {
      clauses.push('loyalty_status = ?')
      params.push(filters.loyalty_status)
    }

    if (search) {
      clauses.push('(LOWER(name) LIKE ? OR LOWER(phone) LIKE ? OR LOWER(email) LIKE ?)')
      params.push(search, search, search)
    }

    const whereClause = clauses.join(' AND ')
    const total = this.db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM customers
         WHERE ${whereClause}`
      )
      .get(...params)

    const items = this.db
      .prepare(
        `SELECT * FROM customers
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset)

    return {
      items,
      total: Number(total?.total || 0),
      page,
      pageSize,
      search: filters.search || '',
    }
  }

  insert(customer) {
    this.db
      .prepare(
        `INSERT INTO customers (
          entity_id, cloud_id, name, phone, whatsapp_number, email, address_line,
          nearest_city, district, loyalty_status, notes, version, sync_status,
          updated_at, last_synced_at, deleted_at, created_at
        ) VALUES (
          @entity_id, @cloud_id, @name, @phone, @whatsapp_number, @email, @address_line,
          @nearest_city, @district, @loyalty_status, @notes, @version, @sync_status,
          @updated_at, @last_synced_at, @deleted_at, @created_at
        )`
      )
      .run(customer)

    return this.getByEntityId(customer.entity_id)
  }

  update(customer) {
    const updatedAt = nowIso()
    this.db
      .prepare(
        `UPDATE customers
         SET name = @name,
             phone = @phone,
             whatsapp_number = @whatsapp_number,
             email = @email,
             address_line = @address_line,
             nearest_city = @nearest_city,
             district = @district,
             loyalty_status = @loyalty_status,
             notes = @notes,
             version = version + 1,
             sync_status = 'pending_sync',
             updated_at = @updated_at
         WHERE entity_id = @entity_id`
      )
      .run({
        ...customer,
        updated_at: updatedAt,
      })

    return this.getByEntityId(customer.entity_id)
  }
}

module.exports = {
  CustomersRepository,
}
