const mongoose = require('mongoose')
const { randomUUID } = require('node:crypto')

const customerSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    addressLine: {
      type: String,
      trim: true,
    },
    nearestCity: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    loyaltyStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    totalSpend: {
      type: Number,
      default: 0,
      min: 0,
    },
    orderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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

customerSchema.index({ businessId: 1, entityId: 1 }, { unique: true })
customerSchema.index({ businessId: 1, updatedAt: 1 })

module.exports = mongoose.model('Customer', customerSchema)
