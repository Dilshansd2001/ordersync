import { AlertTriangle, RefreshCcw, X } from 'lucide-react'

function detailLine(label, value) {
  if (!value) {
    return null
  }

  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-b-0 dark:border-slate-800">
      <dt className="font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right text-slate-900 dark:text-white">{value}</dd>
    </div>
  )
}

function getRecommendation(issue) {
  if (issue?.severity === 'warning') {
    return 'Open the record, confirm the latest details, and retry when you are ready.'
  }

  if (issue?.entityType === 'order') {
    return 'Review this order carefully, then retry. Orders should not be ignored unless you are sure they are already handled.'
  }

  return 'Retry first. If the same issue comes back, review the record details before making changes.'
}

function SyncIssueInspectModal({ issue, open, onClose, onRetry, onIgnore, busy = false }) {
  if (!open || !issue) {
    return null
  }

  const showIgnore = issue.entityType !== 'order'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} type="button" />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/60 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Issue details</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {issue.title || issue.entityId || 'Sync issue'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{issue.message}</p>
            </div>
          </div>

          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              Recommended next step
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">{getRecommendation(issue)}</p>
          </section>

          <dl className="rounded-[24px] border border-slate-200 bg-white px-5 py-2 dark:border-slate-800 dark:bg-slate-950/70">
            {detailLine('Record type', issue.entityType)}
            {detailLine('Record ID', issue.entityId)}
            {detailLine('Status', issue.status)}
            {detailLine('Action', issue.operation)}
            {detailLine('Attempts', issue.attemptCount)}
            {detailLine('Updated', issue.updatedAt ? new Date(issue.updatedAt).toLocaleString() : null)}
            {detailLine('Code', issue.code)}
          </dl>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {showIgnore ? (
              <button
                className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                onClick={() => onIgnore?.(issue)}
                type="button"
              >
                Ignore for now
              </button>
            ) : null}

            <button
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={onClose}
              type="button"
            >
              Close
            </button>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              onClick={() => onRetry?.(issue)}
              type="button"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SyncIssueInspectModal
