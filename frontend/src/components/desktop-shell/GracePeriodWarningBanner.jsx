import { AlertTriangle } from 'lucide-react'

function GracePeriodWarningBanner({ graceExpiresAt }) {
  const formattedExpiry = graceExpiresAt
    ? new Date(graceExpiresAt).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <AlertTriangle className="h-4 w-4 flex-none text-amber-600" />
        Offline grace access is active.
        {formattedExpiry ? ` Reconnect before ${formattedExpiry} to avoid workspace lockout.` : ' Reconnect soon to refresh subscription status.'}
      </div>
    </div>
  )
}

export default GracePeriodWarningBanner
