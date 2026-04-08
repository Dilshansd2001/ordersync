import { Store } from 'lucide-react'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import SellerManagementTable from '@/components/SellerManagementTable'
import {
  fetchAdminSellers,
  sendSellerActivationKeyAdmin,
  updateSellerAdmin,
} from '@/store/adminSlice'

function ManageSellers() {
  const dispatch = useDispatch()
  const { sellers, loading } = useSelector((state) => state.admin)

  useEffect(() => {
    dispatch(fetchAdminSellers())
  }, [dispatch])

  const handleUpdate = async (id, data) => {
    await dispatch(updateSellerAdmin({ id, data })).unwrap()
    toast.success('Seller updated successfully.')
  }

  const handleSendActivationKey = async (seller) => {
    const result = await dispatch(sendSellerActivationKeyAdmin(seller._id)).unwrap()
    toast.success(`Activation key sent to ${result.seller.sellerEmail}.`)
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-none">
        <p className="text-sm font-medium text-sky-600 dark:text-sky-300">Seller operations</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Manage Sellers
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Review seller shops, adjust plans, suspend accounts, and monitor revenue contribution.
        </p>
      </section>

      <div className="rounded-[28px] border border-slate-800 bg-[#0b1220] p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-500/15 p-3 text-indigo-300">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Registered Sellers</h2>
            <p className="text-sm text-slate-400">Live seller list with quick plan and status controls.</p>
          </div>
        </div>

        <SellerManagementTable
          loading={loading}
          onSendActivationKey={handleSendActivationKey}
          onUpdate={handleUpdate}
          sellers={sellers}
        />
      </div>
    </div>
  )
}

export default ManageSellers
