const express = require('express')

const { login, registerBusiness, verifyActivationKey } = require('../controllers/authController')

const router = express.Router()

router.post('/register-business', registerBusiness)
router.post('/verify-activation-key', verifyActivationKey)
router.post('/login', login)

module.exports = router
