import { Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/utils/cn'

const filterOptions = [
  { key: 'all', label: 'All Issues' },
  { key: 'failed', label: 'Needs Attention' },
  { key: 'conflict', label: 'Conflicts' },
  { key: 'order', label: 'Orders' },
  { key: 'product', label: 'Products' },
  { key: 'customer', label: 'Customers' },
]

function SyncIssuesFilters({
  activeFilter = 'all',
  search = '',
  onFilterChange,
  onSearchChange,
}) {
  return (
    <section className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 text-slate-900 dark:text-white">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold">Find the items that need attention</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Filter the list or search by order, product, or customer.
            </p>
          </div>
        </div>

        <label className="relative block w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search issues"
            type="search"
            value={search}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.key}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition',
              activeFilter === option.key
                ? 'border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
            onClick={() => onFilterChange?.(option.key)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  )
}

export default SyncIssuesFilters
