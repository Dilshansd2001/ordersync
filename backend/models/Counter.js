const mongoose = require('mongoose')

const counterSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
      default: 1000,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

counterSchema.index({ businessId: 1, key: 1 }, { unique: true })

module.exports = mongoose.model('Counter', counterSchema)
