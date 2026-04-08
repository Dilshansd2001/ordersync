class SyncApiClient {
  constructor({ baseUrl, fetchImpl = global.fetch, getHeaders = null }) {
    if (!baseUrl) {
      throw new Error('baseUrl is required for SyncApiClient.')
    }

    if (typeof fetchImpl !== 'function') {
      throw new Error('A fetch implementation is required for SyncApiClient.')
    }

    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.fetchImpl = fetchImpl
    this.getHeaders = getHeaders
  }

  async pushBatch({ tenantId, deviceId, items }) {
    const response = await this.fetchImpl(`${this.baseUrl}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.getHeaders ? await this.getHeaders() : {}),
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        device_id: deviceId,
        items,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      const error = new Error(`Push failed with status ${response.status}`)
      error.statusCode = response.status
      error.body = errorText
      throw error
    }

    return response.json()
  }

  async pullChanges({ tenantId, updatedSince, limit = 100, page = 1 }) {
    const params = new URLSearchParams({
      tenant_id: tenantId,
      limit: String(limit),
      page: String(page),
    })

    if (updatedSince) {
      params.set('updated_since', updatedSince)
    }

    const response = await this.fetchImpl(`${this.baseUrl}/sync/pull?${params.toString()}`, {
      method: 'GET',
      headers: {
        ...(this.getHeaders ? await this.getHeaders() : {}),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      const error = new Error(`Pull failed with status ${response.status}`)
      error.statusCode = response.status
      error.body = errorText
      throw error
    }

    return response.json()
  }
}

module.exports = {
  SyncApiClient,
}
