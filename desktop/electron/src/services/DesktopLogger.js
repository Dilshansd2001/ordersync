const fs = require('node:fs')
const path = require('node:path')

class DesktopLogger {
  constructor({ logDir }) {
    this.logDir = logDir
    fs.mkdirSync(this.logDir, { recursive: true })
  }

  write(fileName, level, scope, message, metadata = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      scope,
      message,
      metadata,
    }

    fs.appendFileSync(path.join(this.logDir, fileName), `${JSON.stringify(entry)}\n`)
  }

  info(scope, message, metadata = null) {
    this.write('sync.log', 'info', scope, message, metadata)
  }

  error(scope, message, metadata = null) {
    this.write('error.log', 'error', scope, message, metadata)
  }
}

module.exports = {
  DesktopLogger,
}
