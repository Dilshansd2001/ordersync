const express = require('express')
const { getTenantContext } = require('../controllers/tenant.controller')
const { protect, requireTenant } = require('../middlewares/authMiddleware')

const router = express.Router()

router.get('/context', protect, requireTenant, getTenantContext)

module.exports = router
