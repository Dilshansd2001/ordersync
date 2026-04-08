const mongoose = require('mongoose')

const syncIdempotencyKeySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
    },
    entityId: {
      type: String,
      required: true,
      trim: true,
    },
    operation: {
      type: String,
      required: true,
      trim: true,
    },
    requestHash: {
      type: String,
      required: true,
      trim: true,
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
)

syncIdempotencyKeySchema.index({ businessId: 1, idempotencyKey: 1 }, { unique: true })

module.exports = mongoose.model('SyncIdempotencyKey', syncIdempotencyKeySchema)
