const { newId } = require('../utils/ids')
const { nowIso } = require('../utils/time')

const buildQueueItem = ({ entityType, entityId, operation, payload }) => {
  const timestamp = nowIso()

  return {
    entity_type: entityType,
    entity_id: entityId,
    operation,
    idempotency_key: newId(),
    payload_json: JSON.stringify(payload),
    status: 'pending',
    attempt_count: 0,
    next_attempt_at: timestamp,
    last_error_code: null,
    last_error_message: null,
    created_at: timestamp,
    updated_at: timestamp,
  }
}

module.exports = {
  buildQueueItem,
}
