import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart } from 'recharts'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AdminStats from '@/components/AdminStats'
import { fetchActivityLogs, fetchAdminOverview } from '@/store/adminSlice'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

const chartColors = ['#4f46e5', '#10b981', '#f97316', '#ec4899']

function SuperAdminDashboard() {
  const dispatch = useDispatch()
  const { overview, loading } = useSelector((state) => state.admin)

  useEffect(() => {
    dispatch(fetchAdminOverview())
    dispatch(fetchActivityLogs())
  }, [dispatch])

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none">
        <p className="text-sm font-medium text-sky-600 dark:text-sky-300">Platform overview</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Super Admin Dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Track seller growth, subscription movement, revenue, and operational activity across the entire OrderSync platform.
        </p>
      </section>

      <AdminStats stats={overview.stats} />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Revenue Trend</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monthly platform revenue from all sellers.</p>
          <div className="mt-6 h-80 rounded-[24px] bg-slate-50/80 p-3 dark:bg-slate-900/70">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.revenueTrend || []}>
                <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#020617',
                    border: '1px solid #1e293b',
                    borderRadius: '16px',
                    color: '#e2e8f0',
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Plan Distribution</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">How sellers are split across subscription tiers.</p>
          <div className="mt-6 h-80 rounded-[24px] bg-slate-50/80 p-3 dark:bg-slate-900/70">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: '#020617',
                    border: '1px solid #1e293b',
                    borderRadius: '16px',
                    color: '#e2e8f0',
                  }}
                />
                <Pie data={overview.planDistribution || []} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {(overview.planDistribution || []).map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Recent Activity</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Important seller and admin events across the system.</p>

        <div className="mt-6 space-y-3">
          {(overview.recentActivity || []).map((log) => (
            <div key={log._id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{log.description}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{log.action}</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(log.createdAt)}</p>
              </div>
            </div>
          ))}
          {!loading && !(overview.recentActivity || []).length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No recent platform activity yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default SuperAdminDashboard
