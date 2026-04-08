const { nowIso } = require('../utils/time')

const BACKOFF_STEPS_MS = [
  5 * 1000,
  30 * 1000,
  2 * 60 * 1000,
  10 * 60 * 1000,
  30 * 60 * 1000,
  2 * 60 * 60 * 1000,
  6 * 60 * 60 * 1000,
]

const NON_CRITICAL_MAX_ATTEMPTS = 15

const isCriticalEntity = (entityType) =>
  ['order', 'order_action', 'inventory_movement'].includes(entityType)

const computeNextAttemptAt = (attemptCount, baseTime = Date.now()) => {
  const index = Math.min(Math.max(attemptCount - 1, 0), BACKOFF_STEPS_MS.length - 1)
  const delay = BACKOFF_STEPS_MS[index]
  const jitter = Math.floor(delay * 0.15 * Math.random())
  return new Date(baseTime + delay + jitter).toISOString()
}

const shouldMoveToFailed = (entityType, attemptCount) =>
  !isCriticalEntity(entityType) && attemptCount >= NON_CRITICAL_MAX_ATTEMPTS

const isRetryableResult = (result) =>
  ['retryable_error', 'temporary_error', 'network_error'].includes(result)

module.exports = {
  computeNextAttemptAt,
  isCriticalEntity,
  isRetryableResult,
  nowIso,
  shouldMoveToFailed,
}
