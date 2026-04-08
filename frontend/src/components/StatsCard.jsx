function StatsCard({ title, value, icon: Icon, subtitle, gradient, iconTone, loading = false }) {
  return (
    <article
      className={`relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br ${gradient} p-6 text-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:shadow-none`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_28%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white/78">{title}</p>
          {loading ? (
            <div className="mt-4 h-10 w-32 animate-pulse rounded-2xl bg-white/20" />
          ) : (
            <p className="mt-4 text-3xl font-extrabold tracking-tight">{value}</p>
          )}
          <p className="mt-4 text-sm text-white/80">{subtitle}</p>
        </div>

        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconTone}`}>
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </article>
  )
}

export default StatsCard
