function PlaceholderPage({ title }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium text-slate-500">Coming next</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
        This workspace is ready for the next phase. The page shell, navigation, and premium
        dashboard system are now in place.
      </p>
    </div>
  )
}

export default PlaceholderPage
