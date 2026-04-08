const { randomUUID } = require('node:crypto')

const newId = () => randomUUID()

module.exports = {
  newId,
}
