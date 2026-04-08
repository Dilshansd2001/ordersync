import { LayoutDashboard, ShoppingCart } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
]

function Sidebar() {
  return (
    <aside className="w-full rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur md:max-w-xs">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-600">OrderSync.lk</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Social commerce OS</h1>
        <p className="mt-2 text-sm text-slate-500">Multi-tenant operations for growing Sri Lankan businesses.</p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-600 hover:bg-amber-50 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
