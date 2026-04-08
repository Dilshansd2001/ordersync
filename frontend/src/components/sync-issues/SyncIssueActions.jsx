import { Eye, RefreshCcw, X } from 'lucide-react'

function SyncIssueActions({ issue, onRetry, onIgnore, onInspect, busy = false }) {
  const isOrder = issue?.entityType === 'order'
  const canIgnore = !isOrder

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <button
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={busy}
        onClick={() => onRetry?.(issue)}
        type="button"
      >
        <RefreshCcw className="h-4 w-4" />
        Retry
      </button>

      <button
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        onClick={() => onInspect?.(issue)}
        type="button"
      >
        <Eye className="h-4 w-4" />
        Inspect
      </button>

      {canIgnore ? (
        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          onClick={() => onIgnore?.(issue)}
          type="button"
        >
          <X className="h-4 w-4" />
          Ignore
        </button>
      ) : null}
    </div>
  )
}

export default SyncIssueActions
