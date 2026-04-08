import Papa from 'papaparse'
import { Download, LoaderCircle, UploadCloud, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { bulkCreateOrders, fetchOrders } from '@/features/orderSlice'
import { formatCurrency } from '@/utils/formatCurrency'

const instructions = [
  'Download the CSV template and fill one row per order.',
  'Keep customer name and phone number in every row.',
  'Use numeric values for qty, unit price, and COD amount.',
  'Upload the file and review the parsed preview before import.',
  'Import the orders to generate tenant-safe sequential order IDs automatically.',
]

const deliveryServices = ['Koombiyo', 'Pronto', 'Domex', 'PickMe Flash', 'Other']

const templateRows = [
  {
    customer_name: 'Nadeesha Silva',
    phone: '="0771234567"',
    address: '12 Flower Road, Colombo 07',
    district: 'Colombo',
    item_description: 'Floral Gift Box',
    unit_price: '2500',
    qty: '2',
    cod_amount: '5000',
  },
]

const csvHeaders = [
  'customer_name',
  'phone',
  'address',
  'district',
  'item_description',
  'unit_price',
  'qty',
  'cod_amount',
]

const buildCsv = () =>
  Papa.unparse(templateRows, {
    columns: csvHeaders,
  })

const readValue = (row, keys = []) => {
  const match = keys.find((key) => row?.[key] !== undefined && row?.[key] !== null)
  return match ? String(row[match]).trim() : ''
}

const normalizePhoneNumber = (value) => {
  const raw = String(value || '').trim()

  if (!raw) {
    return ''
  }

  const formulaMatch = raw.match(/^="?(.+?)"?$/)
  const cleanedFormulaValue = formulaMatch ? formulaMatch[1] : raw
  const compact = cleanedFormulaValue.replace(/[,\s]/g, '')

  let digitsOnly = compact.replace(/[^\d]/g, '')

  if (/^\d+(\.\d+)?e[+-]?\d+$/i.test(compact)) {
    digitsOnly = Number(compact).toFixed(0)
  }

  if (digitsOnly.length === 9 && digitsOnly.startsWith('7')) {
    return `0${digitsOnly}`
  }

  return digitsOnly
}

const normalizeCsvRow = (row = {}) => ({
  customer_name: readValue(row, ['customer_name', 'customer', 'customerName']),
  phone: normalizePhoneNumber(readValue(row, ['phone', 'customer_phone', 'customerPhone', 'mobile'])),
  address: readValue(row, ['address', 'customer_address', 'customerAddress']),
  district: readValue(row, ['district', 'city']),
  item_description: readValue(row, ['item_description', 'item', 'description', 'item_desc']),
  unit_price: readValue(row, ['unit_price', 'price', 'item_price']),
  qty: readValue(row, ['qty', 'quantity']),
  cod_amount: readValue(row, ['cod_amount', 'cod', 'total_amount', 'amount']),
})

function BulkUploadModal({ open, onClose, onSuccess }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.orders)
  const [deliveryService, setDeliveryService] = useState('Koombiyo')
  const [previewRows, setPreviewRows] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [fileName, setFileName] = useState('')
  const [localError, setLocalError] = useState('')

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

  const normalizedOrders = useMemo(
    () =>
      previewRows.map((row) => {
        const qty = Number(row.qty || 0)
        const unitPrice = Number(row.unit_price || 0)
        const codAmount = Number(row.cod_amount || qty * unitPrice)

        return {
          customerName: row.customer_name?.trim(),
          customerPhone: row.phone?.trim(),
          customerAddress: row.address?.trim(),
          district: row.district?.trim(),
          items: [
            {
              description: row.item_description?.trim() || 'Bulk uploaded item',
              qty,
              unitPrice,
            },
          ],
          deliveryService,
          paymentMethod: 'COD',
          codAmount,
          totalAmount: codAmount,
        }
      }),
    [deliveryService, previewRows]
  )

  const handleClose = () => {
    setPreviewRows([])
    setValidationErrors([])
    setFileName('')
    setLocalError('')
    setDeliveryService('Koombiyo')
    onClose()
  }

  const handleDownloadTemplate = () => {
    const blob = new Blob([buildCsv()], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'ordersync-bulk-upload-template.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const validateRows = (rows) => {
    const issues = []

    rows.forEach((row, index) => {
      if (!row.customer_name?.trim()) {
        issues.push(`Row ${index + 1}: customer name is required.`)
      }

      if (!row.phone?.trim()) {
        issues.push(`Row ${index + 1}: phone number is required.`)
      }

      if (!row.qty || Number(row.qty) <= 0) {
        issues.push(`Row ${index + 1}: qty must be greater than zero.`)
      }
    })

    return issues
  }

  const handleFile = (file) => {
    if (!file) {
      return
    }

    setLocalError('')
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data || []
        const sanitizedRows = rows.map(normalizeCsvRow)
        const issues = validateRows(sanitizedRows)

        setPreviewRows(sanitizedRows)
        setValidationErrors(issues)

        if (!sanitizedRows.length) {
          setLocalError('No valid CSV rows were found in the uploaded file.')
        }
      },
      error: () => {
        setLocalError('Failed to parse the CSV file. Please check the format and try again.')
      },
    })
  }

  const handleImport = async () => {
    setLocalError('')

    if (!normalizedOrders.length) {
      setLocalError('Upload a CSV file before importing.')
      return
    }

    if (validationErrors.length) {
      setLocalError('Resolve CSV validation issues before importing.')
      return
    }

    try {
      await dispatch(bulkCreateOrders(normalizedOrders)).unwrap()
      await dispatch(fetchOrders())
      onSuccess?.(`${normalizedOrders.length} orders imported successfully.`)
      handleClose()
    } catch (submitError) {
      setLocalError(submitError || 'Bulk upload failed.')
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close bulk upload modal"
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
        onClick={handleClose}
        type="button"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-white/60 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Bulk upload</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Import multiple orders from CSV</h2>
          </div>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            onClick={handleClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1fr_1.1fr]">
          <div className="min-h-0 space-y-6 overflow-y-auto border-b border-slate-200 px-6 py-6 dark:border-slate-800 lg:border-b-0 lg:border-r">
            <section className="rounded-[24px] border border-sky-200 bg-sky-50 px-5 py-5 dark:border-sky-500/30 dark:bg-sky-500/10">
              <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">How it works</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-sky-800 dark:text-sky-100/90">
                {instructions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-sky-700 dark:text-sky-200/80">
                Template phone values are exported in an Excel-safe format, so numbers stay readable and addresses with commas stay in one column.
              </p>
            </section>

            <section className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <div>
                <p className="text-base font-semibold text-slate-950 dark:text-white">Download Template</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start with the correct CSV headers for a smooth import.</p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                onClick={handleDownloadTemplate}
                type="button"
              >
                <Download className="h-4 w-4" />
                Download CSV Template
              </button>
            </section>

            <section className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <div>
                <p className="text-base font-semibold text-slate-950 dark:text-white">Delivery Service</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Apply one delivery service to all uploaded orders.</p>
              </div>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                onChange={(event) => setDeliveryService(event.target.value)}
                value={deliveryService}
              >
                {deliveryServices.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </section>

            <section className="space-y-3 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/40">
              <div>
                <p className="text-base font-semibold text-slate-950 dark:text-white">Upload CSV File</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Drag and drop is optional - select a CSV file to parse locally in the browser.</p>
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/5">
                <UploadCloud className="h-8 w-8 text-indigo-500 dark:text-sky-300" />
                <span className="mt-4 text-sm font-medium text-slate-800 dark:text-slate-100">Choose CSV file</span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">Only `.csv` files are supported</span>
                <input
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                  type="file"
                />
              </label>
              {fileName ? <p className="text-sm text-slate-500 dark:text-slate-400">Loaded file: {fileName}</p> : null}
            </section>

            {validationErrors.length ? (
              <section className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 dark:border-rose-500/30 dark:bg-rose-500/10">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">Validation issues</p>
                <ul className="mt-2 space-y-1 text-sm text-rose-700 dark:text-rose-200">
                  {validationErrors.slice(0, 5).map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {localError || error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {localError || error}
              </div>
            ) : null}
          </div>

          <div className="min-h-0 overflow-y-auto px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-950 dark:text-white">Parsed Preview</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review the first five orders before importing.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                {previewRows.length} row{previewRows.length === 1 ? '' : 's'}
              </div>
            </div>

            {previewRows.length ? (
              <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/80">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50/80 dark:bg-slate-900/80">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950/80">
                    {normalizedOrders.slice(0, 5).map((order, index) => (
                      <tr key={`${order.customerPhone}-${index}`} className="transition hover:bg-slate-50 dark:hover:bg-slate-900">
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{order.customerName}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{order.district || 'District unavailable'}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{order.customerPhone}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{order.items[0]?.description}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(order.totalAmount || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-5 flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center dark:border-slate-700 dark:bg-slate-900/40">
                <UploadCloud className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                <p className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">No file parsed yet</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Upload a CSV file to preview the orders that will be imported into your workspace.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                onClick={handleClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading || !previewRows.length || validationErrors.length > 0}
                onClick={handleImport}
                type="button"
              >
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Importing...' : 'Import Orders'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkUploadModal
