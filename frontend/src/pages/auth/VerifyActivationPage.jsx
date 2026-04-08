import { KeyRound, LoaderCircle, MailCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageMeta from '@/components/PageMeta'
import { clearAuthError, verifyBusinessActivation } from '@/features/authSlice'

function VerifyActivationPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loading, error, isAuthenticated, pendingActivation } = useSelector((state) => state.auth)
  const [form, setForm] = useState({
    email: searchParams.get('email') || pendingActivation?.email || '',
    key: '',
  })

  useEffect(() => {
    dispatch(clearAuthError())
  }, [dispatch])

  useEffect(() => {
    if (pendingActivation?.email && !form.email) {
      setForm((current) => ({ ...current, email: pendingActivation.email }))
    }
  }, [form.email, pendingActivation])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard', {
        replace: true,
        state: { banner: 'Your workspace is activated and ready.' },
      })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    await dispatch(verifyBusinessActivation(form))
  }

  return (
    <div className="space-y-6">
      <PageMeta
        title="Verify Activation - OrderSync.lk"
        description="Enter the activation key for your new OrderSync.lk workspace before the first login."
      />

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-cyan-300">One final step</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">Verify your activation key</h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Your account is created. Once super admin confirms payment, the activation key will be sent to your business email.
        </p>
      </div>

      {pendingActivation?.email || form.email ? (
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50/80 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <MailCheck className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Activation key pending
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-700 dark:text-amber-100">
                Super admin has to review your payment manually. After approval, the activation key will be sent to{' '}
                <strong>{pendingActivation?.email || form.email}</strong>.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/65">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <KeyRound className="h-4 w-4" />
            Activation details
          </div>
          <div className="mt-4 space-y-4">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10"
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Business email"
              type="email"
              value={form.email}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10"
              onChange={(event) => setForm((current) => ({ ...current, key: event.target.value.toUpperCase() }))}
              placeholder="OSLK-XXXX-XXXX-XXXX-XXXX"
              value={form.key}
            />
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</div> : null}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-70 dark:bg-gradient-to-r dark:from-cyan-400 dark:via-blue-500 dark:to-indigo-500 dark:hover:brightness-110" disabled={loading} type="submit">
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Verifying...' : 'Verify and continue'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already active?{' '}
        <Link className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-cyan-300 dark:hover:text-cyan-200" to="/login">
          Go to sign in
        </Link>
      </p>
    </div>
  )
}

export default VerifyActivationPage
