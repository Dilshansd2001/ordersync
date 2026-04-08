import { ArrowRight, RefreshCcw, ShieldAlert } from 'lucide-react'
import PageMeta from '@/components/PageMeta'
import LicenseStatusPill from '@/components/desktop-shell/LicenseStatusPill'
import { openExternalLink } from '@/platform/externalLinks'

function SubscriptionInactiveShell({ accessMode, message, metadata, onLogout, onRetry }) {
  const handleRenewSubscription = (event) => {
    event.preventDefault()
    openExternalLink('https://ordersync.lk/#pricing')
  }

  return (
    <>
      <PageMeta title="Subscription Required - OrderSync.lk" description="This desktop workspace needs a valid subscription or online verification." />

      <div className="rounded-[32px] border border-rose-300/15 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(8,15,28,0.98))] p-7 text-white shadow-[0_28px_80px_rgba(2,6,23,0.45)] sm:p-8">
        <LicenseStatusPill accessMode={accessMode} status="inactive" />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Workspace access is currently blocked.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{message}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace</p>
            <p className="mt-2 text-sm font-semibold text-white">{metadata?.businessName || 'OrderSync.lk'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Plan</p>
            <p className="mt-2 text-sm font-semibold text-white">{metadata?.planName || 'Unknown'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldAlert className="h-4 w-4 text-rose-300" />
              <p className="text-xs uppercase tracking-[0.2em]">Next Step</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">
              {accessMode === 'blocked' ? 'Renew or reconnect' : 'Reconnect required'}
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(59,130,246,0.35)] transition hover:translate-y-[-1px]"
            onClick={onRetry}
            type="button"
          >
            Retry verification
            <RefreshCcw className="h-4 w-4" />
          </button>
          <a
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            href="https://ordersync.lk/#pricing"
            onClick={handleRenewSubscription}
          >
            Renew subscription
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

export default SubscriptionInactiveShell
