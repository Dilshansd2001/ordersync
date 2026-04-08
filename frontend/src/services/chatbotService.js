import apiClient from '@/services/api'
import { repositories } from '@/repositories'
import { isDesktopRuntime } from '@/platform/runtime'

const sanitizeHistory = (history = []) =>
  history
    .filter((item) => item && typeof item.content === 'string' && item.content.trim())
    .slice(-6)
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content.trim(),
    }))

const resolveSyncStatus = async () => {
  if (!isDesktopRuntime()) {
    return null
  }

  try {
    return await repositories.sync.getDiagnostics()
  } catch {
    return null
  }
}

export const sendChatMessage = async ({ message, history, context = {} }) => {
  const payload = {
    message,
    history: sanitizeHistory(history),
    context: {
      ...context,
      runtime: isDesktopRuntime() ? 'desktop' : 'web',
      syncStatus: await resolveSyncStatus(),
    },
  }

  if (isDesktopRuntime()) {
    if (!window.ordersyncChatbot?.ask) {
      throw new Error('Desktop chatbot bridge is not available.')
    }

    return window.ordersyncChatbot.ask(payload)
  }

  const response = await apiClient.post('/chatbot/message', payload)
  return response.data?.data || null
}

const chatbotService = {
  sendChatMessage,
}

export default chatbotService
