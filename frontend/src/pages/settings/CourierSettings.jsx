import {
  CheckCircle2,
  PackageCheck,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Truck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import SettingsNav from '@/components/SettingsNav'
import { setBusiness } from '@/features/authSlice'
import settingsService from '@/services/settingsService'

const defaultForm = {
  enabled: false,
  provider: 'KOOMBIYO',
  apiToken: '',
  apiKey: '',
  apiSecret: '',
  baseUrl: '',
  createShipmentPath: '/shipments',
  healthCheckPath: '/health',
  senderName: '',
  senderPhone: '',
  senderAddress: '',
  defaultServiceType: 'STANDARD',
  autoDispatch: false,
}

const defaultCourierProviders = [
  { value: 'KOOMBIYO', label: 'Koombiyo' },
  { value: 'DEX', label: 'DEX' },
  { value: 'DOMEX', label: 'Domex' },
  { value: 'PROMPT_XPRESS', label: 'Prompt Xpress' },
  { value: 'PRONTO', label: 'Pronto' },
  { value: 'CITYPAK', label: 'Citypak' },
  { value: 'CUSTOM', label: 'Custom Courier API' },
]

const prepareSecretField = (value, originalMasked) =>
  value && value === originalMasked ? undefined : value

function CourierSettings() {
  const dispatch = useDispatch()
  const { business } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [banner, setBanner] = useState('')
  const [error, setError] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [maskedSecrets, setMaskedSecrets] = useState({
    apiToken: '',
    apiKey: '',
    apiSecret: '',
  })
  const [providerOptions, setProviderOptions] = useState(defaultCourierProviders)
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const response = await settingsService.getCourierSettings()
        const settings = response.data.business.courierSettings || {}
        const availableProviders = response.data.business.availableCourierProviders

        if (Array.isArray(availableProviders) && availableProviders.length) {
          setProviderOptions(availableProviders)
        }

        setMaskedSecrets({
          apiToken: settings.apiToken || '',
          apiKey: settings.apiKey || '',
          apiSecret: settings.apiSecret || '',
        })
        setForm({
          enabled: Boolean(settings.enabled),
          provider: settings.provider || defaultForm.provider,
          apiToken: settings.apiToken || '',
          apiKey: settings.apiKey || '',
          apiSecret: settings.apiSecret || '',
          baseUrl: settings.baseUrl || '',
          createShipmentPath: settings.createShipmentPath || defaultForm.createShipmentPath,
          healthCheckPath: settings.healthCheckPath || defaultForm.healthCheckPath,
          senderName: settings.senderName || '',
          senderPhone: settings.senderPhone || response.data.business.phone || '',
          senderAddress: settings.senderAddress || response.data.business.address || '',
          defaultServiceType: settings.defaultServiceType || defaultForm.defaultServiceType,
          autoDispatch: Boolean(settings.autoDispatch),
        })
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load courier settings.')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setBanner('')
    setError('')
    setTestMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      const payload = {
        ...form,
        apiToken: prepareSecretField(form.apiToken, maskedSecrets.apiToken),
        apiKey: prepareSecretField(form.apiKey, maskedSecrets.apiKey),
        apiSecret: prepareSecretField(form.apiSecret, maskedSecrets.apiSecret),
      }
      const response = await settingsService.updateCourierSettings(payload)
      dispatch(setBusiness(response.data.business))

      const savedSettings = response.data.business.courierSettings || {}
      setMaskedSecrets({
        apiToken: savedSettings.apiToken || '',
        apiKey: savedSettings.apiKey || '',
        apiSecret: savedSettings.apiSecret || '',
      })
      setForm((current) => ({
        ...current,
        apiToken: savedSettings.apiToken || '',
        apiKey: savedSettings.apiKey || '',
        apiSecret: savedSettings.apiSecret || '',
      }))
      setBanner('Courier settings saved successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save courier settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      setError('')
      setTestMessage('')
      const response = await settingsService.testCourierSettings()
      setTestMessage(response.message || 'Courier connection successful.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Courier connection failed.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsNav />

      <section className="flex flex-col gap-5 rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Dispatch automation</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Courier Sync
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Save courier credentials, confirm the connection, and push orders automatically when they move to dispatched.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Workspace
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
            {business?.name || 'OrderSync.lk'}
          </p>
        </div>
      </section>

      {banner ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{banner}</span>
        </div>
      ) : null}

      {testMessage ? (
        <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 shadow-sm dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
          <ShieldCheck className="h-4 w-4" />
          <span>{testMessage}</span>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <form
          className="space-y-6 rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 sm:p-8"
          onSubmit={handleSubmit}
        >
          <div className="flex items-start justify-between gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <Truck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-semibold text-slate-950 dark:text-white">Enable courier sync</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Turn on courier credentials and shipment creation for dispatched orders.
                </p>
              </div>
            </div>

            <button
              className="inline-flex items-center text-indigo-600 transition hover:text-indigo-700"
              onClick={() => updateField('enabled', !form.enabled)}
              type="button"
            >
              {form.enabled ? (
                <ToggleRight className="h-11 w-11" />
              ) : (
                <ToggleLeft className="h-11 w-11 text-slate-300 dark:text-slate-600" />
              )}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Provider</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('provider', event.target.value)}
                value={form.provider}
              >
                {providerOptions.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                Auth method and required API fields can vary by courier provider.
              </p>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Default service</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('defaultServiceType', event.target.value)}
                placeholder="STANDARD"
                value={form.defaultServiceType}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Base URL</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('baseUrl', event.target.value)}
                placeholder="https://api.courier.example.com"
                value={form.baseUrl}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">API Token</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('apiToken', event.target.value)}
                placeholder="Bearer token or access token"
                value={form.apiToken}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">API Key</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('apiKey', event.target.value)}
                placeholder="Optional API key"
                value={form.apiKey}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">API Secret</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('apiSecret', event.target.value)}
                placeholder="Optional API secret"
                value={form.apiSecret}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Create shipment path</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('createShipmentPath', event.target.value)}
                placeholder="/shipments"
                value={form.createShipmentPath}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Health check path</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('healthCheckPath', event.target.value)}
                placeholder="/health"
                value={form.healthCheckPath}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Sender name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('senderName', event.target.value)}
                placeholder="OrderSync.lk Dispatch"
                value={form.senderName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Sender phone</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('senderPhone', event.target.value)}
                placeholder="0712345678"
                value={form.senderPhone}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Sender address</span>
              <textarea
                className="min-h-28 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('senderAddress', event.target.value)}
                placeholder="Pickup or warehouse address"
                value={form.senderAddress}
              />
            </label>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/70">
            <div>
              <p className="text-base font-semibold text-slate-950 dark:text-white">Auto create shipment on dispatch</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                When enabled, any order moving to `DISPATCHED` will call the courier API immediately.
              </p>
            </div>

            <button
              className="inline-flex items-center text-indigo-600 transition hover:text-indigo-700"
              onClick={() => updateField('autoDispatch', !form.autoDispatch)}
              type="button"
            >
              {form.autoDispatch ? (
                <ToggleRight className="h-11 w-11" />
              ) : (
                <ToggleLeft className="h-11 w-11 text-slate-300 dark:text-slate-600" />
              )}
            </button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              disabled={loading || testing || saving}
              onClick={handleTestConnection}
              type="button"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading || saving}
              type="submit"
            >
              {saving ? 'Saving...' : 'Save Courier Settings'}
            </button>
          </div>
        </form>

        <aside className="space-y-6 rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <PackageCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-950 dark:text-white">Dispatch flow</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                What happens after an order is marked dispatched.
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
              1. Workspace saves courier credentials and sender details.
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
              2. Order moves to `DISPATCHED`.
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
              3. OrderSync sends order, customer, COD, and line item data to the courier endpoint.
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
              4. Tracking number, label URL, and sync status are saved back on the order.
            </div>
          </div>

          <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
            Keep the masked token values unchanged if you only want to edit sender details. Enter a new token only when rotating credentials.
          </div>
        </aside>
      </section>
    </div>
  )
}

export default CourierSettings
