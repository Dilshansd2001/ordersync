const express = require('express')

const {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} = require('../controllers/productController')
const { protect, requireAdmin, requireTenant } = require('../middlewares/authMiddleware')
const { requirePlanFeature } = require('../middlewares/planMiddleware')
const { productImageUpload } = require('../utils/cloudinary')

const router = express.Router()

router.use(protect, requireTenant)
router.use(requirePlanFeature('inventory'))

router.route('/').post(requireAdmin, productImageUpload.single('image'), createProduct).get(getProducts)
router.route('/:id').put(requireAdmin, productImageUpload.single('image'), updateProduct).delete(requireAdmin, deleteProduct)

module.exports = router
