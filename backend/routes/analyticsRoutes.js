const express = require('express')

const { getDashboardStats, getFinancialReport } = require('../controllers/analyticsController')
const { protect, requireTenant } = require('../middlewares/authMiddleware')
const { requirePlanFeature } = require('../middlewares/planMiddleware')

const router = express.Router()

router.use(protect, requireTenant)
router.get('/dashboard', getDashboardStats)
router.get('/reports', requirePlanFeature('reports'), getFinancialReport)

module.exports = router
