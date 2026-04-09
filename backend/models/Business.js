const mongoose = require('mongoose')
const { randomUUID } = require('node:crypto')
const { PLAN_ALIASES } = require('../utils/subscriptionPlans')
const { COURIER_PROVIDER_VALUES } = require('../services/courier/providers')

const registeredDeviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
)

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    logo: {
      type: String,
      trim: true,
      default: '',
    },
    subscriptionPlan: {
      type: String,
      enum: Object.keys(PLAN_ALIASES),
      default: 'FREE_TRIAL',
    },
    planExpiryDate: {
      type: Date,
    },
    activationStatus: {
      type: String,
      enum: ['pending', 'active'],
      default: 'pending',
    },
    activationKeyHash: {
      type: String,
      trim: true,
      default: '',
    },
    activationKeyIssuedAt: {
      type: Date,
    },
    activationKeyExpiresAt: {
      type: Date,
    },
    activeModules: {
      whatsappAlerts: {
        type: Boolean,
        default: false,
      },
      koombiyoSync: {
        type: Boolean,
        default: false,
      },
      bulkUpload: {
        type: Boolean,
        default: false,
      },
    },
    whatsappSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },
      apiToken: {
        type: String,
        trim: true,
        default: '',
      },
      phoneNumberId: {
        type: String,
        trim: true,
        default: '',
      },
      messageTemplate: {
        type: String,
        trim: true,
        default:
          'Hi {customer_name}, your order {order_id} has been dispatched! Tracking: {tracking_number}. Amount to pay: {amount}',
      },
      events: {
        orderConfirmation: {
          enabled: {
            type: Boolean,
            default: true,
          },
          template: {
            type: String,
            trim: true,
            default:
              'Hi {customerName}, your order {orderId} has been successfully placed. Total: Rs.{amount}. Thank you for shopping with us! - {businessName}',
          },
        },
        orderReady: {
          enabled: {
            type: Boolean,
            default: false,
          },
          template: {
            type: String,
            trim: true,
            default:
              'Your order #{orderId} is ready for pickup. Tracking ID: {trackingId}. It will reach you shortly. - {businessName}',
          },
        },
        thankYou: {
          enabled: {
            type: Boolean,
            default: false,
          },
          template: {
            type: String,
            trim: true,
            default:
              'Thank you for your visit to {businessName}! We hope to see you again soon. Have a great day!',
          },
        },
      },
    },
    smsSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },
      apiToken: {
        type: String,
        trim: true,
        default: '',
      },
      senderId: {
        type: String,
        trim: true,
        default: '',
      },
      defaultTemplate: {
        type: String,
        trim: true,
        default: 'Hi {customerName}, this is a message from {businessName}.',
      },
      events: {
        orderConfirmation: {
          enabled: {
            type: Boolean,
            default: true,
          },
          template: {
            type: String,
            trim: true,
            default:
              'Hi {customerName}, your order {orderId} has been successfully placed. Total: Rs.{amount}. Thank you for shopping with us! - {businessName}',
          },
        },
        orderReady: {
          enabled: {
            type: Boolean,
            default: false,
          },
          template: {
            type: String,
            trim: true,
            default:
              'Your order #{orderId} is ready for pickup. Tracking ID: {trackingId}. It will reach you shortly. - {businessName}',
          },
        },
        thankYou: {
          enabled: {
            type: Boolean,
            default: false,
          },
          template: {
            type: String,
            trim: true,
            default:
              'Thank you for your visit to {businessName}! We hope to see you again soon. Have a great day!',
          },
        },
      },
    },
    courierSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },
      provider: {
        type: String,
        enum: COURIER_PROVIDER_VALUES,
        default: 'KOOMBIYO',
      },
      apiToken: {
        type: String,
        trim: true,
        default: '',
      },
      apiKey: {
        type: String,
        trim: true,
        default: '',
      },
      apiSecret: {
        type: String,
        trim: true,
        default: '',
      },
      baseUrl: {
        type: String,
        trim: true,
        default: '',
      },
      createShipmentPath: {
        type: String,
        trim: true,
        default: '/shipments',
      },
      healthCheckPath: {
        type: String,
        trim: true,
        default: '/health',
      },
      senderName: {
        type: String,
        trim: true,
        default: '',
      },
      senderPhone: {
        type: String,
        trim: true,
        default: '',
      },
      senderAddress: {
        type: String,
        trim: true,
        default: '',
      },
      defaultServiceType: {
        type: String,
        trim: true,
        default: 'STANDARD',
      },
      autoDispatch: {
        type: Boolean,
        default: false,
      },
    },
    invoiceSettings: {
      template: {
        type: String,
        enum: ['Classic', 'Modern', 'Compact', 'Sunshine'],
        default: 'Modern',
      },
      printFormat: {
        type: String,
        enum: ['A4', 'THERMAL'],
        default: 'A4',
      },
      prefix: {
        type: String,
        trim: true,
        default: 'INV-',
      },
      startingNumber: {
        type: Number,
        default: 1001,
        min: 1,
      },
      toggles: {
        showLogo: {
          type: Boolean,
          default: true,
        },
        showBusinessAddress: {
          type: Boolean,
          default: true,
        },
        showPhone: {
          type: Boolean,
          default: true,
        },
        showPaymentNotes: {
          type: Boolean,
          default: true,
        },
      },
    },
    isActive: {
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
    registeredDevices: {
      type: [registeredDeviceSchema],
      default: [],
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

businessSchema.index({ entityId: 1 }, { unique: true })

module.exports = mongoose.model('Business', businessSchema)
