const express = require('express')

const { createChatReply } = require('../controllers/chatbotController')
const { protect, requireTenant } = require('../middlewares/authMiddleware')
const { requirePlanFeature } = require('../middlewares/planMiddleware')

const router = express.Router()

router.use(protect, requireTenant)
router.post('/message', requirePlanFeature('aiAssistant'), createChatReply)

module.exports = router
