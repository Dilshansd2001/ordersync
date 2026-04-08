function Navbar() {
  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">Welcome back</p>
        <h2 className="text-2xl font-semibold text-slate-900">Business overview</h2>
      </div>

      <div className="rounded-2xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900">
        Tenant-aware API foundation ready
      </div>
    </header>
  )
}

export default Navbar
