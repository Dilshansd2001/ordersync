const { SyncService } = require('../services/syncService')

const syncService = new SyncService()

const pushChanges = async (req, res, next) => {
  try {
    const response = await syncService.handlePushBatch({
      businessId: req.businessId,
      deviceId: req.body.device_id || '',
      items: Array.isArray(req.body.items) ? req.body.items : [],
    })

    return res.status(200).json({
      success: true,
      ...response,
    })
  } catch (error) {
    return next(error)
  }
}

const pullChanges = async (req, res, next) => {
  try {
    const response = await syncService.pullChanges({
      businessId: req.businessId,
      updatedSince: req.query.updated_since,
      limit: req.query.limit,
      page: req.query.page,
    })

    return res.status(200).json({
      success: true,
      ...response,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  pullChanges,
  pushChanges,
}
