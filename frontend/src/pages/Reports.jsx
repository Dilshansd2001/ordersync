import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, DollarSign, RefreshCw, RotateCcw, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { isDesktopRuntime } from '@/platform/runtime'
import analyticsService from '@/services/analyticsService'
import { getOfflineFinancialReport, offlineAnalyticsDefaults } from '@/services/offlineAnalytics'
import { formatCurrency } from '@/utils/formatCurrency'
import { exportPdf } from '@/utils/exportPdf'

const chartTooltipStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(51, 65, 85, 0.8)',
  backgroundColor: '#020617',
  color: '#e2e8f0',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.35)',
}

const categoryColors = ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#64748b']

function Reports() {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState(null)
  const [filters, setFilters] = useState({ from: '', to: '' })
  const reportFilters = useMemo(() => ({ from: filters.from, to: filters.to }), [filters.from, filters.to])
  const isDesktop = isDesktopRuntime()

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true)
        if (isDesktop) {
          const response = await getOfflineFinancialReport(reportFilters)
          setReport(response)
          return
        }

        const response = await analyticsService.getFinancialReport(reportFilters)
        setReport(response.data)
      } catch {
        setReport(offlineAnalyticsDefaults.report)
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [isDesktop, reportFilters])

  const summaryCards = useMemo(() => {
    if (!report) {
      return []
    }

    return [
      { label: 'Gross Revenue', value: formatCurrency(report.grossRevenue), tone: 'text-slate-950 dark:text-white' },
      { label: 'COGS', value: formatCurrency(report.cogs), tone: 'text-slate-950 dark:text-white' },
      { label: 'Total Expenses', value: formatCurrency(report.totalExpenses), tone: 'text-slate-950 dark:text-white' },
      {
        label: 'Net Profit',
        value: formatCurrency(report.netProfit),
        tone: report.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600',
      },
      { label: 'Average Order Value', value: formatCurrency(report.averageOrderValue), tone: 'text-slate-950 dark:text-white' },
      {
        label: 'Return Count / Value',
        value: `${report.returnCount} / ${formatCurrency(report.returnValue)}`,
        tone: 'text-slate-950 dark:text-white',
      },
      {
        label: 'COD Expected / Collected',
        value: `${formatCurrency(report.codExpected)} / ${formatCurrency(report.codCollected)}`,
        tone: 'text-slate-950 dark:text-white',
      },
    ]
  }, [report])

  return (
    <div className="space-y-6 report-page">
      <section className="hidden print:block">
        <div className="report-print-sheet space-y-8 text-slate-900">
          <div className="flex items-start justify-between border-b border-slate-300 pb-4">
            <div>
              <p className="text-2xl font-bold">OrderSync.lk Financial Report</p>
              <p className="mt-1 text-sm text-slate-600">
                Generated on {new Date().toLocaleString('en-LK')}
              </p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p>
                Date range: {filters.from || 'Start of month'} to {filters.to || 'Today'}
              </p>
              <p className="mt-1">{isDesktop ? 'Offline desktop summary' : 'Live analytics report'}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Summary</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-300">
              <table className="min-w-full border-collapse text-sm">
                <tbody>
                  {summaryCards.map((card) => (
                    <tr key={card.label} className="border-b border-slate-200 last:border-b-0">
                      <td className="w-1/2 bg-slate-50 px-4 py-3 font-medium">{card.label}</td>
                      <td className="px-4 py-3">{card.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold">Monthly Comparison</h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-300">
                <table className="min-w-full border-collapse text-sm">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 px-4 py-3 font-medium">Current Month Revenue</td>
                      <td className="px-4 py-3">{formatCurrency(report?.monthlyComparison?.currentMonth?.revenue || 0)}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 px-4 py-3 font-medium">Previous Month Revenue</td>
                      <td className="px-4 py-3">{formatCurrency(report?.monthlyComparison?.previousMonth?.revenue || 0)}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 px-4 py-3 font-medium">Current Month Profit</td>
                      <td className="px-4 py-3">{formatCurrency(report?.monthlyComparison?.currentMonth?.profit || 0)}</td>
                    </tr>
                    <tr>
                      <td className="bg-slate-50 px-4 py-3 font-medium">Previous Month Profit</td>
                      <td className="px-4 py-3">{formatCurrency(report?.monthlyComparison?.previousMonth?.profit || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold">Returns and COD</h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-300">
                <table className="min-w-full border-collapse text-sm">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 px-4 py-3 font-medium">Return Count</td>
                      <td className="px-4 py-3">{report?.returnCount || 0}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 px-4 py-3 font-medium">Return Value</td>
                      <td className="px-4 py-3">{formatCurrency(report?.returnValue || 0)}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 px-4 py-3 font-medium">COD Expected</td>
                      <td className="px-4 py-3">{formatCurrency(report?.codExpected || 0)}</td>
                    </tr>
                    <tr>
                      <td className="bg-slate-50 px-4 py-3 font-medium">COD Collected</td>
                      <td className="px-4 py-3">{formatCurrency(report?.codCollected || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Revenue by Category</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-300">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold">Category</th>
                    <th className="px-4 py-3 text-right font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.revenueByCategory || []).map((entry) => (
                    <tr key={entry.name} className="border-b border-slate-200 last:border-b-0">
                      <td className="px-4 py-3">{entry.name}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(entry.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur print:hidden dark:border-slate-800 dark:bg-slate-950/75 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Financial intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Reports</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Track revenue, cost of goods, expenses, and true profitability across the business.
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {isDesktop ? 'Offline desktop summary' : 'Live analytics report'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 print:hidden">
          <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} type="date" value={filters.from} />
          <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/10" onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} type="date" value={filters.to} />
          <button className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700" onClick={exportPdf} type="button">
            <Download className="h-4 w-4" />
            Export PDF Report
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 print:hidden">
        {loading
          ? Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="rounded-[26px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-8 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            ))
          : summaryCards.map((card) => (
              <article key={card.label} className="rounded-[26px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className={`mt-4 text-2xl font-semibold tracking-tight ${card.tone}`}>{card.value}</p>
              </article>
            ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] print:hidden">
        <article className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <WalletCards className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Yearly Profit</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Monthly profit movement across the current year.</p>
            </div>
          </div>

          <div className="h-80 rounded-[24px] bg-slate-50/70 p-3 dark:bg-slate-900/70">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report?.yearlyProfit || []} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="profit" radius={[10, 10, 0, 0]} fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Revenue by Category</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Where your revenue is concentrated across the catalog.</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_180px] xl:items-center">
            <div className="min-w-0">
              <div className="h-80 rounded-[24px] bg-slate-50/70 p-3 dark:bg-slate-900/70">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => formatCurrency(value)} />
                  <Pie
                    data={(report?.revenueByCategory || []).filter((entry) => entry.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {(report?.revenueByCategory || []).map((entry, index) => (
                      <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            </div>

            <div className="space-y-3">
              {(report?.revenueByCategory || []).map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: categoryColors[index % categoryColors.length] }} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{entry.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-950 dark:text-white">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      {!loading && report ? (
        <section className="grid gap-4 md:grid-cols-2 print:hidden">
          <article className="rounded-[26px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <RefreshCw className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Comparison</p>
                <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">Current vs previous month</p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Revenue: {formatCurrency(report.monthlyComparison.currentMonth.revenue)} vs {formatCurrency(report.monthlyComparison.previousMonth.revenue)}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Profit: {formatCurrency(report.monthlyComparison.currentMonth.profit)} vs {formatCurrency(report.monthlyComparison.previousMonth.profit)}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[26px] border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <RotateCcw className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Return Impact</p>
                <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">Returned orders reduce realized revenue</p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Return count: {report.returnCount}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Return value: {formatCurrency(report.returnValue)}</p>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <div className="text-sm text-slate-500 print:hidden dark:text-slate-400">
        {isDesktop
          ? 'Report values are calculated from local orders, products, and expenses on this PC. They will align with cloud reports after the next successful sync.'
          : 'Report values are calculated from your live analytics endpoint.'}
      </div>
    </div>
  )
}

export default Reports
