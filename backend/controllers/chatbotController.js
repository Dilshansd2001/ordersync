const env = require('../config/env')
const { GeminiChatService } = require('../services/geminiChatService')
const { planChatbotAction } = require('../services/chatbotActionPlanner')
const { buildWorkspaceSnapshot } = require('../services/chatbotWorkspaceService')

const chatService = new GeminiChatService({
  apiKey: env.geminiApiKey,
  model: env.geminiModel,
})

const createChatReply = async (req, res, next) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    const history = Array.isArray(req.body?.history) ? req.body.history : []
    const clientContext =
      req.body?.context && typeof req.body.context === 'object' ? req.body.context : {}

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'A chat message is required.',
      })
    }

    const snapshot = await buildWorkspaceSnapshot({
      businessId: req.businessId,
      user: req.user,
      clientContext,
    })
    const actionProposal = planChatbotAction({
      message,
      runtime: clientContext.runtime,
    })

    const response = await chatService.generateReply({
      message,
      history,
      snapshot,
      actionProposal,
    })

    return res.status(200).json({
      success: true,
      data: {
        reply: response.reply,
        suggestions: response.suggestions,
        model: response.model,
        generatedAt: snapshot.generatedAt,
        actionProposal,
      },
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  createChatReply,
}
