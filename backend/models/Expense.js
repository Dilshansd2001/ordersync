const mongoose = require('mongoose')
const { randomUUID } = require('node:crypto')

const expenseSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['Advertisement', 'Packing', 'Delivery', 'Utilities', 'Supplies', 'Other'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
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

expenseSchema.index({ businessId: 1, entityId: 1 }, { unique: true })
expenseSchema.index({ businessId: 1, updatedAt: 1 })

module.exports = mongoose.model('Expense', expenseSchema)
