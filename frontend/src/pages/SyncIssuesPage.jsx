import { Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import SyncIssueInspectModal from '@/components/sync-issues/SyncIssueInspectModal'
import SyncIssuesFilters from '@/components/sync-issues/SyncIssuesFilters'
import SyncIssuesList from '@/components/sync-issues/SyncIssuesList'
import SyncIssuesSummary from '@/components/sync-issues/SyncIssuesSummary'

function matchesFilter(issue, activeFilter) {
  if (activeFilter === 'all') {
    return true
  }

  if (activeFilter === 'failed') {
    return issue.severity === 'error' || issue.type === 'failed_queue_item'
  }

  if (activeFilter === 'conflict') {
    return issue.severity === 'warning' || issue.type === 'conflict_record'
  }

  return issue.entityType === activeFilter
}

function matchesSearch(issue, search) {
  if (!search) {
    return true
  }

  const haystack = [
    issue.title,
    issue.message,
    issue.entityType,
    issue.entityId,
    issue.code,
    issue.operation,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(search.toLowerCase())
}

function SyncIssuesPage({
  diagnostics,
  onRetryIssue,
  onIgnoreIssue,
  onRetryAll,
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [busyIssueId, setBusyIssueId] = useState(null)
  const [ignoredKeys, setIgnoredKeys] = useState([])

  const issues = diagnostics?.issues || []

  const visibleIssues = useMemo(() => {
    return issues.filter((issue) => {
      const issueKey = `${issue.type}-${issue.queueId || issue.entityId || issue.updatedAt}`

      if (ignoredKeys.includes(issueKey)) {
        return false
      }

      return matchesFilter(issue, activeFilter) && matchesSearch(issue, search)
    })
  }, [activeFilter, ignoredKeys, issues, search])

  const handleRetry = async (issue) => {
    const issueKey = issue.queueId || issue.entityId || null
    setBusyIssueId(issueKey)
    try {
      await onRetryIssue?.(issue)
    } finally {
      setBusyIssueId(null)
    }
  }

  const handleIgnore = async (issue) => {
    const issueKey = `${issue.type}-${issue.queueId || issue.entityId || issue.updatedAt}`
    setIgnoredKeys((current) => [...current, issueKey])
    await onIgnoreIssue?.(issue)
    if (selectedIssue && issueKey === `${selectedIssue.type}-${selectedIssue.queueId || selectedIssue.entityId || selectedIssue.updatedAt}`) {
      setSelectedIssue(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none sm:p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_55%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Sync health
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Sync Issues</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Review items that still need attention and keep your records safely up to date across devices.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            onClick={() => onRetryAll?.()}
            type="button"
          >
            Retry safe items
          </button>
        </div>
      </section>

      <SyncIssuesSummary
        conflictCount={diagnostics?.conflictCount || 0}
        failedCount={diagnostics?.failedCount || 0}
        lastSyncTime={diagnostics?.lastSyncTime || null}
        pendingCount={diagnostics?.pendingCount || 0}
      />

      <SyncIssuesFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onSearchChange={setSearch}
        search={search}
      />

      <SyncIssuesList
        busyIssueId={busyIssueId}
        issues={visibleIssues}
        onIgnore={handleIgnore}
        onInspect={setSelectedIssue}
        onRetry={handleRetry}
      />

      <SyncIssueInspectModal
        busy={busyIssueId === (selectedIssue?.queueId || selectedIssue?.entityId)}
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onIgnore={handleIgnore}
        onRetry={handleRetry}
        open={Boolean(selectedIssue)}
      />
    </div>
  )
}

export default SyncIssuesPage
