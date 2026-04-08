import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, MapPin, Package2, ReceiptText, Truck, UserRound, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { updateOrderStatus } from '@/features/orderSlice'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

const statusOptions = ['PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED']

function OrderDetailsDrawer({ open, order, onClose, onCreateShipment, onSuccess, shipmentLoadingId }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.orders)
  const [status, setStatus] = useState(order?.status || 'PENDING')
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || '')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    setStatus(order?.status || 'PENDING')
    setTrackingNumber(order?.trackingNumber || '')
  }, [order])

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

  const financials = useMemo(() => {
    const itemSubtotal = (order?.items || []).reduce(
      (sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0),
      0
    )

    return {
      itemSubtotal,
      deliveryFee: Number(order?.deliveryFee || 0),
      codAmount: Number(order?.codAmount || 0),
      totalAmount: Number(order?.totalAmount || 0),
    }
  }, [order])

  const handleClose = () => {
    setLocalError('')
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')

    const orderId = order?._id || order?.entityId || order?.entity_id

    if (!orderId) {
      setLocalError('Order details are unavailable.')
      return
    }

    try {
      await dispatch(
        updateOrderStatus({
          id: orderId,
          data: {
            status,
            trackingNumber: trackingNumber.trim(),
          },
        })
      ).unwrap()

      onSuccess?.('Order updated successfully.')
      handleClose()
    } catch (submitError) {
      setLocalError(submitError || 'Unable to update this order.')
    }
  }

  if (!open || !order) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <button
        aria-label="Close order details drawer"
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm dark:bg-slate-950/55"
        onClick={handleClose}
        type="button"
      />

      <div className="absolute inset-x-0 bottom-0 top-auto flex max-h-[92vh] min-h-[72vh] flex-col rounded-t-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:right-0 sm:left-auto sm:top-0 sm:h-full sm:max-h-none sm:min-h-full sm:w-full sm:max-w-3xl sm:rounded-none sm:rounded-l-[32px]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6 sm:py-5">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Order details</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {order.orderId}
            </h2>
          </div>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={handleClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6 sm:py-6 lg:border-b-0 lg:border-r">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Customer</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Buyer and contact info</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p className="font-medium text-slate-900 dark:text-white">{order.customerName}</p>
                  <p>{order.customerPhone || 'No phone number'}</p>
                  <p>{order.customerAddress || 'No delivery address'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                    <Truck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Shipping</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Logistics and delivery</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    {order.district || 'District unavailable'}
                  </p>
                  <p>Service: {order.deliveryService || 'Koombiyo'}</p>
                  <p>Tracking ID: {order.trackingNumber || 'Pending'}</p>
                  <p>Courier shipment ID: {order.courierShipmentId || 'Not created yet'}</p>
                  <p>Courier sync: {order.courierSyncStatus || 'PENDING'}</p>
                  {order.courierSyncError ? <p className="text-rose-600 dark:text-rose-300">Sync note: {order.courierSyncError}</p> : null}
                  <p>Date: {formatDate(order.createdAt || new Date())}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                    <Package2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Items</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Line items in this order</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(order.items || []).map((item, index) => (
                  <div key={`${item.description}-${index}`} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{item.description}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Qty {item.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(Number(item.qty || 0) * Number(item.unitPrice || 0))}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {formatCurrency(Number(item.unitPrice || 0))} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                  <ReceiptText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Financial breakdown</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Revenue and payment summary</p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Items subtotal</span>
                  <span>{formatCurrency(financials.itemSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Delivery fee</span>
                  <span>{formatCurrency(financials.deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>COD amount</span>
                  <span>{formatCurrency(financials.codAmount)}</span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                <div className="flex items-center justify-between text-base font-semibold text-slate-950 dark:text-white">
                  <span>Total amount</span>
                  <span>{formatCurrency(financials.totalAmount)}</span>
                </div>
              </div>
            </section>
          </div>

          <form className="w-full space-y-5 px-5 py-5 sm:px-6 sm:py-6 lg:w-[360px]" onSubmit={handleSubmit}>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Update status</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Shipping workflow
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Move the order through fulfillment and attach a tracking number for dispatch.
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Status</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Tracking Number</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => setTrackingNumber(event.target.value)}
                placeholder="Waybill number"
                value={trackingNumber}
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Courier Shipment</p>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Create the shipment and automatically pull the courier tracking ID into this order.
              </p>
              <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                <p>Tracking ID: {order.trackingNumber || 'Pending'}</p>
                <p>Shipment ID: {order.courierShipmentId || 'Not created yet'}</p>
              </div>
              <button
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={shipmentLoadingId === (order?._id || order?.entityId || order?.entity_id)}
                onClick={() => onCreateShipment?.(order)}
                type="button"
              >
                {shipmentLoadingId === (order?._id || order?.entityId || order?.entity_id) ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                {shipmentLoadingId === (order?._id || order?.entityId || order?.entity_id) ? 'Creating shipment...' : 'Create Shipment'}
              </button>
            </div>

            {localError || error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {localError || error}
              </div>
            ) : null}

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
              type="submit"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Saving changes...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsDrawer
