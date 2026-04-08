const mongoose = require('mongoose')
const { randomUUID } = require('node:crypto')

const orderItemSchema = new mongoose.Schema(
  {
    entityId: {
      type: String,
      default: randomUUID,
      trim: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productEntityId: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
)

const orderSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    customerAddress: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    codAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'BANK_TRANSFER'],
      default: 'COD',
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    courierShipmentId: {
      type: String,
      trim: true,
      default: '',
    },
    courierSyncStatus: {
      type: String,
      enum: ['PENDING', 'SYNCED', 'FAILED', 'SKIPPED'],
      default: 'PENDING',
    },
    courierSyncError: {
      type: String,
      trim: true,
      default: '',
    },
    courierLastSyncedAt: {
      type: Date,
      default: null,
    },
    labelUrl: {
      type: String,
      trim: true,
      default: '',
    },
    deliveryService: {
      type: String,
      default: 'Koombiyo',
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    entityId: {
      type: String,
      default: randomUUID,
      required: true,
      trim: true,
    },
    customerEntityId: {
      type: String,
      trim: true,
    },
    replacementForOrderEntityId: {
      type: String,
      trim: true,
    },
    isReplacementOrder: {
      type: Boolean,
      default: false,
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

orderSchema.index({ businessId: 1, orderId: 1 }, { unique: true })
orderSchema.index({ businessId: 1, entityId: 1 }, { unique: true })
orderSchema.index({ businessId: 1, updatedAt: 1 })

module.exports = mongoose.model('Order', orderSchema)
