const ActivityLog = require('../models/ActivityLog')

const logActivity = async ({
  actorUserId,
  actorName,
  actorRole,
  businessId,
  targetUserId,
  action,
  description,
  metadata = {},
}) => {
  try {
    await ActivityLog.create({
      actorUserId,
      actorName: actorName || '',
      actorRole: actorRole || '',
      businessId,
      targetUserId,
      action,
      description,
      metadata,
    })
  } catch (error) {
    console.error('Activity log failed:', error.message)
  }
}

module.exports = {
  logActivity,
}
