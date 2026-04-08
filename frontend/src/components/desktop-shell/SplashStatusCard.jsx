import { LoaderCircle, ShieldCheck, WifiOff } from 'lucide-react'

function SplashStatusCard({ title, description, metadata }) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.18),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(7,18,36,0.96))] p-7 text-white shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3 text-cyan-200">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
          <LoaderCircle className="h-5 w-5 animate-spin" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/80">Bootstrap</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        </div>
      </div>

      <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">{description}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace</p>
          <p className="mt-2 text-sm font-semibold text-white">{metadata?.businessName || 'Checking tenant access'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <p className="text-xs uppercase tracking-[0.2em]">Plan</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-white">{metadata?.planName || 'Checking subscription'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <WifiOff className="h-4 w-4 text-cyan-300" />
            <p className="text-xs uppercase tracking-[0.2em]">App Version</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-white">{metadata?.appVersion || 'Preparing'}</p>
        </div>
      </div>
    </div>
  )
}

export default SplashStatusCard
