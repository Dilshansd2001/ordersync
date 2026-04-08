import { ArrowRight, Clock3 } from 'lucide-react'
import PageMeta from '@/components/PageMeta'
import LicenseStatusPill from '@/components/desktop-shell/LicenseStatusPill'
import { openExternalLink } from '@/platform/externalLinks'

function TrialExpiredShell({ metadata, onLogout }) {
  const handleUpgradePlan = (event) => {
    event.preventDefault()
    openExternalLink('https://ordersync.lk/#pricing')
  }

  return (
    <>
      <PageMeta title="Trial Expired - OrderSync.lk" description="Your OrderSync.lk desktop trial has expired." />

      <div className="rounded-[32px] border border-amber-300/15 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(8,15,28,0.98))] p-7 text-white shadow-[0_28px_80px_rgba(2,6,23,0.45)] sm:p-8">
        <LicenseStatusPill accessMode="blocked" status="trial_expired" />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Your trial has expired.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Upgrade the {metadata?.businessName || 'workspace'} plan to reopen the desktop workspace and continue syncing orders, customers, dispatch, and reports.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace</p>
            <p className="mt-2 text-sm font-semibold text-white">{metadata?.businessName || 'OrderSync.lk'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Last Plan</p>
            <p className="mt-2 text-sm font-semibold text-white">{metadata?.planName || 'Trial'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock3 className="h-4 w-4 text-amber-300" />
              <p className="text-xs uppercase tracking-[0.2em]">Status</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">Upgrade required</p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(59,130,246,0.35)] transition hover:translate-y-[-1px]"
            href="https://ordersync.lk/#pricing"
            onClick={handleUpgradePlan}
          >
            Upgrade your plan
            <ArrowRight className="h-4 w-4" />
          </a>
          <button
            className="rounded-2xl border border-white/10 bg-white/6 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            onClick={onLogout}
            type="button"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}

export default TrialExpiredShell
