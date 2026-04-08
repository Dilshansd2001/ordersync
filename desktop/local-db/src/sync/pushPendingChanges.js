const {
  computeNextAttemptAt,
  isRetryableResult,
  shouldMoveToFailed,
} = require('./backoff')

const buildDeletePayload = (record) => ({
  entity_id: record.entity_id,
  cloud_id: record.cloud_id || null,
  deleted_at: record.deleted_at,
  updated_at: record.updated_at,
  version: record.version,
})

const markRecordSynced = (repositories, entityType, entityId, serverTimestamp) => {
  switch (entityType) {
    case 'product':
      repositories.products.markSyncStatus(entityId, 'synced', serverTimestamp)
      break
    case 'customer':
      repositories.customers.markSyncStatus(entityId, 'synced', serverTimestamp)
      break
    case 'order':
      repositories.orders.markSyncStatus(entityId, 'synced', serverTimestamp)
      repositories.db
        .prepare(
          `UPDATE order_items
           SET sync_status = 'synced',
               last_synced_at = ?,
               updated_at = CASE
                 WHEN updated_at > ? THEN updated_at
                 ELSE ?
               END
           WHERE order_entity_id = ?`
        )
        .run(serverTimestamp, serverTimestamp, serverTimestamp, entityId)
      break
    case 'order_action':
      repositories.orderActions.markSyncStatus(entityId, 'synced', serverTimestamp)
      break
    case 'inventory_movement':
      repositories.inventoryMovements.markSyncStatus(entityId, 'synced', serverTimestamp)
      break
    case 'expense':
      repositories.expenses.markSyncStatus(entityId, 'synced', serverTimestamp)
      break
    case 'setting':
      repositories.settings.markSyncStatus(entityId, 'synced', serverTimestamp)
      break
    case 'order_item':
      repositories.db
        .prepare(
          `UPDATE order_items
           SET sync_status = 'synced',
               last_synced_at = ?,
               updated_at = CASE
                 WHEN updated_at > ? THEN updated_at
                 ELSE ?
               END
           WHERE entity_id = ?`
        )
        .run(serverTimestamp, serverTimestamp, serverTimestamp, entityId)
      break
    default:
      break
  }
}

const markRecordConflict = (repositories, entityType, entityId) => {
  const repoMap = {
    product: repositories.products,
    customer: repositories.customers,
    order: repositories.orders,
    order_action: repositories.orderActions,
    inventory_movement: repositories.inventoryMovements,
    expense: repositories.expenses,
    setting: repositories.settings,
    order_item: {
      markSyncStatus: (targetEntityId, syncStatus) => {
        repositories.db
          .prepare(
            `UPDATE order_items
             SET sync_status = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE entity_id = ?`
          )
          .run(syncStatus, targetEntityId)
      },
    },
  }

  const repo = repoMap[entityType]
  if (repo?.markSyncStatus) {
    repo.markSyncStatus(entityId, 'conflict')
  }
}

const loadRecordForQueueItem = (repositories, queueItem) => {
  switch (queueItem.entity_type) {
    case 'product':
      return repositories.products.getByEntityId(queueItem.entity_id)
    case 'customer':
      return repositories.customers.getByEntityId(queueItem.entity_id)
    case 'order':
      return repositories.orders.getOrderAggregate(queueItem.entity_id)
    case 'order_action':
      return repositories.orderActions.getByEntityId(queueItem.entity_id)
    case 'inventory_movement':
      return repositories.inventoryMovements.getByEntityId(queueItem.entity_id)
    case 'expense':
      return repositories.expenses.getByEntityId(queueItem.entity_id)
    case 'setting':
      return repositories.settings.getByEntityId(queueItem.entity_id)
    case 'order_item':
      return repositories.db
        .prepare(
          `SELECT oi.*, o.entity_id AS parent_order_entity_id
           FROM order_items oi
           LEFT JOIN orders o ON o.entity_id = oi.order_entity_id
           WHERE oi.entity_id = ?
           LIMIT 1`
        )
        .get(queueItem.entity_id)
    default:
      return null
  }
}

const buildPushItem = (repositories, queueItem) => {
  const record = loadRecordForQueueItem(repositories, queueItem)

  if (!record) {
    return {
      skip: false,
      error: {
        code: 'local_record_missing',
        message: `Local ${queueItem.entity_type} record ${queueItem.entity_id} was not found.`,
      },
    }
  }

  if (queueItem.entity_type === 'order_item') {
    return {
      skip: true,
      reason: 'order_items_are_embedded_in_order_push',
      record,
    }
  }

  return {
    skip: false,
    pushItem: {
      queue_id: queueItem.id,
      idempotency_key: queueItem.idempotency_key,
      entity_type: queueItem.entity_type,
      entity_id: queueItem.entity_id,
      operation: queueItem.operation,
      payload: record.deleted_at ? buildDeletePayload(record) : record,
    },
  }
}

