import { CheckCircle2, Plus, Search, Sparkles, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AddCustomerModal from '@/components/AddCustomerModal'
import SendCustomerMessageModal from '@/components/SendCustomerMessageModal'
import { useDispatch, useSelector } from 'react-redux'
import CustomerTable from '@/components/CustomerTable'
import { fetchCustomers } from '@/features/customerSlice'

function Customers() {
  const dispatch = useDispatch()
  const { customers, loading } = useSelector((state) => state.customers)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    dispatch(fetchCustomers())
  }, [dispatch])

  useEffect(() => {
    if (!banner) {
      return undefined
    }

    const timeout = window.setTimeout(() => setBanner(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [banner])

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return customers
    }

    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.whatsappNumber]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    )
  }, [customers, searchQuery])

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none sm:p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.14),transparent_55%)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              CRM workspace
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Customer Base
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Keep your repeat buyers organized with loyalty status, order counts, and spend visibility.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-indigo-500"
            onClick={() => setIsModalOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </section>

      {banner ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{banner}</span>
        </div>
      ) : null}

      <section className="rounded-[32px] border border-white/60 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">All customers</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Search by customer name or phone number to quickly find contacts.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {filteredCustomers.length} visible
          </div>
        </div>

        <div className="space-y-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by customer name or phone number"
              value={searchQuery}
            />
          </div>

          {searchQuery ? (
            <button
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              onClick={() => setSearchQuery('')}
              type="button"
            >
              <X className="h-4 w-4" />
              Clear search
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-3 px-6 py-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="grid animate-pulse gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-6">
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : filteredCustomers.length ? (
          <div className="px-4 py-4 sm:px-6 sm:py-6">
            <CustomerTable customers={filteredCustomers} onSendMessage={setSelectedCustomer} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {customers.length ? 'No matching customers' : 'No customers yet'}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {customers.length
                ? 'Try another name or phone number to locate the customer record.'
                : 'Customer records will appear here once you start building your CRM base.'}
            </p>
          </div>
        )}
      </section>

      <AddCustomerModal
        onClose={() => setIsModalOpen(false)}
        onSuccess={(message) => setBanner(message)}
        open={isModalOpen}
      />
      <SendCustomerMessageModal
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onSuccess={(message) => setBanner(message)}
        open={Boolean(selectedCustomer)}
      />
    </div>
  )
}

export default Customers
