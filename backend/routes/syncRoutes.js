const express = require('express')

const { pullChanges, pushChanges } = require('../controllers/syncController')
const { protect, requireTenant } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(protect, requireTenant)

router.post('/push', pushChanges)
router.get('/pull', pullChanges)

module.exports = router
