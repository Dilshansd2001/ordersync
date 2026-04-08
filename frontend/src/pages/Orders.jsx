import { CheckCircle2, Plus, Search, ShoppingBag, SlidersHorizontal, Sparkles, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AddOrderModal from '@/components/AddOrderModal'
import BulkUploadModal from '@/components/BulkUploadModal'
import InvoiceModal from '@/components/Invoices/InvoiceModal'
import OrderDetailsDrawer from '@/components/OrderDetailsDrawer'
import OrderTable from '@/components/OrderTable'
import ShippingLabelModal from '@/components/ShippingLabelModal'
import { hasPlanFeature } from '@/data/subscriptionPlans'
import { createCourierShipment, fetchOrders } from '@/features/orderSlice'
import { useAuth } from '@/hooks/useAuth'

const statusOptions = ['ALL', 'PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED']

function Orders() {
  const dispatch = useDispatch()
  const { orders, loading } = useSelector((state) => state.orders)
  const { business } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [banner, setBanner] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isLabelOpen, setIsLabelOpen] = useState(false)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [shipmentLoadingId, setShipmentLoadingId] = useState(null)
  const getOrderKey = (order) => order?._id || order?.entityId || order?.entity_id

  useEffect(() => {
    dispatch(fetchOrders())
  }, [dispatch])

  useEffect(() => {
    if (!banner) {
      return undefined
    }

    const timeout = window.setTimeout(() => setBanner(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [banner])

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus
      if (!matchesStatus) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const searchableFields = [order.orderId, order.customerName, order.customerPhone]
      return searchableFields.some((value) => value?.toLowerCase().includes(normalizedQuery))
    })
  }, [orders, searchQuery, selectedStatus])

  const hasFilters = Boolean(searchQuery) || selectedStatus !== 'ALL'
  const canBulkUpload = hasPlanFeature(business, 'bulkUpload')

  const handleOpenOrder = (order) => {
    setSelectedOrder(order)
    setIsDetailsOpen(true)
  }

  const handleCloseOrder = () => {
    setIsDetailsOpen(false)
    setSelectedOrder(null)
  }

  const handleOpenLabel = (order) => {
    setSelectedOrder(order)
    setIsDetailsOpen(false)
    setIsLabelOpen(true)
  }

  const handleOpenInvoice = (order) => {
    setSelectedOrder(order)
    setIsDetailsOpen(false)
    setIsLabelOpen(false)
    setIsInvoiceOpen(true)
  }

  const handleCreateShipment = async (order) => {
    const orderId = getOrderKey(order)

    if (!orderId) {
      setBanner('Unable to create shipment for this order.')
      return
    }

    try {
      setShipmentLoadingId(orderId)
      const updatedOrder = await dispatch(createCourierShipment(orderId)).unwrap()

      if (selectedOrder && getOrderKey(selectedOrder) === getOrderKey(updatedOrder)) {
        setSelectedOrder(updatedOrder)
      }

      setBanner(
        updatedOrder.trackingNumber
          ? `Shipment created. Tracking ID: ${updatedOrder.trackingNumber}`
          : 'Shipment created successfully.'
      )
    } catch (shipmentError) {
      setBanner(shipmentError || 'Unable to create shipment.')
    } finally {
      setShipmentLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none sm:p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.16),transparent_55%)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Orders workspace
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Manage every incoming order beautifully
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Capture customer details, line items, payment terms, and delivery information in one fast flow.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canBulkUpload ? (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setIsBulkOpen(true)}
                type="button"
              >
                <Upload className="h-4 w-4" />
                Bulk Upload
              </button>
            ) : null}
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-indigo-500"
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add New Order
            </button>
          </div>
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
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">All orders</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Search, filter, and review the order pipeline in one focused workspace.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <SlidersHorizontal className="h-4 w-4" />
            Local filtering enabled
          </div>
        </div>

        <div className="space-y-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by Order ID, customer name, or phone"
                value={searchQuery}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => {
                const isActive = selectedStatus === status
                const label = status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()

                return (
                  <button
                    key={status}
                    className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                    onClick={() => setSelectedStatus(status)}
                    type="button"
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {hasFilters ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {filteredOrders.length} result{filteredOrders.length === 1 ? '' : 's'}
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedStatus('ALL')
                }}
                type="button"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
            </div>
          ) : null}
        </div>

        {loading && !orders.length ? (
          <div className="space-y-3 px-6 py-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid animate-pulse gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-[1.1fr_0.8fr_1.2fr_0.9fr_0.8fr_60px]"
              >
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length ? (
          <div className="px-4 py-4 sm:px-6 sm:py-6">
            <OrderTable
              onCreateShipment={handleCreateShipment}
              onOpenInvoice={handleOpenInvoice}
              onOpenOrder={handleOpenOrder}
              onPrintLabel={handleOpenLabel}
              orders={filteredOrders}
              shipmentLoadingId={shipmentLoadingId}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {orders.length ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {orders.length
                ? 'Try adjusting your search query or status filter to reveal more results.'
                : 'Start by creating your first order. The drawer is ready with customer details, dynamic items, and payment fields.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {orders.length ? (
                <button
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedStatus('ALL')
                  }}
                  type="button"
                >
                  Clear filters
                </button>
              ) : null}
              <button
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-sky-400 hover:to-indigo-500"
                onClick={() => setIsModalOpen(true)}
                type="button"
              >
                <Plus className="h-4 w-4" />
                Add New Order
              </button>
            </div>
          </div>
        )}
      </section>

      <AddOrderModal onClose={() => setIsModalOpen(false)} onSuccess={(message) => setBanner(message)} open={isModalOpen} />
      <BulkUploadModal onClose={() => setIsBulkOpen(false)} onSuccess={(message) => setBanner(message)} open={isBulkOpen && canBulkUpload} />
      <OrderDetailsDrawer
        key={getOrderKey(selectedOrder) || 'order-details'}
        onClose={handleCloseOrder}
        onCreateShipment={handleCreateShipment}
        onSuccess={(message) => setBanner(message)}
        open={isDetailsOpen}
        order={selectedOrder}
        shipmentLoadingId={shipmentLoadingId}
      />
      <ShippingLabelModal onClose={() => { setIsLabelOpen(false); setSelectedOrder(null) }} open={isLabelOpen} order={selectedOrder} />
      <InvoiceModal onClose={() => { setIsInvoiceOpen(false); setSelectedOrder(null) }} open={isInvoiceOpen} order={selectedOrder} />
    </div>
  )
}

export default Orders
