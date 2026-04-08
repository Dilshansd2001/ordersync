const express = require('express')
const tenantRoutes = require('./tenant.routes')

const router = express.Router()

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OrderSync.lk API is running.',
  })
})

router.use('/tenant', tenantRoutes)

module.exports = router
