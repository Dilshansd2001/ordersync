const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { safeStorage } = require('electron')

class SecureSessionStore {
  constructor({ userDataDir, appNamespace = 'ordersync', allowInsecureFallback = false }) {
    if (!userDataDir) {
      throw new Error('userDataDir is required for SecureSessionStore.')
    }

    this.userDataDir = userDataDir
    this.appNamespace = appNamespace
    this.allowInsecureFallback = allowInsecureFallback
    this.storageDir = path.join(this.userDataDir, 'secure-store')
    this.sessionPath = path.join(this.storageDir, `${this.appNamespace}.session`)
  }

  ensureStorageDir() {
    fs.mkdirSync(this.storageDir, { recursive: true })
  }

  encode(payload) {
    const json = JSON.stringify(payload, null, 2)

    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.encryptString(json)
    }

    if (!this.allowInsecureFallback) {
      throw new Error('OS-backed encryption is unavailable. Refusing insecure session storage.')
    }

    return Buffer.from(json, 'utf8')
  }

  decode(buffer) {
    if (!buffer) {
      return null
    }

    const json = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(buffer)
      : buffer.toString('utf8')

    return JSON.parse(json)
  }

  saveSession(session) {
    this.ensureStorageDir()
    fs.writeFileSync(this.sessionPath, this.encode(session), { mode: 0o600 })
  }

  loadSession() {
    if (!fs.existsSync(this.sessionPath)) {
      return null
    }

    const buffer = fs.readFileSync(this.sessionPath)
    return this.decode(buffer)
  }

  clearSession() {
    if (fs.existsSync(this.sessionPath)) {
      fs.unlinkSync(this.sessionPath)
    }
  }

  provisionDeviceIdentity(existing = null) {
    if (existing?.deviceId) {
      return existing
    }

    return {
      deviceId: randomUUID(),
      deviceRegisteredAt: new Date().toISOString(),
    }
  }
}

module.exports = {
  SecureSessionStore,
}
