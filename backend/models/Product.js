const mongoose = require('mongoose')
const { randomUUID } = require('node:crypto')

const productSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    buyingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    stockCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    entityId: {
      type: String,
      default: randomUUID,
      required: true,
      trim: true,
    },
    originDeviceId: {
      type: String,
      trim: true,
      default: '',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

productSchema.index({ businessId: 1, sku: 1 }, { unique: true })
productSchema.index({ businessId: 1, entityId: 1 }, { unique: true })
productSchema.index({ businessId: 1, updatedAt: 1 })

module.exports = mongoose.model('Product', productSchema)
