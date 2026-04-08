import { AlertTriangle, Boxes, PackagePlus, Sparkles, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import AddProductModal from '@/components/AddProductModal'
import ProductCard from '@/components/ProductCard'
import SignalLoader from '@/components/SignalLoader'
import StatsCard from '@/components/StatsCard'
import { fetchProducts } from '@/features/inventorySlice'
import { formatCurrency } from '@/utils/formatCurrency'

const metricCards = [
  {
    key: 'totalProducts',
    label: 'Total Products',
    icon: Boxes,
    subtitle: 'Visible across your catalog',
    gradient: 'from-sky-500 via-indigo-500 to-violet-600',
    iconTone: 'bg-white/20 text-white',
  },
  {
    key: 'lowStock',
    label: 'Low Stock Alerts',
    icon: AlertTriangle,
    subtitle: 'Items that need quick attention',
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    iconTone: 'bg-white/20 text-white',
  },
  {
    key: 'inventoryValue',
    label: 'Inventory Value',
    icon: WalletCards,
    subtitle: 'Based on buying price x stock',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    iconTone: 'bg-white/20 text-white',
  },
]

function Inventory() {
  const dispatch = useDispatch()
  const { products, loading } = useSelector((state) => state.inventory)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  const metrics = useMemo(
    () => ({
      totalProducts: products.length,
      lowStock: products.filter((product) => Number(product.stockCount || 0) < 5).length,
      inventoryValue: products.reduce(
        (sum, product) => sum + Number(product.buyingPrice || 0) * Number(product.stockCount || 0),
        0
      ),
    }),
    [products]
  )

  const getProductKey = (product) => product?._id || product?.entityId || product?.entity_id

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none sm:p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_55%)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Inventory workspace
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Product Catalog
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Track stock, pricing, and product performance from one premium inventory hub.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-400 hover:to-indigo-500"
            onClick={() => {
              setSelectedProduct(null)
              setIsModalOpen(true)
            }}
            type="button"
          >
            <PackagePlus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {metricCards.map((card) => {
          const value = card.key === 'inventoryValue' ? formatCurrency(metrics[card.key]) : metrics[card.key]

          return (
            <StatsCard
              key={card.key}
              gradient={card.gradient}
              icon={card.icon}
              iconTone={card.iconTone}
              subtitle={card.subtitle}
              title={card.label}
              value={value}
            />
          )
        })}
      </section>

      <section className="rounded-[32px] border border-white/60 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Visual inventory grid
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Products synced with your order workflow, images, and stock levels.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {products.length} products
          </div>
        </div>

        {loading ? (
          <div className="space-y-5 px-6 py-6">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              <SignalLoader />
              Preparing colorful catalog cards...
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[30px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="h-52 animate-pulse bg-gradient-to-br from-sky-100 via-indigo-100 to-fuchsia-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800" />
                  <div className="space-y-4 p-5">
                    <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                      <div className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="h-24 animate-pulse rounded-[24px] bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : products.length ? (
          <div className="px-6 py-6">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={getProductKey(product)}
                  onEdit={(nextProduct) => {
                    setSelectedProduct(nextProduct)
                    setIsModalOpen(true)
                  }}
                  product={product}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25">
              <Boxes className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              No products yet
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Start by adding products so order entry can deduct stock automatically.
            </p>
          </div>
        )}
      </section>

      <AddProductModal
        onClose={() => {
          setIsModalOpen(false)
          setSelectedProduct(null)
        }}
        onSuccess={(message) => toast.success(message)}
        product={selectedProduct}
        open={isModalOpen}
      />
    </div>
  )
}

export default Inventory
