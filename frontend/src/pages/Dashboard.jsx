import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Clock3, Package, ShoppingBag, Sparkles, Users, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import SignalLoader from '@/components/SignalLoader'
import StatsCard from '@/components/StatsCard'
import { useAuth } from '@/hooks/useAuth'
import { isDesktopRuntime } from '@/platform/runtime'
import { getOfflineDashboardStats, offlineAnalyticsDefaults } from '@/services/offlineAnalytics'
import analyticsService from '@/services/analyticsService'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

const DashboardCharts = lazy(() => import('@/components/DashboardCharts'))

function DashboardChartsFallback() {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75"
        >
          <div className="mb-4 flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            <SignalLoader />
            Rendering analytics view...
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-72 rounded-[24px] bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </section>
  )
}

const statusPillMap = {
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20',
  DISPATCHED: 'bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/20',
  RETURNED: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/20',
}

function Dashboard() {
  const { business, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    ...offlineAnalyticsDefaults.dashboard,
  })
  const isDesktop = isDesktopRuntime()
  const hasWorkspaceContext = Boolean(user && business)

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('en-LK', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    []
  )

  useEffect(() => {
    if (!location.state?.banner) {
      return
    }

    toast.success(location.state.banner)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!hasWorkspaceContext) {
      return
    }

    if (isDesktop) {
      const loadOfflineDashboardStats = async () => {
        try {
          setLoading(true)
          const data = await getOfflineDashboardStats()
          setStats(data)
        } catch {
          setStats(offlineAnalyticsDefaults.dashboard)
        } finally {
          setLoading(false)
        }
      }

      loadOfflineDashboardStats()
      return
    }

    const loadDashboardStats = async () => {
      try {
        setLoading(true)
        const response = await analyticsService.getDashboardStats()
        setStats(response.data)
      } catch {
        setStats(offlineAnalyticsDefaults.dashboard)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardStats()
  }, [hasWorkspaceContext, isDesktop])

  const metrics = [
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString('en-LK'),
      subtitle: 'Live order volume',
      gradient: 'from-sky-500 via-indigo-500 to-violet-600',
      iconTone: 'bg-white/20 text-white',
      icon: ShoppingBag,
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.totalRevenue),
      subtitle: 'Revenue across all orders',
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      iconTone: 'bg-white/20 text-white',
      icon: Wallet,
    },
    {
      title: 'Pending Dispatches',
      value: stats.pendingDispatches.toLocaleString('en-LK'),
      subtitle: 'Awaiting fulfillment',
      gradient: 'from-amber-400 via-orange-500 to-rose-500',
      iconTone: 'bg-white/20 text-white',
      icon: Clock3,
    },
    {
      title: 'Active Customers',
      value: stats.activeCustomers.toLocaleString('en-LK'),
      subtitle: 'Tenant customer base',
      gradient: 'from-fuchsia-500 via-pink-500 to-rose-500',
      iconTone: 'bg-white/20 text-white',
      icon: Users,
    },
  ]

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 px-6 py-7 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none sm:px-8">
        <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              {today}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Welcome back, {user?.name || 'Dilshan'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
              Your order pipeline is moving well today. Here is a fast read on revenue,
              dispatch activity, and customer momentum.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/60 bg-gradient-to-br from-slate-950 to-slate-800 px-5 py-4 text-white shadow-lg dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
              Fulfillment health
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold">93.2% on-time delivery</p>
                <p className="text-sm text-white/65">Above your last 30-day average</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <StatsCard
            key={metric.title}
            gradient={metric.gradient}
            icon={metric.icon}
            iconTone={metric.iconTone}
            loading={loading}
            subtitle={metric.subtitle}
            title={metric.title}
            value={metric.value}
          />
        ))}
      </section>

      <Suspense fallback={<DashboardChartsFallback />}>
        <DashboardCharts
          loading={loading}
          revenueTrend={stats.revenueTrend}
          statusDistribution={stats.statusDistribution}
        />
      </Suspense>

      <section className="rounded-[32px] border border-white/60 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 px-6 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Recent Orders
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Latest activity across your fulfillment workflow.
            </p>
          </div>
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {isDesktop ? 'Offline snapshot' : 'Live snapshot'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/40 dark:divide-slate-800 dark:bg-transparent">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                      </td>
                    </tr>
                  ))
                : stats.recentOrders.map((order) => (
                    <tr key={order._id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-900/45">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{order.orderId}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        <div>{order.customerName}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {order.district || 'District unavailable'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(order.totalAmount || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                            statusPillMap[order.status] ||
                            'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              {!loading && !stats.recentOrders.length ? (
                <tr>
                  <td className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400" colSpan="4">
                    No recent orders available yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
        {isDesktop
          ? 'Dashboard summary now uses your local desktop data. Cloud analytics will refresh again when the desktop sync finishes online.'
          : 'Metrics and charts refresh from your live analytics endpoint.'}
      </div>
    </div>
  )
}

export default Dashboard
