const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')

class DatabaseManager {
  constructor({ baseDir, migrationsDir }) {
    this.baseDir = baseDir
    this.migrationsDir = migrationsDir || path.join(__dirname, 'migrations')
    this.connections = new Map()
  }

  getTenantDbPath(tenantId) {
    const safeTenantId = String(tenantId).replace(/[^a-zA-Z0-9_-]/g, '_')
    return path.join(this.baseDir, `${safeTenantId}.sqlite`)
  }

  getConnection(tenantId) {
    if (!tenantId) {
      throw new Error('tenantId is required to open a database connection.')
    }

    if (this.connections.has(tenantId)) {
      return this.connections.get(tenantId)
    }

    fs.mkdirSync(this.baseDir, { recursive: true })

    const dbPath = this.getTenantDbPath(tenantId)
    const db = new Database(dbPath)
    this.configure(db)
    this.runMigrations(db)

    this.connections.set(tenantId, db)
    return db
  }

  configure(db) {
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.pragma('synchronous = NORMAL')
    db.pragma('busy_timeout = 5000')
  }

  runMigrations(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `)

    const appliedVersions = new Set(
      db.prepare('SELECT version FROM schema_migrations').all().map((row) => row.version)
    )

    const migrationFiles = fs
      .readdirSync(this.migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()

    const insertMigration = db.prepare(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)'
    )

    for (const file of migrationFiles) {
      if (appliedVersions.has(file)) {
        continue
      }

      const sql = fs.readFileSync(path.join(this.migrationsDir, file), 'utf8')

      const applyMigration = db.transaction(() => {
        db.exec(sql)
        insertMigration.run(file, new Date().toISOString())
      })

      applyMigration()
    }
  }

  closeConnection(tenantId) {
    const db = this.connections.get(tenantId)
    if (!db) {
      return
    }

    db.close()
    this.connections.delete(tenantId)
  }

  closeAll() {
    for (const [tenantId, db] of this.connections.entries()) {
      db.close()
      this.connections.delete(tenantId)
    }
  }
}

module.exports = {
  DatabaseManager,
}
