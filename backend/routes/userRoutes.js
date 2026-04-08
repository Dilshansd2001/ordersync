const express = require('express')

const { updateUserProfile } = require('../controllers/userController')
const { protect } = require('../middlewares/authMiddleware')

const router = express.Router()

router.put('/profile', protect, updateUserProfile)

module.exports = router
