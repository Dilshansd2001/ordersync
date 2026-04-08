const express = require('express')

const {
  createExpense,
  getExpenses,
  deleteExpense,
} = require('../controllers/expenseController')
const { protect, requireTenant } = require('../middlewares/authMiddleware')
const { requirePlanFeature } = require('../middlewares/planMiddleware')

const router = express.Router()

router.use(protect, requireTenant)
router.use(requirePlanFeature('expenses'))

router.route('/').post(createExpense).get(getExpenses)
router.delete('/:id', deleteExpense)

module.exports = router
