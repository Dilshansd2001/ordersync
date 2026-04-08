import { CloudOff, ShieldCheck } from 'lucide-react'
import SyncIssueCard, { getIssueSortWeight } from '@/components/sync-issues/SyncIssueCard'

function compareIssues(a, b) {
  const [severityA, timeA] = getIssueSortWeight(a)
  const [severityB, timeB] = getIssueSortWeight(b)

  if (severityA !== severityB) {
    return severityA - severityB
  }

  return timeA - timeB
}

function SyncIssuesList({ issues = [], onRetry, onIgnore, onInspect, busyIssueId = null }) {
  const sortedIssues = [...issues].sort(compareIssues)

  if (!sortedIssues.length) {
    return (
      <section className="rounded-[32px] border border-white/60 bg-white/80 px-6 py-16 text-center shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
          No sync issues right now
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          Everything that needs to sync is either complete or still quietly waiting in the background.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      {sortedIssues.map((issue) => (
        <SyncIssueCard
          key={`${issue.type}-${issue.queueId || issue.entityId || issue.updatedAt}`}
          busy={busyIssueId === issue.queueId || busyIssueId === issue.entityId}
          issue={issue}
          onIgnore={onIgnore}
          onInspect={onInspect}
          onRetry={onRetry}
        />
      ))}

      <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
        <div className="flex items-start gap-3">
          <CloudOff className="mt-0.5 h-4 w-4 flex-none" />
          <p>
            Sync issues do not always stop work immediately. The safest next step is usually to retry first, then inspect
            anything that still needs review.
          </p>
        </div>
      </div>
    </section>
  )
}

export default SyncIssuesList
