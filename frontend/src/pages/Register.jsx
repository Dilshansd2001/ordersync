import { CheckCircle2, LoaderCircle, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageMeta from '@/components/PageMeta'
import { PUBLIC_SUBSCRIPTION_PLANS, subscriptionPlanMeta } from '@/data/subscriptionPlans'
import { clearAuthError, registerBusinessUser } from '@/features/authSlice'

function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)
  const [banner, setBanner] = useState('')
  const [form, setForm] = useState({
    businessName: '',
    phone: '',
    email: '',
    password: '',
    plan: PUBLIC_SUBSCRIPTION_PLANS.includes(searchParams.get('plan')) ? searchParams.get('plan') : 'GROWTH',
  })

  useEffect(() => {
    dispatch(clearAuthError())
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard', {
        replace: true,
        state: { banner: 'Welcome to OrderSync! Your workspace is ready.' },
      })
    }
  }, [isAuthenticated, navigate])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setBanner('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const result = await dispatch(
      registerBusinessUser({
        businessName: form.businessName,
        phone: form.phone,
        email: form.email,
        password: form.password,
        plan: form.plan,
      })
    )

    if (registerBusinessUser.fulfilled.match(result)) {
      setBanner(
        'Workspace created successfully. After payment review, super admin will send your activation key to your business email.'
      )
      navigate(`/verify-activation?email=${encodeURIComponent(form.email)}`, {
        replace: true,
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta
        title="Start Your Free Trial - OrderSync.lk"
        description="Create your OrderSync.lk workspace and start managing orders, labels, WhatsApp automation, and profit in one place."
      />

      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200">
          <Sparkles className="h-3.5 w-3.5" />
          Start free
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Launch your OrderSync workspace</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Create your business account, choose a plan, and wait for super admin approval before the first login.</p>
      </div>

      {banner ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{banner}</span>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10" onChange={(event) => updateField('businessName', event.target.value)} placeholder="Business name" value={form.businessName} />
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10" onChange={(event) => updateField('phone', event.target.value)} placeholder="Phone number" value={form.phone} />
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10" onChange={(event) => updateField('email', event.target.value)} placeholder="Business email" type="email" value={form.email} />
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10" onChange={(event) => updateField('password', event.target.value)} placeholder="Password" type="password" value={form.password} />

        <div className="grid gap-3 sm:grid-cols-2">
          {PUBLIC_SUBSCRIPTION_PLANS.map((plan) => (
            <button
              key={plan}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${form.plan === plan ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-cyan-400/40 dark:bg-cyan-500/10 dark:text-cyan-200' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
              onClick={() => updateField('plan', plan)}
              type="button"
            >
              <div className="text-left">
                <p>{subscriptionPlanMeta[plan].label}</p>
                <p className="mt-1 text-xs font-normal opacity-80">
                  {subscriptionPlanMeta[plan].price} {subscriptionPlanMeta[plan].cadence}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
          <span className="font-semibold text-slate-800 dark:text-slate-100">{subscriptionPlanMeta[form.plan].label}</span>
          <span className="ml-2">{subscriptionPlanMeta[form.plan].description}</span>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</div> : null}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-70 dark:bg-gradient-to-r dark:from-cyan-400 dark:via-blue-500 dark:to-indigo-500 dark:hover:brightness-110" disabled={loading} type="submit">
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Creating workspace...' : 'Create My Account'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already registered?{' '}
        <Link className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-cyan-300 dark:hover:text-cyan-200" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default Register
