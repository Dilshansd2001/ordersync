import { FileText, MessageSquareText, Send, ShieldCheck, Store, Truck } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { hasPlanFeature } from '@/data/subscriptionPlans'
import { useAuth } from '@/hooks/useAuth'

const items = [
  { to: '/app/settings/profile', label: 'Business Profile', icon: Store },
  { to: '/app/settings/invoice', label: 'Invoice Settings', icon: FileText },
  { to: '/app/settings/sms', label: 'SMS Messages', icon: Send },
  { to: '/app/settings/team', label: 'Team Management', icon: ShieldCheck },
  { to: '/app/settings/whatsapp', label: 'WhatsApp', icon: MessageSquareText },
  { to: '/app/settings/courier', label: 'Courier Sync', icon: Truck },
]

function SettingsNav() {
  const { business } = useAuth()
  const visibleItems = items.filter((item) => {
    if (item.to === '/app/settings/team') {
      return hasPlanFeature(business, 'teamManagement')
    }

    if (item.to === '/app/settings/courier') {
      return hasPlanFeature(business, 'courierSync')
    }

    return true
  })

  return (
    <div className="flex flex-wrap gap-2 rounded-[24px] border border-white/60 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
      {visibleItems.map((item) => {
        const Icon = item.icon

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        )
      })}
    </div>
  )
}

export default SettingsNav
