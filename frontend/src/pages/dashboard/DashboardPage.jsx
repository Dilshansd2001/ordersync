const stats = [
  { label: 'Active tenants', value: '01' },
  { label: 'API modules', value: '03' },
  { label: 'Ready entities', value: '05' },
]

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
          </article>
        ))}
      </div>

      <section className="rounded-3xl bg-slate-900 p-6 text-white">
        <p className="text-sm uppercase tracking-[0.28em] text-amber-300">Architecture</p>
        <h3 className="mt-3 text-2xl font-semibold">Tenant isolation starts with `businessId`.</h3>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Core backend models already include a tenant reference so phase 2 can focus on database relationships, validation rules, and business workflows.
        </p>
      </section>
    </div>
  )
}

export default DashboardPage
