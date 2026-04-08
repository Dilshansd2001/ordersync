import { Printer, X } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import Barcode from 'react-barcode'
import { useReactToPrint } from 'react-to-print'
import { useSelector } from 'react-redux'
import { formatDate } from '@/utils/formatDate'

function ShippingLabelModal({ open, order, onClose }) {
  const { business } = useSelector((state) => state.auth)
  const printRef = useRef(null)

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

  const businessName = business?.name || 'OrderSync.lk'

  const barcodeDigits = useMemo(
    () => (order?.trackingNumber || order?.orderId || 'ORDERSYNC').replace(/\s+/g, '').toUpperCase(),
    [order?.orderId, order?.trackingNumber]
  )

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: order?.orderId || 'shipping-label',
  })

  if (!open || !order) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 print:absolute print:left-0 print:top-0 print:block print:h-auto print:w-full">
      <div className="absolute inset-0 bg-black/50 print:hidden" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 print:block print:min-h-0 print:p-0">
        <div className="w-full max-w-4xl rounded-[28px] bg-white shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 print:hidden">
            <div>
              <p className="text-sm font-medium text-slate-500">Shipping label preview</p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Courier waybill
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                onClick={handlePrint}
                type="button"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                onClick={onClose}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="bg-slate-100 p-6 print:bg-white print:p-0">
            <div ref={printRef} className="mx-auto aspect-[4/6] w-full max-w-[420px] border-2 border-black bg-white p-5 text-black print:absolute print:left-0 print:top-0 print:m-0 print:max-w-none print:border-0 print:p-6 print:w-full print:h-full">
              <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Sender</p>
                  <h3 className="mt-2 text-lg font-extrabold uppercase leading-tight">
                    {businessName}
                  </h3>
                  <p className="mt-2 text-xs font-medium">Sri Lanka Social Commerce Dispatch</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Document</p>
                  <p className="mt-2 text-base font-extrabold uppercase">Proof of Delivery</p>
                  <p className="mt-2 text-xs">{formatDate(order.createdAt || new Date())}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 border-b-2 border-black py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Recipient</p>
                  <p className="mt-2 text-xl font-extrabold uppercase leading-tight">
                    {order.customerName}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{order.customerPhone || 'No phone number'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Delivery Address</p>
                  <p className="mt-2 text-sm font-medium leading-6">
                    {order.customerAddress || 'Address unavailable'}
                  </p>
                  <p className="mt-2 text-sm font-bold uppercase">{order.district || 'District unavailable'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b-2 border-black py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Order ID</p>
                  <p className="mt-2 text-lg font-extrabold">{order.orderId}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Service</p>
                  <p className="mt-2 text-lg font-extrabold uppercase">
                    {order.deliveryService || 'Koombiyo'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-end gap-4 border-b-2 border-black py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Tracking Number</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-[0.2em]">
                    {order.trackingNumber || 'PENDING'}
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase">Waybill reference</p>
                </div>

                <div className="min-w-[180px] border-2 border-black bg-white px-3 py-3 print:px-2 print:py-2">
                  <div className="flex justify-center overflow-hidden">
                    <Barcode
                      background="#ffffff"
                      displayValue
                      format="CODE128"
                      height={40}
                      lineColor="#000000"
                      margin={0}
                      value={barcodeDigits}
                      width={1.5}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Payment</p>
                  <p className="mt-2 text-lg font-extrabold uppercase">{order.paymentMethod || 'COD'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">COD Amount</p>
                  <p className="mt-2 text-lg font-extrabold">LKR {Number(order.codAmount || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-auto border-t-2 border-dashed border-black pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-center">
                Handle with care - verify package before delivery completion
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShippingLabelModal
