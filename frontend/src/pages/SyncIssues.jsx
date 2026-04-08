import { AlertTriangle, Laptop, RefreshCcw, WifiOff } from 'lucide-react'
import SyncIssuesPage from '@/pages/SyncIssuesPage'
import { useSyncDiagnostics } from '@/hooks/useSyncDiagnostics'
import { getRuntimeMode } from '@/platform/runtime'

function LoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[28px] border border-white/50 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
        >
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-72 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-32 rounded-[24px] bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

function WebModeFallback() {
  return (
    <section className="rounded-[32px] border border-white/60 bg-white/80 px-6 py-16 text-center shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-500/20">
        <Laptop className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Sync Issues are available in desktop mode</h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
        The web app continues to use the live cloud API directly, so there is no local sync queue to review here.
      </p>
    </section>
  )
}

function ErrorState({ error, onRetry }) {
  return (
    <section className="rounded-[32px] border border-rose-200 bg-rose-50/90 p-6 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-rose-600 dark:bg-white/10 dark:text-rose-200">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-rose-900 dark:text-rose-100">
              Sync details could not be loaded
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-700 dark:text-rose-200">
              {error?.message || 'Please try again in a moment.'}
            </p>
          </div>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
          onClick={onRetry}
          type="button"
        >
          <RefreshCcw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </section>
  )
}

function DesktopShell({ diagnostics, refreshing, onRefresh, onRetryIssue, onRetryAllSafeItems, onTriggerSync }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          disabled={refreshing}
          onClick={onRefresh}
          type="button"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          disabled={refreshing}
          onClick={onTriggerSync}
          type="button"
        >
          <WifiOff className="h-4 w-4" />
          Run sync now
        </button>
      </div>

      <SyncIssuesPage
        diagnostics={diagnostics}
        onIgnoreIssue={async () => null}
        onRetryAll={onRetryAllSafeItems}
        onRetryIssue={onRetryIssue}
      />
    </div>
  )
}

function SyncIssues() {
  const runtimeMode = getRuntimeMode()
  const { diagnostics, loading, refreshing, error, refresh, retryIssue, retryAllSafeItems, triggerSync } =
    useSyncDiagnostics()

  if (runtimeMode !== 'desktop') {
    return <WebModeFallback />
  }

  if (loading && !diagnostics) {
    return <LoadingState />
  }

  if (error && !diagnostics) {
    return <ErrorState error={error} onRetry={refresh} />
  }

  return (
    <DesktopShell
      diagnostics={diagnostics}
      onRefresh={refresh}
      onRetryAllSafeItems={retryAllSafeItems}
      onRetryIssue={retryIssue}
      onTriggerSync={triggerSync}
      refreshing={refreshing}
    />
  )
}

export default SyncIssues
