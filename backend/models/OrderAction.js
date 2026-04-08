const mongoose = require('mongoose')
const { randomUUID } = require('node:crypto')

const orderActionSchema = new mongoose.Schema(
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
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    orderEntityId: {
      type: String,
      required: true,
      trim: true,
    },
    actionType: {
      type: String,
      enum: ['CANCEL_ORDER', 'CORRECT_ORDER', 'MARK_RETURNED'],
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    replacementOrderEntityId: {
      type: String,
      trim: true,
      default: '',
    },
    affectsInventory: {
      type: Boolean,
      default: true,
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

orderActionSchema.index({ businessId: 1, entityId: 1 }, { unique: true })
orderActionSchema.index({ businessId: 1, updatedAt: 1 })

module.exports = mongoose.model('OrderAction', orderActionSchema)
