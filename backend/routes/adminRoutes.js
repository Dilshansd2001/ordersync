const express = require('express')

const {
  getActivityLogs,
  getOverview,
  getSellers,
  sendSellerActivationKey,
  updateSeller,
} = require('../controllers/adminController')
const { protect, requireSuperAdmin } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(protect, requireSuperAdmin)

const sendSellerActivationKeyCompat = (req, res, next) => {
  if (!req.params.id && req.params[0]) {
    req.params.id = req.params[0]
  }

  return sendSellerActivationKey(req, res, next)
}

router.get('/overview', getOverview)
router.get('/sellers', getSellers)
router.get('/activity-logs', getActivityLogs)
router.post('/sellers/:id/send-activation-key', sendSellerActivationKey)
router.post(/^\/sellers\/([^/]+)\/send-activation-key$/, sendSellerActivationKeyCompat)
router.put('/sellers/:id', updateSeller)

module.exports = router
