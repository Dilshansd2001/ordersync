const express = require('express')

const {
  createCustomer,
  deleteCustomer,
  getCustomers,
  getCustomerById,
  sendCustomerMessage,
  updateCustomer,
} = require('../controllers/customerController')
const { protect, requireTenant } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(protect, requireTenant)

router.route('/').post(createCustomer).get(getCustomers)
router.post('/:id/send-message', sendCustomerMessage)
router.route('/:id').get(getCustomerById).put(updateCustomer).delete(deleteCustomer)

module.exports = router
