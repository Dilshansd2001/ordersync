import { CreditCard, DollarSign, Store, Users } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'

const statConfig = [
  { key: 'totalSellers', label: 'Total Sellers', icon: Users, color: 'from-blue-600 to-indigo-700' },
  { key: 'activeShops', label: 'Active Shops', icon: Store, color: 'from-emerald-500 to-teal-600' },
  { key: 'subscribedUsers', label: 'Subscribed Users', icon: CreditCard, color: 'from-fuchsia-600 to-pink-600' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: DollarSign, color: 'from-orange-500 to-red-600' },
]

function AdminStats({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {statConfig.map((item) => {
        const Icon = item.icon
        const value =
          item.key === 'totalRevenue'
            ? formatCurrency(stats?.[item.key] || 0)
            : Number(stats?.[item.key] || 0).toLocaleString('en-LK')

        return (
          <div key={item.key} className={`rounded-2xl bg-gradient-to-br ${item.color} p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm opacity-80">{item.label}</p>
                <h3 className="mt-1 text-3xl font-bold">{value}</h3>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AdminStats
