import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Plus, Search, Trash2, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProducts } from '@/features/inventorySlice'
import { createOrder, fetchOrders } from '@/features/orderSlice'
import { formatCurrency } from '@/utils/formatCurrency'

const createInitialItem = () => ({
  productId: '',
  description: '',
  qty: 1,
  unitPrice: '',
})

const createInitialForm = () => ({
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  district: '',
  items: [createInitialItem()],
  paymentMethod: 'COD',
  deliveryFee: '',
  codAmount: '',
})

function AddOrderModal({ open, onClose, onSuccess }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.orders)
  const { products } = useSelector((state) => state.inventory)
  const [form, setForm] = useState(createInitialForm)
  const [localError, setLocalError] = useState('')
  const getProductKey = (product) => product?._id || product?.entityId || product?.entity_id

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

  useEffect(() => {
    if (open && !products.length) {
      dispatch(fetchProducts())
    }
  }, [dispatch, open, products.length])

  const itemsSubtotal = useMemo(
    () =>
      form.items.reduce(
        (sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0),
        0
      ),
    [form.items]
  )

  const grandTotal = itemsSubtotal + Number(form.deliveryFee || 0)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const selectProduct = (index, productId) => {
    const product = products.find((entry) => getProductKey(entry) === productId)

    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productId,
              description: product?.name || item.description,
              unitPrice: product?.sellingPrice ?? item.unitPrice,
            }
          : item
      ),
    }))
  }

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, createInitialItem()],
    }))
  }

  const handleClose = () => {
    setForm(createInitialForm())
    setLocalError('')
    onClose()
  }

  const removeItem = (index) => {
    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')

    const normalizedItems = form.items
      .map((item) => ({
        productId: item.productId || undefined,
        description: item.description.trim(),
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
      }))
      .filter((item) => item.description && item.qty > 0)

    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      setLocalError('Customer name and phone number are required.')
      return
    }

    if (!normalizedItems.length) {
      setLocalError('Add at least one valid order item.')
      return
    }

    try {
      await dispatch(
        createOrder({
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          customerAddress: form.customerAddress.trim(),
          district: form.district.trim(),
          items: normalizedItems,
          paymentMethod: form.paymentMethod,
          deliveryFee: Number(form.deliveryFee || 0),
          codAmount: Number(form.codAmount || 0),
          totalAmount: grandTotal,
        })
      ).unwrap()

      await dispatch(fetchOrders())
      onSuccess?.('Order created successfully.')
      handleClose()
    } catch (submitError) {
      setLocalError(submitError || 'Unable to create order.')
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <button
        aria-label="Close add order modal"
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm dark:bg-slate-950/55"
        onClick={handleClose}
        type="button"
      />

      <div className="absolute inset-x-0 bottom-0 top-auto flex max-h-[92vh] min-h-[70vh] flex-col rounded-t-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:right-0 sm:left-auto sm:top-0 sm:h-full sm:max-h-none sm:min-h-full sm:w-full sm:max-w-2xl sm:rounded-none sm:rounded-l-[32px]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6 sm:py-5">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">New order</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Create an order
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

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-8 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Customer Details</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Capture the customer identity and delivery location.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Customer Name</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                    onChange={(event) => updateField('customerName', event.target.value)}
                    placeholder="Nadeesha Silva"
                    value={form.customerName}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Phone Number</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                    onChange={(event) => updateField('customerPhone', event.target.value)}
                    placeholder="0771234567"
                    value={form.customerPhone}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">District</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                    onChange={(event) => updateField('district', event.target.value)}
                    placeholder="Colombo"
                    value={form.district}
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Address</span>
                  <textarea
                    className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                    onChange={(event) => updateField('customerAddress', event.target.value)}
                    placeholder="Delivery address"
                    value={form.customerAddress}
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Order Items</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Add products with quantity and unit pricing.
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  onClick={addItem}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Add item
                </button>
              </div>

              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div
                    key={`${index}-${item.description}`}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70 sm:grid-cols-[minmax(0,1fr)_110px_140px_48px]"
                  >
                    <div className="space-y-3 sm:col-span-4">
                      <label className="space-y-2 block">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Select Product</span>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                          <select
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                            onChange={(event) => selectProduct(index, event.target.value)}
                            value={item.productId || ''}
                          >
                            <option value="">Manual item entry</option>
                            {products.map((product) => (
                              <option key={getProductKey(product)} value={getProductKey(product)}>
                                {product.name} - {product.sku} ({product.stockCount} in stock)
                              </option>
                            ))}
                          </select>
                        </div>
                      </label>
                    </div>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                        onChange={(event) => updateItem(index, 'description', event.target.value)}
                        placeholder="Product or bundle name"
                        value={item.description}
                      />
                      {item.productId ? (
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          Catalog pricing synced from inventory.
                        </span>
                      ) : null}
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Qty</span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                        min="1"
                        onChange={(event) => updateItem(index, 'qty', event.target.value)}
                        type="number"
                        value={item.qty}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Unit Price</span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                        min="0"
                        onChange={(event) => updateItem(index, 'unitPrice', event.target.value)}
                        placeholder="0.00"
                        type="number"
                        value={item.unitPrice}
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-rose-500/40 dark:hover:text-rose-300"
                        disabled={form.items.length === 1}
                        onClick={() => removeItem(index)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>Items subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(itemsSubtotal)}</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Delivery & Payment</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Finalize payment terms and delivery charges.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 sm:col-span-3 lg:col-span-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Payment Method</span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                    onChange={(event) => updateField('paymentMethod', event.target.value)}
                    value={form.paymentMethod}
                  >
                    <option value="COD">Cash on Delivery</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Delivery Fee</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                    min="0"
                    onChange={(event) => updateField('deliveryFee', event.target.value)}
                    placeholder="0.00"
                    type="number"
                    value={form.deliveryFee}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">COD Amount</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                    min="0"
                    onChange={(event) => updateField('codAmount', event.target.value)}
                    placeholder="0.00"
                    type="number"
                    value={form.codAmount}
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-5 dark:border-slate-800 dark:from-slate-900 dark:to-indigo-950/40">
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>Grand total</span>
                  <span className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </section>

            {localError || error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {localError || error}
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6 sm:py-5">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={handleClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading}
                type="submit"
              >
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Saving order...' : 'Save order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddOrderModal
