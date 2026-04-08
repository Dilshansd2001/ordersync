const Business = require('../models/Business')
const { sendTextMessage, interpolateTemplate } = require('../utils/sendTextMessage')
const { sendWhatsAppMessage, interpolateWhatsAppTemplate } = require('../utils/sendWhatsApp')

const formatMoney = (value) => Number(value || 0).toFixed(2)

const buildMessageValues = ({ business, order }) => ({
  customerName: order?.customerName || 'Customer',
  orderId: order?.orderId || 'N/A',
  invoiceId: order?.invoiceId || order?.orderId || 'N/A',
  amount: formatMoney(order?.totalAmount),
  receiptLink: order?.receiptLink || '',
  businessName: business?.name || 'OrderSync.lk',
  balanceAmount: formatMoney(order?.codAmount),
  dueDate: order?.dueDate || '',
  branchName: business?.name || 'Main Branch',
  trackingId: order?.trackingNumber || 'Pending',
})

const sendCustomerMessageEvent = async ({ businessId, eventKey, order }) => {
  const business = await Business.findById(businessId).select(
    'name phone invoiceSettings smsSettings whatsappSettings'
  )

  if (!business || !order?.customerPhone) {
    return {
      sms: { sent: false, reason: business ? 'missing_phone' : 'business_not_found' },
      whatsapp: { sent: false, reason: business ? 'missing_phone' : 'business_not_found' },
    }
  }

  const values = buildMessageValues({ business, order })
  const smsEvent = business.smsSettings?.events?.[eventKey]
  const whatsappEvent = business.whatsappSettings?.events?.[eventKey]

  const smsResult = { sent: false, reason: 'disabled' }
  const whatsappResult = { sent: false, reason: 'disabled' }

  if (business.smsSettings?.enabled && smsEvent?.enabled && String(smsEvent.template || '').trim()) {
    try {
      await sendTextMessage({
        businessId,
        phoneNumber: order.customerPhone,
        message: smsEvent.template,
        values,
      })
      smsResult.sent = true
      delete smsResult.reason
    } catch (error) {
      smsResult.reason = error.message
    }
  }

  if (
    business.whatsappSettings?.enabled &&
    whatsappEvent?.enabled &&
    String(whatsappEvent.template || '').trim()
  ) {
    try {
      const renderedMessage = interpolateWhatsAppTemplate(whatsappEvent.template, values)
      await sendWhatsAppMessage({
        businessId,
        to: order.customerPhone,
        message: renderedMessage,
      })
      whatsappResult.sent = true
      delete whatsappResult.reason
    } catch (error) {
      whatsappResult.reason = error.message
    }
  }

  return {
    sms: smsResult,
    whatsapp: whatsappResult,
    preview: interpolateTemplate(
      smsEvent?.template || whatsappEvent?.template || '',
      values
    ),
  }
}

module.exports = {
  buildMessageValues,
  sendCustomerMessageEvent,
}
