import { CheckCircle2, MessageSquareText, Send, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import SettingsNav from '@/components/SettingsNav'
import { setBusiness } from '@/features/authSlice'
import settingsService from '@/services/settingsService'

const templateTokens = [
  '{{customerName}}',
  '{{orderId}}',
  '{{invoiceId}}',
  '{{amount}}',
  '{{receiptLink}}',
  '{{businessName}}',
  '{{balanceAmount}}',
  '{{dueDate}}',
  '{{branchName}}',
  '{{trackingId}}',
]

const eventDefinitions = [
  { key: 'orderConfirmation', title: 'ORDER CONFIRMATION', description: 'Send when an order is created.' },
  { key: 'orderReady', title: 'ORDER READY / SHIPPED', description: 'Send when order status changes to completed.' },
  { key: 'thankYou', title: 'THANK YOU MESSAGE', description: 'Send after billing flow completes.' },
]

const defaultEvents = {
  orderConfirmation: {
    enabled: true,
    template:
      'Hi {customerName}, your order {orderId} has been successfully placed. Total: Rs.{amount}. Thank you for shopping with us! - {businessName}',
  },
  orderReady: {
    enabled: false,
    template:
      'Your order #{orderId} is ready for pickup. Tracking ID: {trackingId}. It will reach you shortly. - {businessName}',
  },
  thankYou: {
    enabled: false,
    template:
      'Thank you for your visit to {businessName}! We hope to see you again soon. Have a great day!',
  },
}

const defaultTemplate = 'Hi {customerName}, this is a message from {businessName}.'

const previewValues = {
  '{customerName}': 'Nadeesha Silva',
  '{businessName}': 'OrderSync.lk',
  '{orderId}': 'ORD-1048',
  '{amount}': '12500.00',
  '{invoiceId}': 'INV-1048',
  '{receiptLink}': 'ordersync.lk/r/1048',
  '{balanceAmount}': '2500.00',
  '{dueDate}': '2026-04-15',
  '{branchName}': 'Kaduwela Branch',
  '{trackingId}': 'TRK94837261',
}

const applyPreview = (template) =>
  Object.entries(previewValues).reduce((message, [key, value]) => message.split(key).join(value), template || '')

const normalizeEvents = (events = {}) => ({
  orderConfirmation: {
    enabled: Boolean(events.orderConfirmation?.enabled ?? defaultEvents.orderConfirmation.enabled),
    template: events.orderConfirmation?.template || defaultEvents.orderConfirmation.template,
  },
  orderReady: {
    enabled: Boolean(events.orderReady?.enabled ?? defaultEvents.orderReady.enabled),
    template: events.orderReady?.template || defaultEvents.orderReady.template,
  },
  thankYou: {
    enabled: Boolean(events.thankYou?.enabled ?? defaultEvents.thankYou.enabled),
    template: events.thankYou?.template || defaultEvents.thankYou.template,
  },
})

function SmsSettings() {
  const dispatch = useDispatch()
  const { business } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    enabled: false,
    apiToken: '',
    senderId: '',
    defaultTemplate,
    events: defaultEvents,
  })

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await settingsService.getSmsSettings()
      const settings = response.data.business.smsSettings || {}

      setForm({
        enabled: Boolean(settings.enabled),
        apiToken: settings.apiToken || '',
        senderId: settings.senderId || '',
        defaultTemplate: settings.defaultTemplate || defaultTemplate,
        events: normalizeEvents(settings.events),
      })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load SMS settings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const activePreview = useMemo(() => {
    const activeEvent = eventDefinitions.find((item) => form.events[item.key]?.enabled) || eventDefinitions[0]
    return {
      title: activeEvent.title,
      message: applyPreview(form.events[activeEvent.key]?.template || ''),
    }
  }, [form.events])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setBanner('')
    setError('')
  }

  const updateEventField = (eventKey, field, value) => {
    setForm((current) => ({
      ...current,
      events: {
        ...current.events,
        [eventKey]: {
          ...current.events[eventKey],
          [field]: value,
        },
      },
    }))
    setBanner('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      const response = await settingsService.updateSmsSettings(form)
      const savedBusiness = response.data?.business

      if (savedBusiness) {
        dispatch(setBusiness(savedBusiness))
      }

      await loadSettings()
      setBanner('SMS settings saved successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save SMS settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsNav />

      <section className="flex flex-col gap-5 rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Customer messaging</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">SMS Messages</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Configure Text.lk credentials and enable event-based customer SMS templates for order and billing workflows.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Workspace</p>
          <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{business?.name || 'OrderSync.lk'}</p>
        </div>
      </section>

      {banner ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{banner}</span>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <form className="space-y-6 rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 sm:p-8" onSubmit={handleSubmit}>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-semibold text-slate-950 dark:text-white">Enable SMS sending</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Allow customer SMS workflows and manual sending.</p>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <input checked={form.enabled} onChange={(event) => updateField('enabled', event.target.checked)} type="checkbox" />
                <span>{form.enabled ? 'On' : 'Off'}</span>
              </label>
            </div>
          </div>

          <div className={`${form.enabled ? '' : 'pointer-events-none opacity-60'} space-y-6 transition-opacity`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Text.lk API Token</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" onChange={(event) => updateField('apiToken', event.target.value)} placeholder="Enter Text.lk API token" value={form.apiToken} />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Sender ID</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" onChange={(event) => updateField('senderId', event.target.value)} placeholder="Your approved Text.lk sender ID" value={form.senderId} />
              </label>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Template Tokens</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {templateTokens.map((token) => (
                  <span key={token} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                    {token}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {eventDefinitions.map((eventItem) => (
                <div key={eventItem.key} className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{eventItem.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{eventItem.description}</p>
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <input checked={Boolean(form.events[eventItem.key]?.enabled)} onChange={(event) => updateEventField(eventItem.key, 'enabled', event.target.checked)} type="checkbox" />
                      <span>{form.events[eventItem.key]?.enabled ? 'On' : 'Off'}</span>
                    </label>
                  </div>

                  <textarea className="mt-4 min-h-32 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" onChange={(event) => updateEventField(eventItem.key, 'template', event.target.value)} value={form.events[eventItem.key]?.template || ''} />
                </div>
              ))}
            </div>
          </div>

          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</div> : null}

          <div className="flex justify-end">
            <button className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70" disabled={loading || saving} type="submit">
              {saving ? 'Saving...' : 'Save SMS Settings'}
            </button>
          </div>
        </form>

        <aside className="space-y-6 rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <MessageSquareText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-950 dark:text-white">Message Preview</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Preview of the currently enabled workflow message.</p>
            </div>
          </div>

          <div className="rounded-[28px] bg-slate-100 p-5 dark:bg-slate-900/70">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{form.senderId || 'Sender ID'}</p>
                <Send className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{activePreview.title}</p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{activePreview.message}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-base font-semibold text-slate-900 dark:text-white">Recent Delivery Status</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recent customer numbers and message delivery status records.</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/60">
                <p className="font-medium text-slate-900 dark:text-slate-100">94743283805</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">order_ready - skipped</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/60">
                <p className="font-medium text-slate-900 dark:text-slate-100">94713407814</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">thank_you - pending provider integration</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default SmsSettings
