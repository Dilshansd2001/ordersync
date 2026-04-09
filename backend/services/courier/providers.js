const COURIER_PROVIDER_OPTIONS = [
  {
    value: 'KOOMBIYO',
    label: 'Koombiyo',
    implemented: true,
    description: 'Use your Koombiyo partner API credentials and shipment endpoint details.',
    placeholders: {
      baseUrl: 'https://api.koombiyo.example.com',
      createShipmentPath: '/shipments',
      healthCheckPath: '/health',
      defaultServiceType: 'STANDARD',
      apiToken: 'Bearer token or partner access token',
      apiKey: 'Optional API key',
      apiSecret: 'Optional API secret',
    },
  },
  {
    value: 'DEX',
    label: 'DEX',
    implemented: true,
    description: 'Use DEX logistics API credentials and endpoint values from your merchant account.',
    placeholders: {
      baseUrl: 'https://api.dex.lk',
      createShipmentPath: '/orders',
      healthCheckPath: '/health',
      defaultServiceType: 'STANDARD',
      apiToken: 'DEX access token',
      apiKey: 'Optional DEX API key',
      apiSecret: 'Optional DEX API secret',
    },
  },
  {
    value: 'DOMEX',
    label: 'Domex',
    implemented: false,
    description: 'Provider is listed for setup planning. Confirm official API access before enabling live sync.',
    placeholders: {
      baseUrl: 'https://api.domex.example.com',
      createShipmentPath: '/shipments',
      healthCheckPath: '/health',
      defaultServiceType: 'STANDARD',
      apiToken: 'Provider token',
      apiKey: 'Optional API key',
      apiSecret: 'Optional API secret',
    },
  },
  {
    value: 'PROMPT_XPRESS',
    label: 'Prompt Xpress',
    implemented: false,
    description: 'Provider is listed for setup planning. Confirm official API access before enabling live sync.',
    placeholders: {
      baseUrl: 'https://api.promptxpress.example.com',
      createShipmentPath: '/shipments',
      healthCheckPath: '/health',
      defaultServiceType: 'STANDARD',
      apiToken: 'Provider token',
      apiKey: 'Optional API key',
      apiSecret: 'Optional API secret',
    },
  },
  {
    value: 'PRONTO',
    label: 'Pronto',
    implemented: false,
    description: 'Provider is listed for setup planning. Confirm official API access before enabling live sync.',
    placeholders: {
      baseUrl: 'https://api.pronto.example.com',
      createShipmentPath: '/shipments',
      healthCheckPath: '/health',
      defaultServiceType: 'STANDARD',
      apiToken: 'Provider token',
      apiKey: 'Optional API key',
      apiSecret: 'Optional API secret',
    },
  },
  {
    value: 'CITYPAK',
    label: 'Citypak',
    implemented: false,
    description: 'Provider is listed for setup planning. Confirm official API access before enabling live sync.',
    placeholders: {
      baseUrl: 'https://api.citypak.example.com',
      createShipmentPath: '/shipments',
      healthCheckPath: '/health',
      defaultServiceType: 'STANDARD',
      apiToken: 'Provider token',
      apiKey: 'Optional API key',
      apiSecret: 'Optional API secret',
    },
  },
  {
    value: 'CUSTOM',
    label: 'Custom Courier API',
    implemented: true,
    description: 'Use any courier or aggregator that supports a custom JSON shipment endpoint.',
    placeholders: {
      baseUrl: 'https://api.courier.example.com',
      createShipmentPath: '/shipments',
      healthCheckPath: '/health',
      defaultServiceType: 'STANDARD',
      apiToken: 'Bearer token or access token',
      apiKey: 'Optional API key',
      apiSecret: 'Optional API secret',
    },
  },
]

const COURIER_PROVIDER_VALUES = COURIER_PROVIDER_OPTIONS.map((option) => option.value)

const normalizeCourierProvider = (provider) => {
  const normalized = String(provider || '').trim().toUpperCase()
  return COURIER_PROVIDER_VALUES.includes(normalized) ? normalized : 'KOOMBIYO'
}

const getCourierProviderConfig = (provider) =>
  COURIER_PROVIDER_OPTIONS.find((option) => option.value === normalizeCourierProvider(provider)) ||
  COURIER_PROVIDER_OPTIONS[0]

const getCourierProviderLabel = (provider) => getCourierProviderConfig(provider).label

module.exports = {
  COURIER_PROVIDER_OPTIONS,
  COURIER_PROVIDER_VALUES,
  getCourierProviderConfig,
  getCourierProviderLabel,
  normalizeCourierProvider,
}
