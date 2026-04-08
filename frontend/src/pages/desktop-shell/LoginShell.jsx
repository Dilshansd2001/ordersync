import { LoaderCircle, LockKeyhole, Wifi } from 'lucide-react'
import { useState } from 'react'
import desktopLoginLogo from '@/assets/branding/ordersync-logo-dark.png'
import PageMeta from '@/components/PageMeta'
import {
  openExternalLink,
  ORDER_SYNC_FORGOT_PASSWORD_URL,
  ORDER_SYNC_REGISTER_URL,
} from '@/platform/externalLinks'

const loginInputClassName =
  'w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'

const loginInputStyle = {
  color: '#0f172a',
  WebkitTextFillColor: '#0f172a',
  caretColor: '#0f172a',
}

function LoginShell({ error, isSubmitting, onSubmit }) {
  const [form, setForm] = useState({ email: '', password: '' })

  const handleOpenPricing = (event) => {
    event.preventDefault()
    openExternalLink(ORDER_SYNC_REGISTER_URL)
  }

  const handleForgotPassword = (event) => {
    event.preventDefault()
    openExternalLink(ORDER_SYNC_FORGOT_PASSWORD_URL)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <>
      <PageMeta title="Desktop Sign In - OrderSync.lk" description="Sign in to link this desktop device to your OrderSync.lk workspace." />

      <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr] lg:items-center">
        <div>
          <img alt="OrderSync.lk" className="block h-auto w-[320px] max-w-full object-contain sm:w-[440px]" src={desktopLoginLogo} />
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-cyan-200">Desktop sign-in</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Sign in to link this device to your seller workspace.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            First login must happen online so OrderSync.lk can verify your account, device, workspace, and current plan.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
              <Wifi className="h-5 w-5 text-cyan-300" />
              <p className="mt-4 text-base font-semibold text-white">Online first-run check</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Your first desktop sign-in validates this device and stores a secure local session.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
              <LockKeyhole className="h-5 w-5 text-emerald-300" />
              <p className="mt-4 text-base font-semibold text-white">Main-process session storage</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Tokens stay in the Electron security boundary, not in renderer state.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(9,16,30,0.96))] p-6 shadow-[0_28px_80px_rgba(2,6,23,0.45)]">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">Welcome back</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">Open your desktop workspace</h2>
            </div>

            <input
              className={loginInputClassName}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email address"
              style={loginInputStyle}
              type="email"
              value={form.email}
            />
            <input
              className={loginInputClassName}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Password"
              style={loginInputStyle}
              type="password"
              value={form.password}
            />

            {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(59,130,246,0.35)] transition hover:translate-y-[-1px]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-slate-400">
              <button
                className="font-medium text-cyan-200 transition hover:text-white"
                onClick={handleOpenPricing}
                type="button"
              >
                Start free trial
              </button>
              <button
                className="font-medium transition hover:text-white"
                onClick={handleForgotPassword}
                type="button"
              >
                Forgot password
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default LoginShell
