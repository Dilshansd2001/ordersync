const { nowIso } = require('../utils/time')

class SyncQueueRepository {
  constructor(db) {
    this.db = db
  }

  enqueue(item) {
    this.db
      .prepare(
        `INSERT INTO sync_queue (
          entity_type, entity_id, operation, idempotency_key, payload_json,
          status, attempt_count, next_attempt_at, last_error_code, last_error_message,
          created_at, updated_at
        ) VALUES (
          @entity_type, @entity_id, @operation, @idempotency_key, @payload_json,
          @status, @attempt_count, @next_attempt_at, @last_error_code, @last_error_message,
          @created_at, @updated_at
        )`
      )
      .run(item)
  }

  enqueueMany(items) {
    const insert = this.db.prepare(
      `INSERT INTO sync_queue (
        entity_type, entity_id, operation, idempotency_key, payload_json,
        status, attempt_count, next_attempt_at, last_error_code, last_error_message,
        created_at, updated_at
      ) VALUES (
        @entity_type, @entity_id, @operation, @idempotency_key, @payload_json,
        @status, @attempt_count, @next_attempt_at, @last_error_code, @last_error_message,
        @created_at, @updated_at
      )`
    )

    for (const item of items) {
      insert.run(item)
    }
  }

  claimNextBatch(limit = 50) {
    return this.db
      .prepare(
        `SELECT * FROM sync_queue
         WHERE status IN ('pending', 'retry')
           AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
         ORDER BY created_at ASC
         LIMIT ?`
      )
      .all(nowIso(), limit)
  }

  markProcessing(id) {
    const timestamp = nowIso()
    this.db
      .prepare(
        `UPDATE sync_queue
         SET status = 'processing',
             updated_at = ?
         WHERE id = ?`
      )
      .run(timestamp, id)
  }

  markDone(id) {
    const timestamp = nowIso()
    this.db
      .prepare(
        `UPDATE sync_queue
         SET status = 'done',
             updated_at = ?,
             last_error_code = NULL,
             last_error_message = NULL
         WHERE id = ?`
      )
      .run(timestamp, id)
  }

  markRetry(id, { attemptCount, nextAttemptAt, errorCode, errorMessage }) {
    const timestamp = nowIso()
    this.db
      .prepare(
        `UPDATE sync_queue
         SET status = 'retry',
             attempt_count = ?,
             next_attempt_at = ?,
             last_error_code = ?,
             last_error_message = ?,
             updated_at = ?
         WHERE id = ?`
      )
      .run(
        attemptCount,
        nextAttemptAt,
        errorCode || null,
        errorMessage || null,
        timestamp,
        id
      )
  }

  markFailed(id, { attemptCount, errorCode, errorMessage }) {
    const timestamp = nowIso()
    this.db
      .prepare(
        `UPDATE sync_queue
         SET status = 'failed',
             attempt_count = ?,
             last_error_code = ?,
             last_error_message = ?,
             updated_at = ?
         WHERE id = ?`
      )
      .run(attemptCount, errorCode || null, errorMessage || null, timestamp, id)
  }

  markConflict(id, { attemptCount, errorCode, errorMessage }) {
    const timestamp = nowIso()
    this.db
      .prepare(
        `UPDATE sync_queue
         SET status = 'conflict',
             attempt_count = ?,
             last_error_code = ?,
             last_error_message = ?,
             updated_at = ?
         WHERE id = ?`
      )
      .run(attemptCount, errorCode || null, errorMessage || null, timestamp, id)
  }

  resetProcessingToRetry() {
    const timestamp = nowIso()
    this.db
      .prepare(
        `UPDATE sync_queue
         SET status = 'retry',
             next_attempt_at = ?,
             updated_at = ?
         WHERE status = 'processing'`
      )
      .run(timestamp, timestamp)
  }

  getPendingCount() {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) AS pendingCount
         FROM sync_queue
         WHERE status IN ('pending', 'retry', 'processing')`
      )
      .get()

    return Number(row?.pendingCount || 0)
  }

  retryById(id) {
    const timestamp = nowIso()
    this.db
      .prepare(
        `UPDATE sync_queue
         SET status = 'retry',
             next_attempt_at = ?,
             last_error_code = NULL,
             last_error_message = NULL,
             updated_at = ?
         WHERE id = ?
           AND status IN ('failed', 'conflict', 'retry', 'pending')`
      )
      .run(timestamp, timestamp, id)
  }

  retryAllSafeItems() {
    const timestamp = nowIso()
    const result = this.db
      .prepare(
        `UPDATE sync_queue
         SET status = 'retry',
             next_attempt_at = ?,
             last_error_code = NULL,
             last_error_message = NULL,
             updated_at = ?
         WHERE status = 'failed'`
      )
      .run(timestamp, timestamp)

    return Number(result?.changes || 0)
  }

  getFailedItems(limit = 50) {
    return this.db
      .prepare(
        `SELECT id, entity_type, entity_id, operation, status, attempt_count,
                last_error_code, last_error_message, updated_at, created_at
         FROM sync_queue
         WHERE status = 'failed'
         ORDER BY updated_at DESC
         LIMIT ?`
      )
      .all(limit)
  }

  getConflictItems(limit = 50) {
    return this.db
      .prepare(
        `SELECT id, entity_type, entity_id, operation, status, attempt_count,
                last_error_code, last_error_message, updated_at, created_at
         FROM sync_queue
         WHERE status = 'conflict'
         ORDER BY updated_at DESC
         LIMIT ?`
      )
      .all(limit)
  }

  getLastError() {
    return (
      this.db
        .prepare(
          `SELECT id, entity_type, entity_id, operation, status,
                  last_error_code, last_error_message, updated_at
           FROM sync_queue
           WHERE last_error_code IS NOT NULL OR last_error_message IS NOT NULL
           ORDER BY updated_at DESC
           LIMIT 1`
        )
        .get() || null
    )
  }
}

module.exports = {
  SyncQueueRepository,
}
