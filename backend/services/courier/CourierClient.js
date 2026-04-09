const axios = require('axios')

const normalizePath = (path, fallback) => {
  const value = String(path || fallback || '').trim()

  if (!value) {
    return ''
  }

  return value.startsWith('/') ? value : `/${value}`
}

class CourierClient {
  constructor(settings = {}, providerConfig = {}) {
    const baseURL = String(settings.baseUrl || '').trim().replace(/\/+$/, '')

    if (!baseURL) {
      throw new Error('Courier base URL is required.')
    }

    this.settings = settings
    this.providerConfig = providerConfig
    this.http = axios.create({
      baseURL,
      timeout: 15000,
      headers: this.buildHeaders(settings),
    })
  }

  buildHeaders(settings) {
    const headers = {
      'Content-Type': 'application/json',
    }

    if (settings.apiToken) {
      headers.Authorization = `Bearer ${settings.apiToken}`
    }

    if (settings.apiKey) {
      headers['X-API-Key'] = settings.apiKey
    }

    if (settings.apiSecret) {
      headers['X-API-Secret'] = settings.apiSecret
    }

    return headers
  }

  async ping() {
    const path = normalizePath(
      this.settings.healthCheckPath,
      this.providerConfig?.placeholders?.healthCheckPath || '/health'
    )
    const response = await this.http.get(path)

    return {
      ok: true,
      status: response.status,
      data: response.data,
    }
  }

  async createShipment(payload) {
    const path = normalizePath(
      this.settings.createShipmentPath,
      this.providerConfig?.placeholders?.createShipmentPath || '/shipments'
    )
    const response = await this.http.post(path, payload)

    return {
      ok: true,
      status: response.status,
      data: response.data,
    }
  }
}

module.exports = CourierClient
