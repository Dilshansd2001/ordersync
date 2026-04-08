const express = require('express')

const {
  bulkCreateOrders,
  createCourierShipment,
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController')
const { protect, requireTenant } = require('../middlewares/authMiddleware')
const { requireOrderQuota, requirePlanFeature } = require('../middlewares/planMiddleware')

const router = express.Router()

router.use(protect, requireTenant)

router.route('/').post(requireOrderQuota(), createOrder).get(getOrders)
router.post(
  '/bulk',
  requirePlanFeature('bulkUpload'),
  requireOrderQuota((req) => (Array.isArray(req.body.orders) ? req.body.orders.length : 0)),
  bulkCreateOrders
)
router.get('/:id', getOrderById)
router.post('/:id/shipment', requirePlanFeature('courierSync'), createCourierShipment)
router.patch('/:id/status', updateOrderStatus)

module.exports = router
