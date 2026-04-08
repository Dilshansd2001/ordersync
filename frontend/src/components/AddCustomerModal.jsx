import { LoaderCircle, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createCustomer } from '@/features/customerSlice'

const createInitialForm = () => ({
  name: '',
  phone: '',
  whatsappNumber: '',
  email: '',
  addressLine: '',
  nearestCity: '',
  district: '',
  loyaltyStatus: 'ACTIVE',
  notes: '',
})

function AddCustomerModal({ open, onClose, onSuccess }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.customers)
  const [form, setForm] = useState(createInitialForm)
  const [localError, setLocalError] = useState('')

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

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setLocalError('')
  }

  const handleClose = () => {
    setForm(createInitialForm())
    setLocalError('')
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (!form.name.trim() || !form.phone.trim()) {
      setLocalError('Customer name and phone number are required.')
      return
    }

    try {
      await dispatch(
        createCustomer({
          name: form.name.trim(),
          phone: form.phone.trim(),
          whatsappNumber: form.whatsappNumber.trim(),
          email: form.email.trim(),
          addressLine: form.addressLine.trim(),
          nearestCity: form.nearestCity.trim(),
          district: form.district.trim(),
          loyaltyStatus: form.loyaltyStatus,
          notes: form.notes.trim(),
        })
      ).unwrap()

      onSuccess?.('Customer added successfully.')
      handleClose()
    } catch (submitError) {
      setLocalError(submitError || 'Unable to create customer.')
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close add customer modal"
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm dark:bg-slate-950/60"
        onClick={handleClose}
        type="button"
      />

      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/60 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-fuchsia-500/15" />
        <div className="relative flex items-center justify-between border-b border-slate-200/80 px-6 py-5 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">New customer</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Add customer profile
            </h2>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Customer Name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Nadeesha Silva"
                value={form.name}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Phone Number</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="0771234567"
                value={form.phone}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">WhatsApp Number</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('whatsappNumber', event.target.value)}
                placeholder="Optional WhatsApp contact"
                value={form.whatsappNumber}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email Address</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="customer@example.com"
                type="email"
                value={form.email}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Address</span>
              <textarea
                className="min-h-28 w-full rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 text-sm leading-6 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('addressLine', event.target.value)}
                placeholder="Customer address"
                value={form.addressLine}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nearest City</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('nearestCity', event.target.value)}
                placeholder="Maharagama"
                value={form.nearestCity}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">District</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('district', event.target.value)}
                placeholder="Colombo"
                value={form.district}
              />
            </label>

            <label className="sm:col-span-2">
              <span className="sr-only">Loyalty status</span>
              <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Active customer</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Mark the customer as active for loyalty and retention workflows.
                  </p>
                </div>
                <button
                  aria-pressed={form.loyaltyStatus === 'ACTIVE'}
                  className="inline-flex items-center text-indigo-600 transition hover:text-indigo-700"
                  onClick={() =>
                    updateField('loyaltyStatus', form.loyaltyStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
                  }
                  type="button"
                >
                  {form.loyaltyStatus === 'ACTIVE' ? (
                    <ToggleRight className="h-11 w-11" />
                  ) : (
                    <ToggleLeft className="h-11 w-11 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
              </div>
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Notes</span>
              <textarea
                className="min-h-24 w-full rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 text-sm leading-6 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder="Optional notes about delivery preferences, order history, or follow-up."
                value={form.notes}
              />
            </label>
          </div>

          {localError || error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {localError || error}
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-sky-400 hover:to-indigo-500 disabled:opacity-70"
              disabled={loading}
              type="submit"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Saving customer...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCustomerModal
