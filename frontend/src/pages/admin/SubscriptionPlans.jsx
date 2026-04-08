import { Activity, CreditCard, ScrollText } from 'lucide-react'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchActivityLogs, fetchAdminOverview } from '@/store/adminSlice'
import { formatDate } from '@/utils/formatDate'

function SubscriptionPlans() {
  const dispatch = useDispatch()
  const { overview, logs } = useSelector((state) => state.admin)

  useEffect(() => {
    dispatch(fetchAdminOverview())
    dispatch(fetchActivityLogs())
  }, [dispatch])

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none">
        <p className="text-sm font-medium text-sky-600 dark:text-sky-300">Commercial controls</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Subscriptions & Activity
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Watch plan adoption, review changes, and audit seller lifecycle actions from one place.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {(overview.planDistribution || []).map((plan) => (
          <article key={plan.name} className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{plan.name} Plan</p>
                <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{plan.value}</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Subscription Logic</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Suggested controls for the platform.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              Super Admin can manually switch sellers between `FREE_TRIAL`, `STARTER`, `GROWTH`, and `PRO`.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              `planExpiryDate` can be used to flag expired subscriptions and suspend the shop automatically.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              Activity logs capture admin interventions like seller suspension, reactivation, and plan changes.
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-50 p-3 text-orange-600 dark:bg-orange-500/10 dark:text-orange-200">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Activity Logs</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Recent seller and super-admin events.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {logs.map((log) => (
              <div key={log._id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{log.description}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{log.action}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(log.createdAt)}</p>
                </div>
              </div>
            ))}
            {!logs.length ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No activity logs available yet.
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  )
}

export default SubscriptionPlans
