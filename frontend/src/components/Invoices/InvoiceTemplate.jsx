import { forwardRef, useMemo } from 'react'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

const themeMap = {
  Classic: {
    shell: 'border-slate-300 bg-white text-slate-900',
    accent: 'text-slate-700',
    badge: 'border-slate-200 bg-slate-50 text-slate-700',
    panel: 'bg-slate-50',
    highlight: 'bg-slate-900 text-white',
    tableHead: 'bg-slate-50 text-slate-500',
    note: 'bg-slate-50 text-slate-600',
  },
  Modern: {
    shell: 'border-indigo-200 bg-[linear-gradient(180deg,#ffffff_0%,#eef2ff_100%)] text-slate-900',
    accent: 'text-indigo-600',
    badge: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    panel: 'bg-white/90',
    highlight: 'bg-indigo-600 text-white',
    tableHead: 'bg-indigo-50 text-indigo-700',
    note: 'bg-white/80 text-slate-600',
  },
  Compact: {
    shell: 'border-slate-200 bg-slate-50 text-slate-900',
    accent: 'text-slate-600',
    badge: 'border-slate-300 bg-white text-slate-700',
    panel: 'bg-white',
    highlight: 'bg-slate-800 text-white',
    tableHead: 'bg-slate-100 text-slate-600',
    note: 'bg-slate-100 text-slate-600',
  },
  Sunshine: {
    shell: 'border-amber-200 bg-[linear-gradient(180deg,#fffdf5_0%,#fff7ed_100%)] text-slate-900',
    accent: 'text-amber-700',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    panel: 'bg-white/90',
    highlight: 'bg-amber-500 text-white',
    tableHead: 'bg-amber-50 text-amber-700',
    note: 'bg-amber-50 text-slate-700',
  },
}

const getSettings = (business) => business?.invoiceSettings || {}

const buildInvoiceNumber = (settings, order) => {
  const prefix = settings.prefix || 'INV-'
  const numericPart = order?.orderId?.replace(/[^0-9]/g, '') || String(settings.startingNumber || 1001)
  return `${prefix}${numericPart}`
}

const calculateSubtotal = (items = []) =>
  items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0), 0)

const renderBusinessIdentity = (business, toggles, compact = false) => (
  <div className={compact ? 'space-y-2' : 'space-y-3'}>
    <div className="flex items-center gap-4">
      {toggles.showLogo && business?.logo ? (
        <img alt="Business logo" className={compact ? 'h-12 w-12 rounded-xl object-cover' : 'h-16 w-16 rounded-2xl object-cover'} src={business.logo} />
      ) : null}
      <div>
        <h1 className={compact ? 'text-lg font-semibold tracking-tight' : 'text-2xl font-semibold tracking-tight'}>
          {business?.name || 'OrderSync.lk'}
        </h1>
        {business?.tagline ? <p className="text-sm text-slate-500">{business.tagline}</p> : null}
      </div>
    </div>
    {toggles.showBusinessAddress && business?.address ? <p className="text-sm text-slate-500">{business.address}</p> : null}
    {toggles.showPhone && business?.phone ? <p className="text-sm text-slate-500">{business.phone}</p> : null}
  </div>
)

