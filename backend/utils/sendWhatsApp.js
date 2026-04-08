const axios = require('axios')
const Business = require('../models/Business')

const interpolateWhatsAppTemplate = (template, values = {}) => {
  const payload = String(template || '').trim()

  return Object.entries(values).reduce((message, [key, value]) => {
    return message.split(`{${key}}`).join(String(value ?? ''))
  }, payload)
}

const buildLegacyWhatsAppValues = (orderData = {}) => ({
  customer_name: orderData.customerName || 'Customer',
  order_id: orderData.orderId || 'N/A',
  tracking_number: orderData.trackingNumber || 'Pending',
  amount: Number(orderData.codAmount ?? orderData.totalAmount ?? 0).toFixed(2),
})

const sendWhatsAppMessage = async ({ businessId, to, message }) => {
  const business = await Business.findOne({ _id: businessId }).select('whatsappSettings')

  if (!business?.whatsappSettings?.enabled) {
    return { sent: false, reason: 'disabled' }
  }

  const { apiToken, phoneNumberId } = business.whatsappSettings

  if (!apiToken || !phoneNumberId || !to || !String(message || '').trim()) {
    return { sent: false, reason: 'missing_credentials' }
  }

  await axios.post(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: String(message).trim(),
      },
    },
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  )

  return { sent: true }
}

const sendWhatsApp = async (businessId, orderData) => {
  const business = await Business.findOne({ _id: businessId }).select('name whatsappSettings')

  if (!business?.whatsappSettings?.enabled) {
    return { sent: false, reason: 'disabled' }
  }

  const { apiToken, phoneNumberId, messageTemplate } = business.whatsappSettings

  if (!apiToken || !phoneNumberId || !orderData.customerPhone) {
    return { sent: false, reason: 'missing_credentials' }
  }

  const message = interpolateWhatsAppTemplate(messageTemplate, buildLegacyWhatsAppValues(orderData))

  return sendWhatsAppMessage({
    businessId,
    to: orderData.customerPhone,
    message,
  })
}

module.exports = {
  buildLegacyWhatsAppValues,
  interpolateWhatsAppTemplate,
  sendWhatsApp,
  sendWhatsAppMessage,
}
