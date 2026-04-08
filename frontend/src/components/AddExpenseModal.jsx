import { LoaderCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createExpense, fetchExpenses } from '@/features/expenseSlice'

const categories = ['Advertisement', 'Packing', 'Delivery', 'Utilities', 'Supplies', 'Other']

const createInitialForm = () => ({
  category: 'Advertisement',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
})

function AddExpenseModal({ open, onClose, onSuccess, filters }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.expenses)
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

  const handleClose = () => {
    setForm(createInitialForm())
    setLocalError('')
    onClose()
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (!form.amount || Number(form.amount) <= 0) {
      setLocalError('Enter a valid expense amount.')
      return
    }

    try {
      await dispatch(
        createExpense({
          category: form.category,
          amount: Number(form.amount),
          description: form.description.trim(),
          date: form.date,
        })
      ).unwrap()
      onSuccess?.('Expense recorded successfully.')
      handleClose()
    } catch (submitError) {
      setLocalError(submitError || 'Unable to save expense.')
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close add expense modal"
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
        onClick={handleClose}
        type="button"
      />

      <div className="relative z-10 w-full max-w-lg rounded-[28px] border border-white/60 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">New expense</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Record an expense</h2>
          </div>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={handleClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Category</span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
              onChange={(event) => updateField('category', event.target.value)}
              value={form.category}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Amount</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
              min="0"
              onChange={(event) => updateField('amount', event.target.value)}
              placeholder="0.00"
              type="number"
              value={form.amount}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="FB Ads for March"
              value={form.description}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Date</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
              onChange={(event) => updateField('date', event.target.value)}
              type="date"
              value={form.date}
            />
          </label>

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
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
              type="submit"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Saving expense...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddExpenseModal
