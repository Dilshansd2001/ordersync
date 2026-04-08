import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { formatCurrency } from '@/utils/formatCurrency'

const statusColorMap = {
  PENDING: '#f59e0b',
  DISPATCHED: '#4f46e5',
  DELIVERED: '#10b981',
  RETURNED: '#f43f5e',
}

const chartTooltipStyle = {
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#ffffff',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
}

function ChartSkeleton() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-72 rounded-[24px] bg-slate-100 dark:bg-slate-900" />
      </div>
    </div>
  )
}

function DashboardCharts({ loading, revenueTrend, statusDistribution }) {
  const hasRevenueTrend =
    Array.isArray(revenueTrend) && revenueTrend.some((entry) => Number(entry?.revenue || 0) > 0)
  const hasStatusDistribution =
    Array.isArray(statusDistribution) && statusDistribution.some((entry) => Number(entry?.value || 0) > 0)

  if (loading) {
    return (
      <section className="grid gap-4 xl:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </section>
    )
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none sm:p-7">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Revenue Trend</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Last 7 days of order revenue across your workspace.
          </p>
        </div>

        <div className="h-80 rounded-[24px] bg-slate-50/70 p-3 dark:bg-slate-900/80">
          {hasRevenueTrend ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 6" />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#dashboardRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-white/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
              Revenue analytics will appear when chart data is available.
            </div>
          )}
        </div>
      </article>

      <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none sm:p-7">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Order Status Mix</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Current distribution of orders across fulfillment stages.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
          <div className="h-80 rounded-[24px] bg-slate-50/70 p-3 dark:bg-slate-900/80">
            {hasStatusDistribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => `${value} orders`} />
                  <Pie
                    data={statusDistribution.filter((entry) => entry.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={108}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.name} fill={statusColorMap[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-white/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
                Order status analytics will appear when distribution data is available.
              </div>
            )}
          </div>

          <div className="space-y-3">
            {statusDistribution.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: statusColorMap[entry.name] || '#94a3b8' }}
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{entry.name}</span>
                </div>
                <span className="text-sm font-semibold text-slate-950 dark:text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </article>
    </section>
  )
}

export default DashboardCharts
