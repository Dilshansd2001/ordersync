import { useState } from 'react'
import { SUBSCRIPTION_PLANS } from '@/data/subscriptionPlans'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

const planOptions = SUBSCRIPTION_PLANS

function SellerManagementTable({ loading, sellers, onSendActivationKey, onUpdate }) {
  const [savingId, setSavingId] = useState('')

  const handleQuickUpdate = async (seller, field, value) => {
    try {
      setSavingId(seller._id)
      await onUpdate?.(seller._id, {
        subscriptionPlan: field === 'subscriptionPlan' ? value : seller.subscriptionPlan,
        status: field === 'status' ? value : seller.status,
      })
    } finally {
      setSavingId('')
    }
  }

  if (loading && !sellers.length) {
    return (
      <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80">
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid animate-pulse gap-3 rounded-xl bg-slate-900/70 p-4 md:grid-cols-5">
              <div className="h-5 rounded bg-slate-800" />
              <div className="h-5 rounded bg-slate-800" />
              <div className="h-5 rounded bg-slate-800" />
              <div className="h-5 rounded bg-slate-800" />
              <div className="h-5 rounded bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-[#111827]">
      <table className="w-full text-left text-gray-300">
        <thead className="bg-gray-800/50 text-xs uppercase text-gray-400">
          <tr>
            <th className="p-4">Seller Name</th>
            <th className="p-4">Shop Name</th>
            <th className="p-4">Plan</th>
            <th className="p-4">Status</th>
            <th className="p-4">Revenue</th>
            <th className="p-4">Created</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {sellers.map((seller) => (
            <tr key={seller._id} className="transition hover:bg-gray-800/30">
              <td className="p-4">
                <div className="font-medium text-white">{seller.sellerName}</div>
                <div className="mt-1 text-xs text-gray-400">{seller.sellerEmail}</div>
              </td>
              <td className="p-4">{seller.shopName || 'N/A'}</td>
              <td className="p-4">
                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                  {seller.subscriptionPlan || 'FREE_TRIAL'}
                </span>
              </td>
              <td className="p-4">
                <span className={`mr-2 inline-block h-2 w-2 rounded-full ${seller.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                {seller.status}
                <div className="mt-1 text-xs text-amber-300">
                  Activation: {seller.activationStatus || 'pending'}
                </div>
              </td>
              <td className="p-4">{formatCurrency(seller.revenue || 0)}</td>
              <td className="p-4">{formatDate(seller.createdAt)}</td>
              <td className="p-4">
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
                    defaultValue={seller.subscriptionPlan}
                    disabled={savingId === seller._id}
                    onChange={(event) => handleQuickUpdate(seller, 'subscriptionPlan', event.target.value)}
                  >
                    {planOptions.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                  <button
                    className="text-sm text-blue-400 hover:underline disabled:opacity-50"
                    disabled={savingId === seller._id}
                    onClick={() =>
                      handleQuickUpdate(
                        seller,
                        'status',
                        seller.status === 'active' ? 'suspended' : 'active'
                      )
                    }
                    type="button"
                  >
                    {seller.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                  {seller.activationStatus !== 'active' ? (
                    <button
                      className="text-sm text-emerald-400 hover:underline disabled:opacity-50"
                      disabled={savingId === seller._id}
                      onClick={() => onSendActivationKey?.(seller)}
                      type="button"
                    >
                      Send Activation Key
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
          {!sellers.length ? (
            <tr>
              <td className="p-8 text-center text-sm text-gray-400" colSpan="7">
                No sellers registered yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

export default SellerManagementTable
