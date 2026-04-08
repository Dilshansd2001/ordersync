import { BarChart3, CreditCard, Shield, Users } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import ThemeToggle from '@/components/ThemeToggle'
import { logout as clearAuthState } from '@/features/authSlice'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { isDesktopRuntime } from '@/platform/runtime'

const navigation = [
  { to: '/super-admin/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/super-admin/sellers', label: 'Manage Sellers', icon: Users },
  { to: '/super-admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
]

function SuperAdminLayout({ onLogout }) {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const isDesktop = isDesktopRuntime()

  const handleLogout = async () => {
    if (isDesktop && onLogout) {
      await onLogout()
      return
    }

    dispatch(clearAuthState())
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell min-h-screen bg-slate-50 text-slate-900 dark:bg-transparent dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-80 border-r border-white/60 bg-slate-950/90 px-6 py-8 text-white backdrop-blur lg:block">
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-slate-950/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
              <Shield className="h-3.5 w-3.5" />
              Super Admin
            </div>
            <h1 className="mt-4 text-2xl font-bold">OrderSync Control Room</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Monitor sellers, subscriptions, shop health, and platform revenue from one workspace.
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-500/20 text-white ring-1 ring-inset ring-indigo-400/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Signed in as</p>
            <p className="mt-3 text-lg font-semibold text-white">{user?.name || 'Super Admin'}</p>
            <p className="mt-1 text-sm text-slate-400">{user?.email}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/50 bg-slate-950/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400">Platform workspace</p>
                <h2 className="text-2xl font-semibold text-white">Super Admin Panel</h2>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                <button
                  className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
                  onClick={handleLogout}
                  type="button"
                >
                  Sign out
                </button>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                  <div className="font-semibold text-white">{user?.name || 'Super Admin'}</div>
                  <div className="text-xs">{user?.email}</div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminLayout
