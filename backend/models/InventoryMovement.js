const mongoose = require('mongoose')
const { randomUUID } = require('node:crypto')

const inventoryMovementSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      default: randomUUID,
      required: true,
      trim: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productEntityId: {
      type: String,
      required: true,
      trim: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    orderEntityId: {
      type: String,
      trim: true,
      default: '',
    },
    orderActionEntityId: {
      type: String,
      trim: true,
      default: '',
    },
    movementType: {
      type: String,
      enum: ['opening_balance', 'sale_commit', 'manual_adjustment', 'return_restock', 'cancel_restock'],
      required: true,
    },
    quantityDelta: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
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

inventoryMovementSchema.index({ businessId: 1, entityId: 1 }, { unique: true })
inventoryMovementSchema.index({ businessId: 1, updatedAt: 1 })
inventoryMovementSchema.index({ businessId: 1, productEntityId: 1, createdAt: 1 })

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema)
