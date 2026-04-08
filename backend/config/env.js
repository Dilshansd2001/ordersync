const dotenv = require('dotenv')

dotenv.config()

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  frontendUrls: (process.env.FRONTEND_URL || process.env.CLIENT_URL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ordersync',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  superAdminName: process.env.SUPER_ADMIN_NAME || 'Super Admin',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || '',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || '',
  mailEnabled: process.env.MAIL_ENABLED === 'true',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 0,
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  mailFromEmail: process.env.MAIL_FROM_EMAIL || '',
  mailFromName: process.env.MAIL_FROM_NAME || 'OrderSync.lk',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
}

module.exports = env
