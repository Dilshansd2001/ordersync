import { Eye, FileText, MoreHorizontal, Printer, RefreshCw, Truck } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

const statusPillMap = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20',
  DISPATCHED: 'bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/20',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20',
  RETURNED: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/20',
}

function OrderTable({ orders, onCreateShipment, onOpenInvoice, onOpenOrder, onPrintLabel, shipmentLoadingId }) {
  const [openMenu, setOpenMenu] = useState(null)
  const getOrderKey = (order) => order?._id || order?.entityId || order?.entity_id

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/75">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50/80 dark:bg-slate-900/70">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Total Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Tracking ID</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
            {orders.map((order) => (
              <tr key={getOrderKey(order)} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/45">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900 dark:text-white">{order.orderId}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{order.customerPhone || 'No phone added'}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {formatDate(order.createdAt || order.updatedAt || new Date())}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{order.customerName}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{order.district || 'District unavailable'}</div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(order.totalAmount || 0)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusPillMap[order.status] || 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {order.trackingNumber || 'Pending'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Shipment ID: {order.courierShipmentId || 'Not created'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={shipmentLoadingId === getOrderKey(order)}
                      onClick={() => onCreateShipment?.(order)}
                      type="button"
                    >
                      <Truck className="h-4 w-4" />
                      {shipmentLoadingId === getOrderKey(order) ? 'Creating...' : 'Create Shipment'}
                    </button>
                    <div className="relative inline-block text-left">
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      onClick={() => setOpenMenu(openMenu === getOrderKey(order) ? null : getOrderKey(order))}
                      type="button"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {openMenu === getOrderKey(order) ? (
                      <div className="absolute right-0 z-10 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-md dark:border-slate-800 dark:bg-slate-950">
                        <button
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          onClick={() => {
                            onOpenOrder?.(order)
                            setOpenMenu(null)
                          }}
                          type="button"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          onClick={() => {
                            onOpenOrder?.(order)
                            setOpenMenu(null)
                          }}
                          type="button"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Update Status
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          onClick={() => {
                            onOpenInvoice?.(order)
                            setOpenMenu(null)
                          }}
                          type="button"
                        >
                          <FileText className="h-4 w-4" />
                          View Invoice
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          onClick={() => {
                            onPrintLabel?.(order)
                            setOpenMenu(null)
                          }}
                          type="button"
                        >
                          <Printer className="h-4 w-4" />
                          Print Label
                        </button>
                      </div>
                    ) : null}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default OrderTable