const finalizeDependentOrderItems = (repositories, orderEntityId, serverTimestamp) => {
  const pendingOrderItems = repositories.db
    .prepare(
      `SELECT id, entity_id
       FROM sync_queue
       WHERE entity_type = 'order_item'
         AND entity_id IN (
           SELECT entity_id FROM order_items WHERE order_entity_id = ?
         )
         AND status IN ('pending', 'retry', 'processing')`
    )
    .all(orderEntityId)

  for (const queueRow of pendingOrderItems) {
    repositories.syncQueue.markDone(queueRow.id)
    markRecordSynced(repositories, 'order_item', queueRow.entity_id, serverTimestamp)
  }
}

const handleNetworkFailure = (repositories, queueItem, error) => {
  const attemptCount = Number(queueItem.attempt_count || 0) + 1

  if (shouldMoveToFailed(queueItem.entity_type, attemptCount)) {
    repositories.syncQueue.markFailed(queueItem.id, {
      attemptCount,
      errorCode: error.statusCode || 'network_error',
      errorMessage: error.message,
    })
    return
  }

  repositories.syncQueue.markRetry(queueItem.id, {
    attemptCount,
    nextAttemptAt: computeNextAttemptAt(attemptCount),
    errorCode: error.statusCode || 'network_error',
    errorMessage: error.message,
  })
}

const pushPendingChanges = async ({
  db,
  repositories,
  apiClient,
  tenantId,
  deviceId,
  batchSize = 25,
}) => {
  repositories.syncQueue.resetProcessingToRetry()

  const summary = {
    pushed: 0,
    retried: 0,
    failed: 0,
    conflicted: 0,
    skipped: 0,
  }

  while (true) {
    const queueItems = repositories.syncQueue.claimNextBatch(batchSize)

    if (!queueItems.length) {
      break
    }

    for (const queueItem of queueItems) {
      repositories.syncQueue.markProcessing(queueItem.id)

      const built = buildPushItem(repositories, queueItem)

      if (built.skip) {
        repositories.syncQueue.markDone(queueItem.id)
        summary.skipped += 1
        continue
      }

      if (built.error) {
        repositories.syncQueue.markFailed(queueItem.id, {
          attemptCount: Number(queueItem.attempt_count || 0) + 1,
          errorCode: built.error.code,
          errorMessage: built.error.message,
        })
        summary.failed += 1
        continue
      }

      try {
        const response = await apiClient.pushBatch({
          tenantId,
          deviceId,
          items: [built.pushItem],
        })

        const result = response.results?.[0]
        const serverTimestamp = result?.server_updated_at || response.server_time || new Date().toISOString()

        if (!result || ['applied', 'already_applied'].includes(result.result)) {
          db.transaction(() => {
            repositories.syncQueue.markDone(queueItem.id)
            markRecordSynced(repositories, queueItem.entity_type, queueItem.entity_id, serverTimestamp)

            if (queueItem.entity_type === 'order') {
              finalizeDependentOrderItems(repositories, queueItem.entity_id, serverTimestamp)
            }
          })()

          summary.pushed += 1
          continue
        }

        if (result.result === 'conflict') {
          db.transaction(() => {
            repositories.syncQueue.markConflict(queueItem.id, {
              attemptCount: Number(queueItem.attempt_count || 0) + 1,
              errorCode: result.error_code || 'conflict',
              errorMessage: result.error_message || 'Cloud rejected the change due to a conflict.',
            })
            markRecordConflict(repositories, queueItem.entity_type, queueItem.entity_id)
          })()

          summary.conflicted += 1
          continue
        }

        if (isRetryableResult(result.result)) {
          repositories.syncQueue.markRetry(queueItem.id, {
            attemptCount: Number(queueItem.attempt_count || 0) + 1,
            nextAttemptAt: computeNextAttemptAt(Number(queueItem.attempt_count || 0) + 1),
            errorCode: result.error_code || 'retryable_error',
            errorMessage: result.error_message || 'Temporary push failure.',
          })
          summary.retried += 1
          continue
        }

        repositories.syncQueue.markFailed(queueItem.id, {
          attemptCount: Number(queueItem.attempt_count || 0) + 1,
          errorCode: result.error_code || 'push_rejected',
          errorMessage: result.error_message || 'Push request was rejected.',
        })
        summary.failed += 1
      } catch (error) {
        handleNetworkFailure(repositories, queueItem, error)
        summary.retried += 1
      }
    }
  }

  return summary
}

module.exports = {
  pushPendingChanges,
}
