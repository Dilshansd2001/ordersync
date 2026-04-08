const nodemailer = require('nodemailer')

const env = require('../config/env')

let transporterPromise = null

const isMailEnabled = () =>
  Boolean(
    env.mailEnabled &&
      env.smtpHost &&
      env.smtpPort &&
      env.smtpUser &&
      env.smtpPass &&
      env.mailFromEmail
  )

const getTransporter = async () => {
  if (!isMailEnabled()) {
    return null
  }

  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
      })
    )
  }

  return transporterPromise
}

const buildActivationEmailHtml = ({ activationKey, businessName, expiresAt, selectedPlan }) => `
  <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px; color: #0f172a;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: #4f46e5; margin: 0 0 16px;">
        OrderSync.lk Activation
      </p>
      <h1 style="font-size: 28px; margin: 0 0 12px;">Your workspace is almost ready</h1>
      <p style="font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
        Hi ${businessName || 'there'}, your ${selectedPlan} workspace was created successfully. Use the activation key below
        to unlock your first login.
      </p>
      <div style="border-radius: 16px; background: #0f172a; color: #f8fafc; padding: 18px 20px; font-size: 22px; font-weight: 700; letter-spacing: 0.18em; text-align: center;">
        ${activationKey}
      </div>
      <p style="font-size: 14px; line-height: 1.7; margin: 20px 0 0;">
        This key is valid until <strong>${new Date(expiresAt).toLocaleString('en-LK')}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.7; margin: 12px 0 0;">
        Open the verification screen in OrderSync.lk, enter this key, and then continue to sign in.
      </p>
    </div>
  </div>
`

const sendActivationKeyEmail = async ({ activationKey, businessName, expiresAt, selectedPlan, toEmail }) => {
  const transporter = await getTransporter()

  if (!transporter) {
    console.warn('[mail] Activation email skipped. SMTP is not configured.')
    return { delivered: false, skipped: true }
  }

  await transporter.sendMail({
    from: `"${env.mailFromName}" <${env.mailFromEmail}>`,
    to: toEmail,
    subject: 'Your OrderSync.lk activation key',
    text: [
      `Hi ${businessName || 'there'},`,
      '',
      `Your ${selectedPlan} workspace is ready for activation.`,
      `Activation key: ${activationKey}`,
      `Valid until: ${new Date(expiresAt).toLocaleString('en-LK')}`,
      '',
      'Enter this key on the OrderSync.lk activation screen to unlock login access.',
    ].join('\n'),
    html: buildActivationEmailHtml({ activationKey, businessName, expiresAt, selectedPlan }),
  })

  return { delivered: true, skipped: false }
}

module.exports = {
  isMailEnabled,
  sendActivationKeyEmail,
}
