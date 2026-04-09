const { createCourierAdapter } = require('./adapters')

const pingCourierConnection = async (settings = {}) => {
  const adapter = createCourierAdapter(settings.provider)
  return adapter.ping(settings)
}

const syncOrderToCourier = async ({ order, business, settings }) => {
  const adapter = createCourierAdapter(settings.provider)
  return adapter.createShipment({ order, business, settings })
}

module.exports = {
  pingCourierConnection,
  syncOrderToCourier,
}
