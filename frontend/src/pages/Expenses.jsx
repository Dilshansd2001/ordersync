import { CheckCircle2, Plus, Sparkles, Trash2, Wallet, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AddExpenseModal from '@/components/AddExpenseModal'
import { deleteExpense, fetchExpenses } from '@/features/expenseSlice'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

const categories = ['Advertisement', 'Packing', 'Delivery', 'Utilities', 'Supplies', 'Other']

function Expenses() {
  const dispatch = useDispatch()
  const { expenses, loading } = useSelector((state) => state.expenses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [banner, setBanner] = useState(null)
  const [filters, setFilters] = useState({ from: '', to: '' })
  const getExpenseKey = (expense) => expense?._id || expense?.entityId || expense?.entity_id

  useEffect(() => {
    dispatch(fetchExpenses(filters))
  }, [dispatch, filters])

  useEffect(() => {
    if (!banner) {
      return undefined
    }

    const timeout = window.setTimeout(() => setBanner(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [banner])

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const expenseDate = new Date(expense.date)
        const fromMatch = filters.from ? expenseDate >= new Date(filters.from) : true
        const toMatch = filters.to ? expenseDate <= new Date(`${filters.to}T23:59:59`) : true
        return fromMatch && toMatch
      }),
    [expenses, filters.from, filters.to]
  )

  const monthStart = useMemo(() => {
    const start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    return start
  }, [])

  const categoryTotals = useMemo(
    () =>
      categories.map((category) => {
        const total = expenses
          .filter((expense) => {
            const expenseDate = new Date(expense.date)
            return expense.category === category && expenseDate >= monthStart
          })
          .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)

        return { category, total }
      }),
    [expenses, monthStart]
  )

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteExpense(id)).unwrap()
      setBanner('Expense deleted successfully.')
    } catch {
      setBanner('Unable to delete this expense right now.')
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none sm:p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_55%)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Financial operations
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Expense Management</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Capture operational costs across categories so you can measure profit with clarity.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-indigo-500"
            onClick={() => setIsModalOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </section>

      {banner ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{banner}</span>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categoryTotals.map((item) => (
          <article key={item.category} className="rounded-[26px] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.category}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {formatCurrency(item.total)}
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200">
                <Wallet className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Current month spend</p>
          </article>
        ))}
      </section>

      <section className="rounded-[32px] border border-white/60 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Recent expenses</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review expenses across your selected date range.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {filteredExpenses.length} visible
          </div>
        </div>

        <div className="space-y-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
              onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
              type="date"
              value={filters.from}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
              onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
              type="date"
              value={filters.to}
            />
            {filters.from || filters.to ? (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setFilters({ from: '', to: '' })}
                type="button"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 px-6 py-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="grid animate-pulse gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-[0.8fr_1fr_1.6fr_0.8fr_60px]">
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : filteredExpenses.length ? (
          <div className="overflow-x-auto px-4 py-4 sm:px-6 sm:py-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/75">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50/80 dark:bg-slate-900/70">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
                  {filteredExpenses.map((expense) => (
                    <tr key={getExpenseKey(expense)} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/45">
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(expense.date)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{expense.category}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{expense.description || 'No description added'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(expense.amount || 0)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
                          onClick={() => handleDelete(getExpenseKey(expense))}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200">
              <Wallet className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">No expenses found</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Start recording costs or adjust the selected date range to see matching entries.
            </p>
          </div>
        )}
      </section>

      <AddExpenseModal filters={filters} onClose={() => setIsModalOpen(false)} onSuccess={(message) => setBanner(message)} open={isModalOpen} />
    </div>
  )
}

export default Expenses
