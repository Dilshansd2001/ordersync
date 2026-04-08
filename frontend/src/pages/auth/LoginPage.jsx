import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PageMeta from '@/components/PageMeta'
import { clearAuthError, loginUser } from '@/features/authSlice'

function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ email: '', password: '' })

  useEffect(() => {
    dispatch(clearAuthError())
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.redirectTo || '/app/dashboard', { replace: true })
    }
  }, [isAuthenticated, location.state?.redirectTo, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const result = await dispatch(loginUser(form))

    if (loginUser.fulfilled.match(result)) {
      const redirectTo =
        result.payload.user?.role === 'SUPER_ADMIN' ? '/super-admin/dashboard' : '/app/dashboard'
      navigate(redirectTo, { replace: true })
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta
        title="Sign In - OrderSync.lk"
        description="Access your OrderSync.lk workspace to manage orders, inventory, labels, reports, and customer operations."
      />

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-cyan-300">Welcome back</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">Sign in to OrderSync</h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Access your tenant workspace or the super admin panel from one secure login.</p>
      </div>

      {location.state?.banner ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          {location.state.banner}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10" onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email address" type="email" value={form.email} />
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10" onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Password" type="password" value={form.password} />
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</div> : null}
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-70 dark:bg-gradient-to-r dark:from-cyan-400 dark:via-blue-500 dark:to-indigo-500 dark:hover:brightness-110" disabled={loading} type="submit">
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        New to OrderSync?{' '}
        <Link className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-cyan-300 dark:hover:text-cyan-200" to="/register">
          Create your workspace
        </Link>
      </p>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Need to activate a new account?{' '}
        <Link className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-cyan-300 dark:hover:text-cyan-200" to="/verify-activation">
          Verify activation key
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
