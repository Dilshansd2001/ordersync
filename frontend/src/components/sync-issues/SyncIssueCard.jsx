import { AlertTriangle, Clock3, Package, ShoppingBag, UserRound } from 'lucide-react'
import SyncIssueActions from '@/components/sync-issues/SyncIssueActions'
import { cn } from '@/utils/cn'

const severityRank = {
  error: 0,
  warning: 1,
  info: 2,
}

const entityMeta = {
  order: {
    label: 'Order',
    icon: ShoppingBag,
  },
  product: {
    label: 'Product',
    icon: Package,
  },
  customer: {
    label: 'Customer',
    icon: UserRound,
  },
}

const severityTone = {
  error:
    'border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
  warning:
    'border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  info:
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
}

export function getIssueSortWeight(issue) {
  const severity = severityRank[issue?.severity] ?? 3
  const timestamp = issue?.updatedAt ? new Date(issue.updatedAt).getTime() : 0
  return [severity, -timestamp]
}

function getIssueTitle(issue) {
  if (issue?.title) {
    return issue.title
  }

  if (issue?.entityType === 'order') {
    return `Order ${issue.entityId || ''}`.trim()
  }

  if (issue?.entityType === 'product') {
    return `Product ${issue.entityId || ''}`.trim()
  }

  if (issue?.entityType === 'customer') {
    return `Customer ${issue.entityId || ''}`.trim()
  }

  return issue?.entityId || 'Sync item'
}

function getIssueSubtitle(issue) {
  if (issue?.message) {
    return issue.message
  }

  if (issue?.severity === 'warning') {
    return 'This item changed elsewhere and should be reviewed before the next sync.'
  }

  return 'This item still needs attention before everything is fully up to date.'
}

function formatWhen(updatedAt) {
  if (!updatedAt) {
    return 'Time not available'
  }

  return new Date(updatedAt).toLocaleString()
}

function SyncIssueCard({ issue, onRetry, onIgnore, onInspect, busy = false }) {
  const meta = entityMeta[issue?.entityType] || {
    label: 'Record',
    icon: AlertTriangle,
  }
  const Icon = meta.icon
  const tone = severityTone[issue?.severity] || severityTone.info

  return (
    <article className="rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Icon className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {meta.label}
              </p>
              <h3 className="truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                {getIssueTitle(issue)}
              </h3>
            </div>

            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]',
                tone
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {issue?.severity === 'error'
                ? 'Needs attention'
                : issue?.severity === 'warning'
                  ? 'Review needed'
                  : 'Pending'}
            </span>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {getIssueSubtitle(issue)}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              {formatWhen(issue?.updatedAt)}
            </span>
            {issue?.operation ? <span>{issue.operation}</span> : null}
            {issue?.attemptCount ? <span>{issue.attemptCount} attempts</span> : null}
          </div>
        </div>

        <div className="lg:min-w-[260px]">
          <SyncIssueActions
            busy={busy}
            issue={issue}
            onIgnore={onIgnore}
            onInspect={onInspect}
            onRetry={onRetry}
          />
        </div>
      </div>
    </article>
  )
}

export default SyncIssueCard
