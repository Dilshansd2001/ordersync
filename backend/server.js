const express = require('express')
const cors = require('cors')
const path = require('node:path')

const env = require('./config/env')
const adminRoutes = require('./routes/adminRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes')
const chatbotRoutes = require('./routes/chatbotRoutes')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const customerRoutes = require('./routes/customerRoutes')
const expenseRoutes = require('./routes/expenseRoutes')
const orderRoutes = require('./routes/orderRoutes')
const productRoutes = require('./routes/productRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const syncRoutes = require('./routes/syncRoutes')
const userRoutes = require('./routes/userRoutes')
const apiRoutes = require('./routes')
const { ensureSuperAdmin } = require('./utils/bootstrapSuperAdmin')
const { errorHandler, notFound } = require('./middlewares/errorHandler')

const app = express()
const normalizeOrigin = (value = '') => {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  try {
    return new URL(trimmed).origin
  } catch {
    return trimmed.replace(/\/+$/, '')
  }
}

const allowedOrigins = (env.frontendUrls.length
  ? env.frontendUrls
  : ['http://localhost:5173', 'http://localhost:5176', 'http://localhost:3000']
).map(normalizeOrigin)
const localhostPattern = /^https?:\/\/localhost:\d+$/
const pagesDevPattern = /^https:\/\/[a-z0-9-]+\.pages\.dev$/i

app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = normalizeOrigin(origin)

      if (
        !origin ||
        allowedOrigins.includes(normalizedOrigin) ||
        localhostPattern.test(normalizedOrigin) ||
        pagesDevPattern.test(normalizedOrigin)
      ) {
        return callback(null, true)
      }

      return callback(new Error(`CORS blocked for origin: ${normalizedOrigin}`))
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the OrderSync.lk backend.',
  })
})

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'ordersync-backend',
    environment: env.nodeEnv,
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/chatbot', chatbotRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/products', productRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/sync', syncRoutes)
app.use('/api/users', userRoutes)
app.use('/api', apiRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(env.port, async () => {
  await connectDB()
  await ensureSuperAdmin({
    name: env.superAdminName,
    email: env.superAdminEmail,
    password: env.superAdminPassword,
  })
  console.log(`Server running on port ${env.port}`)
})
