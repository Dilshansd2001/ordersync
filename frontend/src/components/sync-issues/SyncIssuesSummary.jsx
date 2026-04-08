import { AlertTriangle, CheckCircle2, Clock3, RefreshCcw } from 'lucide-react'

const summaryCards = [
  {
    key: 'pendingCount',
    label: 'Pending Sync',
    description: 'Items waiting for internet or the next sync run.',
    icon: Clock3,
    tone:
      'from-sky-500 via-cyan-500 to-blue-600 text-white shadow-sky-500/20',
  },
  {
    key: 'failedCount',
    label: 'Needs Attention',
    description: 'Items that could not be sent successfully yet.',
    icon: AlertTriangle,
    tone:
      'from-amber-400 via-orange-500 to-rose-500 text-white shadow-orange-500/20',
  },
  {
    key: 'conflictCount',
    label: 'Conflicts',
    description: 'Items changed elsewhere and need a quick review.',
    icon: RefreshCcw,
    tone:
      'from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-fuchsia-500/20',
  },
]

function getSummaryMessage({ pendingCount, failedCount, conflictCount }) {
  if (!pendingCount && !failedCount && !conflictCount) {
    return {
      title: 'Everything is up to date',
      description: 'No sync issues need attention right now.',
      icon: CheckCircle2,
      tone:
        'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    }
  }

  if (failedCount > 0 || conflictCount > 0) {
    return {
      title: 'A few items need review',
      description: 'Most work is safe, but some items should be checked before the next sync.',
      icon: AlertTriangle,
      tone:
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
    }
  }

  return {
    title: 'Some items are still waiting to sync',
    description: 'The app will keep trying automatically when a connection is available.',
    icon: Clock3,
    tone:
      'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
  }
}

function formatLastSyncTime(lastSyncTime) {
  if (!lastSyncTime) {
    return 'Last sync: Not available yet'
  }

  return `Last sync: ${new Date(lastSyncTime).toLocaleString()}`
}

function SyncIssuesSummary({
  pendingCount = 0,
  failedCount = 0,
  conflictCount = 0,
  lastSyncTime = null,
}) {
  const message = getSummaryMessage({ pendingCount, failedCount, conflictCount })
  const MessageIcon = message.icon

  return (
    <section className="space-y-4">
      <div className={`flex items-start gap-3 rounded-[28px] border px-5 py-4 ${message.tone}`}>
        <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 dark:bg-white/10">
          <MessageIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold">{message.title}</h2>
          <p className="mt-1 text-sm leading-6 opacity-90">{message.description}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] opacity-75">
            {formatLastSyncTime(lastSyncTime)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon
          const value =
            card.key === 'pendingCount'
              ? pendingCount
              : card.key === 'failedCount'
                ? failedCount
                : conflictCount

          return (
            <article
              key={card.key}
              className={`relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br ${card.tone} p-6 shadow-xl dark:border-slate-800 dark:shadow-none`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_32%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white/80">{card.label}</p>
                  <p className="mt-4 text-3xl font-extrabold tracking-tight">{value}</p>
                  <p className="mt-4 text-sm text-white/80">{card.description}</p>
                </div>

                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <Icon className="h-6 w-6" />
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default SyncIssuesSummary
