const { BaseRepository } = require('./BaseRepository')
const { nowIso } = require('../utils/time')

class ProductsRepository extends BaseRepository {
  constructor(db) {
    super(db, 'products')
  }

  list(filters = {}) {
    const clauses = ['deleted_at IS NULL']
    const params = []
    const search = filters.search ? `%${String(filters.search).trim().toLowerCase()}%` : null
    const page = Math.max(Number(filters.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(filters.pageSize) || 25, 1), 200)
    const offset = (page - 1) * pageSize

    if (filters.category) {
      clauses.push('category = ?')
      params.push(filters.category)
    }

    if (search) {
      clauses.push('(LOWER(name) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(category) LIKE ?)')
      params.push(search, search, search)
    }

    const whereClause = clauses.join(' AND ')
    const total = this.db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM products
         WHERE ${whereClause}`
      )
      .get(...params)

    const items = this.db
      .prepare(
        `SELECT * FROM products
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

  insert(product) {
    this.db
      .prepare(
        `INSERT INTO products (
          entity_id, cloud_id, sku, name, category, buying_price, selling_price,
          stock_count, image_url, is_available, notes, version, sync_status, updated_at,
          last_synced_at, deleted_at, created_at
        ) VALUES (
          @entity_id, @cloud_id, @sku, @name, @category, @buying_price, @selling_price,
          @stock_count, @image_url, @is_available, @notes, @version, @sync_status, @updated_at,
          @last_synced_at, @deleted_at, @created_at
        )`
      )
      .run(product)

    return this.getByEntityId(product.entity_id)
  }

  update(product) {
    const updatedAt = nowIso()
    this.db
      .prepare(
        `UPDATE products
         SET sku = @sku,
             name = @name,
             category = @category,
             buying_price = @buying_price,
             selling_price = @selling_price,
             stock_count = @stock_count,
             image_url = @image_url,
             is_available = @is_available,
             notes = @notes,
             version = version + 1,
             sync_status = 'pending_sync',
             updated_at = @updated_at
         WHERE entity_id = @entity_id`
      )
      .run({
        ...product,
        updated_at: updatedAt,
      })

    return this.getByEntityId(product.entity_id)
  }
}

module.exports = {
  ProductsRepository,
}
