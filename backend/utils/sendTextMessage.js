const axios = require('axios')
const Business = require('../models/Business')

const defaultSmsTemplate = 'Hi {customerName}, this is a message from {businessName}.'

const textlkClient = axios.create({
  baseURL: process.env.TEXTLK_API_BASE_URL || 'https://app.text.lk/api/v3',
  timeout: Number(process.env.TEXTLK_API_TIMEOUT_MS || 15000),
})

const normalizePhoneNumber = (value) => {
  const digitsOnly = String(value || '').replace(/[^\d]/g, '')

  if (!digitsOnly) {
    return ''
  }

  if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
    return `94${digitsOnly.slice(1)}`
  }

  if (digitsOnly.length === 9 && digitsOnly.startsWith('7')) {
    return `94${digitsOnly}`
  }

  return digitsOnly
}

const interpolateTemplate = (template, values = {}) => {
  const payload = String(template || '').trim()

  return Object.entries(values).reduce((message, [key, value]) => {
    return message.split(`{${key}}`).join(String(value ?? ''))
  }, payload)
}

const sendTextMessage = async ({
  businessId,
  phoneNumber,
  message,
  values = {},
  overrideSenderId = '',
}) => {
  const business = await Business.findById(businessId).select('name smsSettings')

  if (!business) {
    throw new Error('Business not found.')
  }

  const settings = business.smsSettings || {}

  if (!settings.enabled) {
    throw new Error('SMS sending is disabled for this business.')
  }

  if (!String(settings.apiToken || '').trim()) {
    throw new Error('Text.lk API token is missing.')
  }

  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber)

  if (!normalizedPhoneNumber) {
    throw new Error('A valid customer phone number is required.')
  }

  const renderedMessage = interpolateTemplate(message || settings.defaultTemplate || defaultSmsTemplate, {
    businessName: business.name || 'OrderSync.lk',
    ...values,
  })

  if (!renderedMessage) {
    throw new Error('Message content cannot be empty.')
  }

  const senderId = String(overrideSenderId || settings.senderId || '').trim()

  if (!senderId) {
    throw new Error('Text.lk Sender ID is missing.')
  }

  let response

  try {
    response = await textlkClient.post(
      '/sms/send',
      {
        recipient: normalizedPhoneNumber,
        sender_id: senderId,
        type: 'plain',
        message: renderedMessage,
      },
      {
        headers: {
          Authorization: `Bearer ${settings.apiToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    )
  } catch (error) {
    const providerMessage =
      error.response?.data?.message || error.response?.data?.error || error.message || 'SMS sending failed.'

    throw new Error(providerMessage)
  }

  if (response.data?.status && String(response.data.status).toLowerCase() !== 'success') {
    throw new Error(response.data?.message || 'SMS provider rejected the message.')
  }

  return {
    recipient: normalizedPhoneNumber,
    senderId,
    renderedMessage,
    providerResponse: response.data,
  }
}

module.exports = {
  defaultSmsTemplate,
  interpolateTemplate,
  sendTextMessage,
}
