import { ArrowRight, CheckCircle2 } from 'lucide-react'
import PageMeta from '@/components/PageMeta'
import TenantCard from '@/components/desktop-shell/TenantCard'

function TenantSelectorShell({ isSubmitting, onSelect, selectedTenantId, tenants }) {
  return (
    <>
      <PageMeta title="Choose Workspace - OrderSync.lk" description="Select the tenant workspace this desktop device should open." />

      <div className="space-y-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Tenant linking</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Choose the business this device should open.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            If your account belongs to more than one workspace, confirm which tenant should be linked to this desktop device.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {tenants.map((tenant) => (
            <TenantCard
              isSelected={selectedTenantId === tenant.tenantId}
              key={tenant.tenantId}
              onSelect={onSelect}
              tenant={tenant}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/6 px-5 py-4 text-sm text-slate-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          Final tenant context stays in the main process after activation.
          {isSubmitting ? <ArrowRight className="ml-auto h-4 w-4 animate-pulse text-cyan-200" /> : null}
        </div>
      </div>
    </>
  )
}

export default TenantSelectorShell
