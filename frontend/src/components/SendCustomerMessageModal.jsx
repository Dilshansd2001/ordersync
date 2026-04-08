import { LoaderCircle, Send, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import customerService from '@/services/customerService'
import settingsService from '@/services/settingsService'

const fallbackTemplate = 'Hi {customerName}, this is a message from {businessName}.'

const applyTemplate = (template, customer) => {
  const values = {
    '{customerName}': customer?.name || 'Customer',
    '{businessName}': customer?.businessName || 'OrderSync.lk',
    '{customerPhone}': customer?.whatsappNumber || customer?.phone || '',
  }

  return Object.entries(values).reduce((message, [key, value]) => {
    return message.split(key).join(value)
  }, template || fallbackTemplate)
}

function SendCustomerMessageModal({ customer, open, onClose, onSuccess }) {
  const [loadingDefaults, setLoadingDefaults] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open || !customer?._id) {
      return
    }

    const loadDefaults = async () => {
      try {
        setLoadingDefaults(true)
        setError('')
        const response = await settingsService.getSmsSettings()
        const template = response.data.business?.smsSettings?.defaultTemplate || fallbackTemplate
        const businessName = response.data.business?.name || 'OrderSync.lk'
        setMessage(applyTemplate(template, { ...customer, businessName }))
      } catch (requestError) {
        setMessage(applyTemplate(fallbackTemplate, customer))
        setError(requestError.response?.data?.message || '')
      } finally {
        setLoadingDefaults(false)
      }
    }

    loadDefaults()
  }, [open, customer])

  const handleClose = () => {
    setMessage('')
    setError('')
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!message.trim()) {
      setError('Message cannot be empty.')
      return
    }

    try {
      setSending(true)
      setError('')
      await customerService.sendCustomerMessage(customer._id || customer.entityId, {
        message: message.trim(),
      })
      onSuccess?.(`Message sent to ${customer.name}.`)
      handleClose()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send message.')
    } finally {
      setSending(false)
    }
  }

  if (!open || !customer) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close send message modal"
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm dark:bg-slate-950/60"
        onClick={handleClose}
        type="button"
      />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/60 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-emerald-500/15 via-sky-500/10 to-indigo-500/15" />
        <div className="relative flex items-center justify-between border-b border-slate-200/80 px-6 py-5 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Customer message</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Send normal SMS
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {customer.name} • {customer.whatsappNumber || customer.phone}
            </p>
          </div>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={handleClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="relative space-y-6 px-6 py-6" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Message</span>
            <textarea
              className="min-h-44 w-full rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 text-sm leading-6 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type your message"
              value={message}
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={handleClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-emerald-400 hover:to-sky-500 disabled:opacity-70"
              disabled={sending || loadingDefaults}
              type="submit"
            >
              {sending || loadingDefaults ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending...' : loadingDefaults ? 'Loading...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SendCustomerMessageModal
