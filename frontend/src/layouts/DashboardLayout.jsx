import { useMemo, useState } from 'react'
import {
  Boxes,
  ChevronDown,
  LayoutDashboard,
  Menu,
  PieChart,
  RefreshCcw,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import ThemeToggle from '@/components/ThemeToggle'
import BrandLogo from '@/components/BrandLogo'
import ChatbotWidget from '@/components/chatbot/ChatbotWidget'
import NotificationCenter from '@/components/NotificationCenter'
import { hasPlanFeature } from '@/data/subscriptionPlans'
import { logout as clearAuthState } from '@/features/authSlice'
import { useAuth } from '@/hooks/useAuth'
import { useDispatch } from 'react-redux'
import { isDesktopRuntime } from '@/platform/runtime'
import { useTheme } from '@/hooks/useTheme'

const navigation = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/app/customers', label: 'Customers', icon: Users },
  { to: '/app/inventory', label: 'Inventory', icon: Boxes },
  { to: '/app/expenses', label: 'Expenses', icon: Receipt },
  { to: '/app/sync-issues', label: 'Sync Issues', icon: RefreshCcw },
  { to: '/app/reports', label: 'Reports', icon: PieChart },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

function DashboardLayout({ onLogout }) {
  const dispatch = useDispatch()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { business, user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const isDesktop = isDesktopRuntime()
  const navigationItems = navigation.filter((item) => {
    if (user?.role === 'STAFF' && (item.to === '/reports' || item.to.startsWith('/settings'))) {
      return false
    }

    if (item.to === '/app/inventory' && !hasPlanFeature(business, 'inventory')) {
      return false
    }

    if (item.to === '/app/expenses' && !hasPlanFeature(business, 'expenses')) {
      return false
    }

    if (item.to === '/app/reports' && !hasPlanFeature(business, 'reports')) {
      return false
    }

    return true
  })

  const handleLogout = async () => {
    setProfileOpen(false)

    if (isDesktop && onLogout) {
      await onLogout()
      return
    }

    dispatch(clearAuthState())
    navigate('/login', { replace: true })
  }

  const initials = useMemo(() => {
    const source = user?.name || business?.name || 'OS'

    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }, [business?.name, user?.name])

  const businessName = business?.name || 'OrderSync.lk'
  const userName = user?.name || 'Workspace Owner'
  const canUseAiAssistant = hasPlanFeature(business, 'aiAssistant')

  return (
    <div className="app-shell min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-transparent dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <button
          className="fixed left-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/70 bg-white/80 text-slate-700 shadow-sm backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
          onClick={() => setSidebarOpen(true)}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>

        {sidebarOpen ? (
          <button
            aria-label="Close sidebar overlay"
            className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            type="button"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-80 border-r border-white/60 bg-white/85 px-6 py-6 shadow-xl shadow-slate-200/60 backdrop-blur transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-none lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:self-start lg:translate-x-0 lg:shadow-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <BrandLogo
                className="justify-start"
                containerClassName="h-[88px] items-center"
                imageClassName="w-[240px] sm:w-[280px]"
                mode="adaptive"
                size="lg"
              />
              <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {business?.tagline || 'Commerce command center'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                A focused workspace for orders, customers, and operational flow.
              </p>
            </div>

            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-10 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-50 to-indigo-50 text-indigo-700 shadow-sm ring-1 ring-inset ring-sky-100 dark:from-sky-500/15 dark:to-indigo-500/15 dark:text-sky-100 dark:ring-sky-500/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      item.to === '/app/dashboard'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-10 rounded-[24px] border border-white/60 bg-gradient-to-br from-slate-50 to-white p-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Current workspace
            </p>
            <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{businessName}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{business?.tagline || 'Multi-tenant SaaS foundation active'}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/50 bg-slate-50/75 backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10 lg:py-5">
              <div className="min-w-0 self-center">
                <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                  Workspace: {businessName}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                <NotificationCenter workspaceKey={business?.entityId || business?.name || 'workspace'} />

                <div className="relative">
                  <button
                    className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-3 py-2 shadow-sm backdrop-blur transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-slate-700"
                    onClick={() => setProfileOpen((open) => !open)}
                    type="button"
                  >
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-indigo-600 text-sm font-semibold text-white">
                      {business?.logo ? (
                        <img alt="Workspace logo" className="h-full w-full object-cover" src={business.logo} />
                      ) : (
                        initials || 'OS'
                      )}
                    </span>
                    <span className="hidden text-left sm:block">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">{userName}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{user?.email || 'admin@ordersync.lk'}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </button>

                  {profileOpen ? (
                    <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/60 bg-white/90 p-2 shadow-md backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
                      <div className="rounded-xl px-3 py-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{userName}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{businessName}</p>
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-slate-800" />
                      <button
                        className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        onClick={() => {
                          setProfileOpen(false)
                          navigate('/app/settings/profile')
                        }}
                        type="button"
                      >
                        Profile settings
                      </button>
                      <button
                        className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
                        onClick={handleLogout}
                        type="button"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 bg-transparent px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
      {canUseAiAssistant ? <ChatbotWidget /> : null}
    </div>
  )
}

export default DashboardLayout
