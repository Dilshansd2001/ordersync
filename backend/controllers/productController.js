const Product = require('../models/Product')
const { buildFileUrl } = require('../utils/cloudinary')

const parseAvailability = (value, fallback = true) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true
    }

    if (value.toLowerCase() === 'false') {
      return false
    }
  }

  return fallback
}

const createProduct = async (req, res, next) => {
  try {
    const stockCount = Number(req.body.stockCount || 0)

    const product = await Product.create({
      ...req.body,
      businessId: req.businessId,
      buyingPrice: Number(req.body.buyingPrice || 0),
      sellingPrice: Number(req.body.sellingPrice || 0),
      stockCount,
      image: buildFileUrl(req, req.file) || req.body.image || '',
      isAvailable: parseAvailability(req.body.isAvailable, stockCount > 0),
    })

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product,
    })
  } catch (error) {
    return next(error)
  }
}

const getProducts = async (req, res, next) => {
  try {
    const query = { businessId: req.businessId }

    if (req.query.category) {
      query.category = req.query.category
    }

    const products = await Product.find(query).sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    })
  } catch (error) {
    return next(error)
  }
}

const updateProduct = async (req, res, next) => {
  try {
    const stockCount = Number(req.body.stockCount || 0)

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      {
        ...req.body,
        businessId: req.businessId,
        buyingPrice: Number(req.body.buyingPrice || 0),
        sellingPrice: Number(req.body.sellingPrice || 0),
        stockCount,
        isAvailable: parseAvailability(req.body.isAvailable, stockCount > 0),
        ...(req.file ? { image: buildFileUrl(req, req.file) } : {}),
      },
      { new: true, runValidators: true }
    )

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: product,
    })
  } catch (error) {
    return next(error)
  }
}

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, businessId: req.businessId })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
}
