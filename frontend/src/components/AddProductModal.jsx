import { LoaderCircle, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createProduct, deleteProduct, updateProduct } from '@/features/inventorySlice'
import { isDesktopRuntime } from '@/platform/runtime'

const createInitialForm = () => ({
  name: '',
  sku: '',
  category: '',
  buyingPrice: '',
  sellingPrice: '',
  stockCount: '',
  image: null,
  isAvailable: true,
})

const buildFormFromProduct = (product) => ({
  name: product?.name || '',
  sku: product?.sku || '',
  category: product?.category || '',
  buyingPrice: String(product?.buyingPrice ?? ''),
  sellingPrice: String(product?.sellingPrice ?? ''),
  stockCount: String(product?.stockCount ?? ''),
  image: product?.image || null,
  isAvailable: product?.isAvailable !== false,
})

function AddProductModal({ open, onClose, onSuccess, product = null }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.inventory)
  const [form, setForm] = useState(createInitialForm)
  const [localError, setLocalError] = useState('')
  const isDesktop = isDesktopRuntime()
  const isEditing = Boolean(product)

  const previewImage = useMemo(() => {
    if (form.image instanceof File) {
      return URL.createObjectURL(form.image)
    }

    return typeof form.image === 'string' ? form.image : ''
  }, [form.image])

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
    if (!open) {
      return
    }

    setForm(product ? buildFormFromProduct(product) : createInitialForm())
    setLocalError('')
  }, [open, product])

  useEffect(() => {
    if (!(form.image instanceof File)) {
      return undefined
    }

    return () => {
      URL.revokeObjectURL(previewImage)
    }
  }, [form.image, previewImage])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleClose = () => {
    setForm(createInitialForm())
    setLocalError('')
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (!form.name.trim() || !form.sku.trim()) {
      setLocalError('Product name and SKU are required.')
      return
    }

    try {
      const formData = (() => {
        const nextFormData = new FormData()
        nextFormData.append('name', form.name.trim())
        nextFormData.append('sku', form.sku.trim())
        nextFormData.append('category', form.category.trim())
        nextFormData.append('buyingPrice', String(Number(form.buyingPrice || 0)))
        nextFormData.append('sellingPrice', String(Number(form.sellingPrice || 0)))
        nextFormData.append('stockCount', String(Number(form.stockCount || 0)))
        nextFormData.append('isAvailable', String(form.isAvailable))

        if (form.image instanceof File) {
          nextFormData.append('image', form.image)
        } else {
          nextFormData.append('image', typeof form.image === 'string' ? form.image : '')
        }

        return nextFormData
      })()

      if (isEditing) {
        await dispatch(
          updateProduct({
            id: product._id || product.entityId || product.entity_id,
            data: formData,
          })
        ).unwrap()
      } else {
        await dispatch(createProduct(formData)).unwrap()
      }

      onSuccess?.(isEditing ? 'Product updated successfully.' : 'Product added successfully.')
      handleClose()
    } catch (submitError) {
      setLocalError(submitError || `Unable to ${isEditing ? 'update' : 'create'} product.`)
    }
  }

  const handleDelete = async () => {
    if (!isEditing) {
      return
    }

    try {
      await dispatch(deleteProduct(product._id || product.entityId || product.entity_id)).unwrap()
      onSuccess?.('Product deleted successfully.')
      handleClose()
    } catch (deleteError) {
      setLocalError(deleteError || 'Unable to delete product.')
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={handleClose} type="button" />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/60 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-fuchsia-500/15" />
        <div className="relative flex items-center justify-between border-b border-slate-200/80 px-6 py-5 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isEditing ? 'Update product' : 'New product'}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {isEditing ? 'Edit inventory item' : 'Add inventory item'}
            </h2>
          </div>
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" onClick={handleClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="relative space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Product Name</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" onChange={(event) => updateField('name', event.target.value)} value={form.name} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">SKU</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" onChange={(event) => updateField('sku', event.target.value)} value={form.sku} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Category</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" onChange={(event) => updateField('category', event.target.value)} value={form.category} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Buying Price</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" min="0" onChange={(event) => updateField('buyingPrice', event.target.value)} type="number" value={form.buyingPrice} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Selling Price</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" min="0" onChange={(event) => updateField('sellingPrice', event.target.value)} type="number" value={form.sellingPrice} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Stock Count</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" min="0" onChange={(event) => updateField('stockCount', event.target.value)} type="number" value={form.stockCount} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Product Image</span>
              <input accept="image/*" className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" onChange={(event) => updateField('image', event.target.files?.[0] || null)} type="file" />
            </label>
            {previewImage ? (
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Image Actions</span>
                <button
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
                  onClick={() => updateField('image', null)}
                  type="button"
                >
                  Remove current image
                </button>
              </label>
            ) : null}
            <label className="sm:col-span-2">
              <span className="sr-only">Availability</span>
              <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Available for orders</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Turn this off to hide the item from active selling workflows.
                  </p>
                </div>
                <button
                  aria-pressed={form.isAvailable}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    form.isAvailable ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  onClick={() => updateField('isAvailable', !form.isAvailable)}
                  type="button"
                >
                  <span
                    className={`inline-block h-6 w-6 rounded-full bg-white shadow transition ${
                      form.isAvailable ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </label>
          </div>

          {previewImage ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <img alt="Product preview" className="h-28 w-28 rounded-2xl object-cover" src={previewImage} />
            </div>
          ) : null}

          {isDesktop && form.image ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              Desktop mode will keep this image locally and sync it with the product record when the app reconnects. Use an image under 2 MB for best results.
            </div>
          ) : null}

          {localError || error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{localError || error}</div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {isEditing ? (
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-200 dark:hover:bg-rose-500/10" onClick={handleDelete} type="button">
                <Trash2 className="h-4 w-4" />
                Delete Product
              </button>
            ) : null}
            <button className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" onClick={handleClose} type="button">
              Cancel
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-sky-400 hover:to-indigo-500 disabled:opacity-70" disabled={loading} type="submit">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Saving product...' : isEditing ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProductModal
