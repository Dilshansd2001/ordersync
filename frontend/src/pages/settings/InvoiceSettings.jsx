import { CheckCircle2, FileText, Receipt } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import SettingsNav from '@/components/SettingsNav'
import { setBusiness } from '@/features/authSlice'
import settingsService from '@/services/settingsService'

const printFormats = [
  { id: 'A4', label: 'A4 Invoice', description: 'Standard one-page invoice layout for print and PDF export.' },
  { id: 'THERMAL', label: 'Thermal Receipt', description: 'Narrow receipt layout for 80mm thermal printers.' },
]

function InvoiceSettings() {
  const dispatch = useDispatch()
  const { business } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    template: 'Classic',
    printFormat: 'A4',
    prefix: 'INV-',
    startingNumber: 1001,
    toggles: {
      showLogo: true,
      showBusinessAddress: true,
      showPhone: true,
      showPaymentNotes: true,
    },
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const response = await settingsService.getInvoiceSettings()
        const invoiceSettings = response.data.business.invoiceSettings
        setForm({
          template: invoiceSettings?.template || 'Classic',
          printFormat: invoiceSettings?.printFormat || 'A4',
          prefix: invoiceSettings?.prefix || 'INV-',
          startingNumber: invoiceSettings?.startingNumber || 1001,
          toggles: {
            showLogo: Boolean(invoiceSettings?.toggles?.showLogo),
            showBusinessAddress: Boolean(invoiceSettings?.toggles?.showBusinessAddress),
            showPhone: Boolean(invoiceSettings?.toggles?.showPhone),
            showPaymentNotes: Boolean(invoiceSettings?.toggles?.showPaymentNotes),
          },
        })
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load invoice settings.')
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
  }

  const updateToggle = (field) => {
    setForm((current) => ({
      ...current,
      toggles: {
        ...current.toggles,
        [field]: !current.toggles[field],
      },
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      const response = await settingsService.updateInvoiceSettings(form)
      dispatch(setBusiness(response.data.business))
      setBanner('Invoice settings updated successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save invoice settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsNav />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <form className="space-y-6 rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 sm:p-8" onSubmit={handleSubmit}>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Invoice branding</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Invoice Settings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Configure a normal A4 invoice or a thermal receipt layout, plus numbering and print details.
            </p>
          </div>

          {banner ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              <span>{banner}</span>
            </div>
          ) : null}

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Print Format</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose whether invoices print as a normal A4 page or as a thermal receipt.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {printFormats.map((format) => (
                <button
                  key={format.id}
                  className={`rounded-[24px] border p-5 text-left transition ${
                    form.printFormat === format.id
                      ? 'border-indigo-200 bg-indigo-50 ring-1 ring-inset ring-indigo-100 dark:border-sky-500/40 dark:bg-sky-500/10 dark:ring-sky-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-900'
                  }`}
                  onClick={() => updateField('printFormat', format.id)}
                  type="button"
                >
                  <p className="text-base font-semibold text-slate-950 dark:text-white">{format.label}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{format.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Invoice Prefix</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" onChange={(event) => updateField('prefix', event.target.value)} value={form.prefix} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Starting Number</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" min="1" onChange={(event) => updateField('startingNumber', Number(event.target.value))} type="number" value={form.startingNumber} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['showLogo', 'Show logo'],
              ['showBusinessAddress', 'Show business address'],
              ['showPhone', 'Show phone number'],
              ['showPaymentNotes', 'Show payment notes'],
            ].map(([field, label]) => (
              <button key={field} className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${form.toggles[field] ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300'}`} onClick={() => updateToggle(field)} type="button">
                {label}
              </button>
            ))}
          </div>

          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</div> : null}

          <div className="flex justify-end">
            <button className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-70" disabled={loading || saving} type="submit">
              {saving ? 'Saving...' : 'Save Invoice Settings'}
            </button>
          </div>
        </form>

        <aside className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-950 dark:text-white">Invoice Preview</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Live glimpse of branding rules.</p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-100 p-5 dark:border-slate-700 dark:bg-slate-900/70">
            <div className={`border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950 ${form.printFormat === 'THERMAL' ? 'mx-auto max-w-[230px]' : ''}`}>
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
                <div>
                  <p className="text-lg font-semibold text-slate-950 dark:text-white">{business?.name || 'OrderSync.lk'}</p>
                  {form.toggles.showBusinessAddress ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{business?.address || 'Business address appears here'}</p> : null}
                  {form.toggles.showPhone ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{business?.phone || 'Phone number'}</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Format</p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{form.printFormat === 'THERMAL' ? 'Thermal' : 'A4'}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{form.printFormat === 'THERMAL' ? '80mm thermal' : 'A4 print'}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Invoice Number</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{form.prefix}{form.startingNumber}</p>
                </div>
                {form.toggles.showLogo ? <span className="flex h-12 w-12 items-center justify-center border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"><FileText className="h-5 w-5" /></span> : null}
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default InvoiceSettings