const InvoiceTemplate = forwardRef(function InvoiceTemplate({ business, order }, ref) {
  const settings = getSettings(business)
  const toggles = settings.toggles || {}
  const theme = themeMap[settings.template] || themeMap.Modern
  const printFormat = settings.printFormat || 'A4'

  const invoiceNumber = useMemo(() => buildInvoiceNumber(settings, order), [settings, order])
  const itemsSubtotal = useMemo(() => calculateSubtotal(order?.items || []), [order?.items])
  const items = order?.items || []

  if (printFormat === 'THERMAL') {
    return (
      <div ref={ref} className="mx-auto w-full max-w-[320px] bg-white print:max-w-[80mm]">
        <div className={`border p-5 shadow-sm print:border-0 print:p-2.5 print:shadow-none ${theme.shell}`}>
          <div className="space-y-4 border-b border-dashed border-slate-300 pb-5 text-center">
            <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${theme.badge}`}>
              {settings.template || 'Modern'} Receipt
            </div>
            {renderBusinessIdentity(business, toggles, true)}
          </div>

          <div className="mt-5 grid gap-2.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Invoice</span>
              <span className="font-semibold text-slate-900">{invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Date</span>
              <span>{formatDate(order?.createdAt || new Date())}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Order</span>
              <span>{order?.orderId || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span>{order?.status || 'PENDING'}</span>
            </div>
          </div>

          <div className="mt-5 border-y border-dashed border-slate-300 py-5">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Customer</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{order?.customerName || 'Customer'}</p>
              <p className="mt-1 text-xs text-slate-500">{order?.customerPhone || 'No phone'}</p>
            </div>

            <div className="mt-4 space-y-3.5">
              {items.map((item, index) => (
                <div key={`${item.description}-${index}`} className="flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.description}</p>
                    <p className="mt-1 text-slate-500">
                      {item.qty} x {formatCurrency(item.unitPrice || 0)}
                    </p>
                  </div>
                  <p className="whitespace-nowrap font-semibold text-slate-900">
                    {formatCurrency(Number(item.qty || 0) * Number(item.unitPrice || 0))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(itemsSubtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery</span>
              <span>{formatCurrency(order?.deliveryFee || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>COD</span>
              <span>{formatCurrency(order?.codAmount || 0)}</span>
            </div>
          </div>

          <div className={`mt-5 flex items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold ${theme.highlight}`}>
            <span>Total</span>
            <span>{formatCurrency(order?.totalAmount || 0)}</span>
          </div>

          {toggles.showPaymentNotes ? (
            <div className={`mt-4 rounded-2xl px-3.5 py-3 text-center text-xs leading-5 ${theme.note}`}>
              Please verify items at delivery. Thank you for shopping with {business?.name || 'us'}.
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="mx-auto bg-white text-slate-900 print:mx-0" style={{ width: '210mm', minHeight: '297mm' }}>
      <div className="border border-slate-300 bg-white px-[18mm] py-[16mm] shadow-sm print:min-h-[297mm] print:border-0 print:px-[14mm] print:py-[12mm] print:shadow-none">
        <div className="flex items-start justify-between gap-8 border-b border-slate-300 pb-6">
          <div className="min-w-0 flex-1">
            {renderBusinessIdentity(business, toggles)}
          </div>

          <div className="w-[280px] shrink-0 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Invoice</p>
            <p className="mt-2 text-[34px] font-semibold leading-none">{invoiceNumber}</p>
            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-4">
                <span>Date</span>
                <span>{formatDate(order?.createdAt || new Date())}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Order ID</span>
                <span>{order?.orderId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Status</span>
                <span>{order?.status || 'PENDING'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Payment</span>
                <span>{order?.paymentMethod || 'COD'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-[1fr_260px] gap-8">
          <div>
            <div className="grid grid-cols-2 gap-8 border border-slate-200 px-5 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Bill To</p>
                <p className="mt-3 text-lg font-semibold">{order?.customerName || 'Customer'}</p>
                <p className="mt-2 text-sm text-slate-600">{order?.customerPhone || 'No phone'}</p>
                <p className="mt-1.5 text-sm text-slate-600">{order?.customerAddress || 'No address provided'}</p>
                <p className="mt-1.5 text-sm text-slate-600">{order?.district || 'District unavailable'}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Dispatch Info</p>
                <p className="mt-3 text-sm text-slate-600">Tracking: {order?.trackingNumber || 'Pending'}</p>
                <p className="mt-2 text-sm text-slate-600">Delivery service: {order?.deliveryService || 'Standard'}</p>
              </div>
            </div>

            <div className="mt-7 overflow-hidden border border-slate-200">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-5 py-4">Item</th>
                    <th className="px-5 py-4">Qty</th>
                    <th className="px-5 py-4">Rate</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, index) => (
                    <tr key={`${item.description}-${index}`}>
                      <td className="px-5 py-4 text-sm font-medium">{item.description}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{item.qty}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{formatCurrency(item.unitPrice || 0)}</td>
                      <td className="px-5 py-4 text-right text-sm font-semibold">
                        {formatCurrency(Number(item.qty || 0) * Number(item.unitPrice || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-slate-200 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Amounts</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <span>Items subtotal</span>
                  <span>{formatCurrency(itemsSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Delivery fee</span>
                  <span>{formatCurrency(order?.deliveryFee || 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>COD amount</span>
                  <span>{formatCurrency(order?.codAmount || 0)}</span>
                </div>
                <div className="h-px bg-slate-300" />
                <div className="flex items-center justify-between gap-4 text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(order?.totalAmount || 0)}</span>
                </div>
              </div>
            </div>

            {toggles.showPaymentNotes ? (
              <div className="border border-slate-200 px-5 py-5 text-sm leading-7 text-slate-600">
                Thank you for shopping with {business?.name || 'us'}. Please verify the delivered items and keep this invoice for your records.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
})

export default InvoiceTemplate
