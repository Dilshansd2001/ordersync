import { BadgeCheck, Building2 } from 'lucide-react'

function TenantCard({ tenant, isSelected, onSelect }) {
  return (
    <button
      className={`w-full rounded-[26px] border p-5 text-left transition ${
        isSelected
          ? 'border-cyan-300/40 bg-[linear-gradient(180deg,rgba(10,22,44,0.96),rgba(15,23,42,0.98))] shadow-[0_24px_70px_rgba(59,130,246,0.2)]'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
      }`}
      onClick={() => onSelect(tenant.tenantId)}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
          <Building2 className="h-5 w-5" />
        </span>
        {isSelected ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
            <BadgeCheck className="h-3.5 w-3.5" />
            Selected
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">{tenant.businessName}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{tenant.businessTagline || 'Open this workspace on the current device.'}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-slate-200">
          {tenant.planName}
        </span>
        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-slate-200">
          Tenant ID: {tenant.tenantId}
        </span>
      </div>
    </button>
  )
}

export default TenantCard
