import { Download, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useSelector } from 'react-redux'
import InvoiceTemplate from './InvoiceTemplate'

function InvoiceModal({ open, order, onClose }) {
  const { business } = useSelector((state) => state.auth)
  const printRef = useRef(null)
  const printFormat = business?.invoiceSettings?.printFormat || 'A4'

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

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: order?.orderId || 'invoice' })

  if (!open || !order) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0">
      <button className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm print:hidden" onClick={onClose} type="button" />
      <div className={`relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl print:max-h-none print:max-w-none print:rounded-none print:border-0 print:shadow-none ${printFormat === 'THERMAL' ? 'max-w-xl' : 'max-w-5xl'}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 print:hidden">
          <div>
            <p className="text-sm font-medium text-slate-500">Invoice Preview</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{order.orderId}</h2>
            <p className="mt-1 text-sm text-slate-500">{printFormat === 'THERMAL' ? 'Thermal receipt layout' : 'A4 invoice layout'}</p>
          </div>
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700" onClick={handlePrint} type="button">
              <Download className="h-4 w-4" />
              Download / Print
            </button>
            <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50" onClick={onClose} type="button">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className={`overflow-y-auto bg-slate-200 p-6 print:bg-white print:p-0 ${printFormat === 'THERMAL' ? 'flex justify-center' : 'flex justify-center'}`}>
          <InvoiceTemplate ref={printRef} business={business} order={order} />
        </div>
      </div>
    </div>
  )
}

export default InvoiceModal
