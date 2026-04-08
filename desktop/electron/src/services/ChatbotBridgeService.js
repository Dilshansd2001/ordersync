class ChatbotBridgeService {
  constructor({
    apiBaseUrl,
    getAuthHeaders,
    isOnline = () => true,
    fetchImpl = global.fetch,
  }) {
    if (!apiBaseUrl) {
      throw new Error('apiBaseUrl is required for ChatbotBridgeService.')
    }

    if (typeof getAuthHeaders !== 'function') {
      throw new Error('getAuthHeaders is required for ChatbotBridgeService.')
    }

    this.apiBaseUrl = apiBaseUrl.replace(/\/+$/, '')
    this.getAuthHeaders = getAuthHeaders
    this.isOnline = isOnline
    this.fetchImpl = fetchImpl
  }

  async ask(payload) {
    if (!this.isOnline()) {
      throw new Error('Chatbot needs an internet connection right now.')
    }

    const authHeaders = await this.getAuthHeaders()
    const response = await this.fetchImpl(`${this.apiBaseUrl}/chatbot/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload || {}),
    })

    const contentType = response.headers.get('content-type') || ''
    const body = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : { message: await response.text().catch(() => '') }

    if (!response.ok) {
      throw new Error(body?.message || 'Chatbot request failed.')
    }

    return body?.data || null
  }
}

module.exports = {
  ChatbotBridgeService,
}
