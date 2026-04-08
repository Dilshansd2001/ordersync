function LicenseStatusPill({ status, accessMode }) {
  const toneClass =
    status === 'valid'
      ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200'
      : status === 'trial_expired'
        ? 'border-amber-300/25 bg-amber-400/10 text-amber-200'
        : 'border-rose-300/25 bg-rose-400/10 text-rose-200'

  const label =
    accessMode === 'offline_grace'
      ? 'Offline grace access'
      : status === 'trial_expired'
        ? 'Trial expired'
        : status === 'inactive'
          ? 'Subscription inactive'
          : 'Subscription valid'

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${toneClass}`}>
      {label}
    </span>
  )
}

export default LicenseStatusPill
