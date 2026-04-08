import { ImageOff, PackageCheck, Pencil, TriangleAlert } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'

function ProductCard({ product, onEdit }) {
  const stock = Number(product.stockCount || 0)
  const isLowStock = stock > 0 && stock < 5
  const isAvailable = product.isAvailable !== false && stock > 0
  const stockWidth = Math.min(100, Math.max(stock > 0 ? 12 : 0, stock * 12))

  return (
    <article className="group overflow-hidden rounded-[30px] border border-white/70 bg-white/80 shadow-lg shadow-slate-200/60 backdrop-blur transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/75 dark:shadow-none">
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-sky-100 via-indigo-100 to-fuchsia-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
        {product.image ? (
          <img
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            src={product.image}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
            <ImageOff className="h-10 w-10" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/55 to-transparent" />
        <div className="absolute left-4 top-4 inline-flex items-center rounded-full border border-white/35 bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {product.category || 'General'}
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
              SKU {product.sku}
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">{product.name}</h3>
          </div>
          <div
            className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${
              isAvailable
                ? 'border border-emerald-300/35 bg-emerald-500/20 text-emerald-50'
                : 'border border-rose-300/35 bg-rose-500/20 text-rose-50'
            }`}
          >
            {isAvailable ? 'Available' : 'Unavailable'}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Selling
            </p>
            <p className="mt-2 text-lg font-bold text-slate-950 dark:text-slate-100">
              {formatCurrency(product.sellingPrice || 0)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Buying
            </p>
            <p className="mt-2 text-lg font-bold text-slate-950 dark:text-slate-100">
              {formatCurrency(product.buyingPrice || 0)}
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isLowStock ? (
                <TriangleAlert className="h-4 w-4 text-amber-500" />
              ) : (
                <PackageCheck className="h-4 w-4 text-emerald-500" />
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {stock} units in stock
              </span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              {isLowStock ? 'Low stock' : 'Healthy'}
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className={`h-full rounded-full ${
                stock === 0 ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${stockWidth}%` }}
            />
          </div>
        </div>

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => onEdit?.(product)}
          type="button"
        >
          <Pencil className="h-4 w-4" />
          Edit Product
        </button>
      </div>
    </article>
  )
}

export default ProductCard
