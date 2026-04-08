import { formatCurrency } from '@/utils/formatCurrency'

const statusPillMap = {
  ACTIVE: 'bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/20',
  INACTIVE: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
}

function CustomerTable({ customers, onSendMessage }) {
  const getCustomerKey = (customer) => customer?._id || customer?.entityId || customer?.entity_id

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/75">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50/80 dark:bg-slate-900/70">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Total Orders</th>
              <th className="px-6 py-4">Total Spend</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
            {customers.map((customer) => (
              <tr key={getCustomerKey(customer)} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/45">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900 dark:text-white">{customer.name}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  <div>{customer.phone}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {customer.whatsappNumber || 'No WhatsApp number'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {customer.district || customer.nearestCity || 'Location unavailable'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                  {customer.orderCount || 0}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                  {formatCurrency(customer.totalSpend || 0)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusPillMap[customer.loyaltyStatus] || statusPillMap.INACTIVE}`}
                  >
                    {customer.loyaltyStatus || 'INACTIVE'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => onSendMessage?.(customer)}
                    type="button"
                  >
                    Send Message
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CustomerTable
