import { useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  Check,
  ChevronDown,
  Clock3,
  FileSpreadsheet,
  HardDriveDownload,
  Headphones,
  LayoutGrid,
  MessageSquareMore,
  Printer,
  ShieldCheck,
  Sparkles,
  SmartphoneCharging,
  Star,
  Target,
  Truck,
  Users,
  WifiOff,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandLogo from '@/components/BrandLogo'
import PageMeta from '@/components/PageMeta'
import { pricingPlanCards } from '@/data/subscriptionPlans'

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Why OrderSync', href: '#why-ordersync' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

const DESKTOP_DOWNLOAD_URL =
  'https://github.com/Dilshansd2001/ordersync/releases/download/v1.0.1/OrderSync.lk-Setup-1.0.1.exe'

const trustBullets = [
  'Offline-first desktop workflow',
  'Sri Lanka-focused seller operations',
  '4-day free trial with no card required',
]

const heroStats = [
  { label: 'Offline-ready', value: 'Always on' },
  { label: 'Daily workflow', value: 'Orders to dispatch' },
  { label: 'Setup path', value: 'Start in minutes' },
]

const problemPoints = [
  {
    title: 'Scattered order intake',
    description:
      'Chats, calls, screenshots, and staff notes live in different places, so important order details are easy to miss.',
  },
  {
    title: 'Dispatch becomes manual',
    description:
      'Labels, invoices, courier updates, and packing handoffs create too many repeated steps during busy hours.',
  },
  {
    title: 'Profit stays unclear',
    description:
      'When orders, expenses, and delivery costs are split across tools, you cannot see real performance fast enough.',
  },
  {
    title: 'Internet outages interrupt work',
    description:
      'Sellers still need to take orders, print, dispatch, and serve customers even when the connection drops.',
  },
]

const solutionPillars = [
  {
    title: 'Keep selling through weak connectivity',
    description: 'Take orders, check customer history, and prepare dispatch without waiting for internet to recover.',
    icon: WifiOff,
  },
  {
    title: 'Move from order to dispatch faster',
    description: 'Print labels and invoices from the same flow so staff can process more orders with less friction.',
    icon: Zap,
  },
  {
    title: 'See operations and profit in one place',
    description: 'Orders, customers, expenses, reports, and sync status stay visible in one dependable desktop workspace.',
    icon: Target,
  },
]

const featureCards = [
  {
    title: 'Order Management',
    description: 'Capture, review, and process daily orders from one workspace instead of scattered tools.',
    icon: LayoutGrid,
    accent: 'from-blue-500/20 via-cyan-400/10 to-transparent',
  },
  {
    title: 'Customer CRM',
    description: 'Keep buyer details, address history, and repeat-order context ready for faster follow-up.',
    icon: Users,
    accent: 'from-violet-500/20 via-fuchsia-400/10 to-transparent',
  },
  {
    title: 'Invoices & Labels',
    description: 'Generate documents quickly so staff can move from confirmation to packing without delays.',
    icon: Printer,
    accent: 'from-sky-500/20 via-blue-400/10 to-transparent',
  },
  {
    title: 'Delivery Workflow',
    description: 'Organize dispatch steps with clearer handoffs and fewer courier mistakes.',
    icon: Truck,
    accent: 'from-indigo-500/20 via-blue-400/10 to-transparent',
  },
  {
    title: 'Profit Tracking',
    description: 'See revenue, expenses, and order performance clearly enough to make better daily decisions.',
    icon: BarChart3,
    accent: 'from-emerald-500/20 via-cyan-400/10 to-transparent',
  },
  {
    title: 'Offline Reliability',
    description: 'Keep working on Windows during outages, then sync safely when internet returns.',
    icon: WifiOff,
    accent: 'from-fuchsia-500/20 via-indigo-400/10 to-transparent',
  },
  {
    title: 'Bulk Upload',
    description: 'Handle bigger order batches quickly when campaigns or reseller orders arrive in volume.',
    icon: FileSpreadsheet,
    accent: 'from-cyan-500/20 via-sky-400/10 to-transparent',
  },
  {
    title: 'WhatsApp-Friendly Workflow',
    description: 'Fit naturally into how Sri Lankan sellers already confirm, track, and follow up on orders.',
    icon: MessageSquareMore,
    accent: 'from-violet-500/20 via-blue-400/10 to-transparent',
  },
]

const whyOrderSync = [
  {
    title: 'Built for real local selling conditions',
    description:
      'Offline-first behaviour and fast desktop workflows match the reality of unstable internet and fast-moving dispatch desks.',
    icon: ShieldCheck,
  },
  {
    title: 'Designed around Sri Lankan seller habits',
    description:
      'From WhatsApp-heavy order flow to label printing and courier handoffs, the product reflects how teams actually work.',
    icon: BadgeCheck,
  },
  {
    title: 'Fast enough for busy teams',
    description:
      'When staff are entering orders back-to-back, checking customers, and printing at once, speed becomes a business advantage.',
    icon: Clock3,
  },
  {
    title: 'Clear enough to manage growth',
    description:
      'Orders, customers, dispatch, reports, and profit stay visible together instead of being buried across multiple tools.',
    icon: Boxes,
  },
]

const pricingPlans = pricingPlanCards

const pricingHighlights = [
  { label: 'Extra device', value: 'LKR 750 / month' },
  { label: 'Desktop support', value: 'Windows 10 / 11' },
]

const testimonials = [
  {
    quote:
      'Before OrderSync.lk, internet cuts slowed down the whole team. Now we keep taking orders and sync later without the daily panic.',
    name: 'Nadeesha Perera',
    role: 'Fashion seller, Colombo',
    result: 'Keeps selling during outages',
  },
  {
    quote:
      'Label printing and dispatch used to eat up too much time. Now the packing desk moves faster because everything sits in one workflow.',
    name: 'Shanika Jayasuriya',
    role: 'Beauty products seller, Gampaha',
    result: 'Faster dispatch workflow',
  },
  {
    quote:
      'The biggest difference is clarity. We can finally see expenses, order volume, and profit without guessing at the end of the month.',
    name: 'Rifzan Ahamed',
    role: 'Household goods seller, Kandy',
    result: 'Clearer performance visibility',
  },
]

const faqs = [
  {
    question: 'Does OrderSync.lk work without internet?',
    answer:
      'Yes. It is built as an offline-first desktop workspace, so your team can continue taking orders, checking customers, printing, and dispatching before syncing later.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes. You can start with a 4-day free trial on one device, and there is no credit card requirement.',
  },
  {
    question: 'Can I use multiple devices?',
    answer: 'Yes. Device limits depend on your plan, and extra devices are available for LKR 750 per month each.',
  },
  {
    question: 'Will I lose data if the internet goes down?',
    answer:
      'No. Day-to-day work continues locally on the desktop app. Once the connection is back, OrderSync.lk syncs your updates safely.',
  },
  {
    question: 'Can I upgrade later?',
    answer: 'Yes. You can begin with a smaller plan and upgrade as order volume, device needs, or team size increases.',
  },
  {
    question: 'Is it built for Sri Lankan sellers?',
    answer:
      'Yes. The workflow, pricing, and product positioning are designed specifically for Sri Lankan sellers managing orders, labels, dispatch, and profit.',
  },
]

function SectionHeading({ eyebrow, title, description, align = 'left', theme = 'light' }) {
  const isDark = theme === 'dark'

  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <p
        className={`text-sm font-semibold uppercase tracking-[0.24em] ${
          isDark ? 'text-cyan-300' : 'text-indigo-600'
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl ${
          isDark ? 'text-white' : 'text-slate-950'
        }`}
      >
        {title}
      </h2>
      <p className={`mt-4 text-base leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p>
    </div>
  )
}

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-white/10 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
        onClick={onToggle}
        type="button"
      >
        <span className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">{item.question}</span>
        <span
          className={`flex h-10 w-10 flex-none items-center justify-center rounded-2xl border transition ${
            isOpen
              ? 'border-indigo-500/30 bg-indigo-500 text-white'
              : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-6 text-slate-600 sm:px-6">{item.answer}</p>
        </div>
      </div>
    </article>
  )
}

function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="min-h-screen bg-[#06101f] text-slate-900">
      <PageMeta
        title="OrderSync.lk - Offline-First Business Operating System for Sri Lankan Sellers"
        description="OrderSync.lk helps Sri Lankan sellers manage orders, customers, invoices, labels, dispatch, and profit from one offline-first desktop workspace."
      />

      <div className="relative overflow-hidden bg-[linear-gradient(180deg,#081120_0%,#0b1426_44%,#eef4ff_44%,#f7faff_100%)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-soft absolute left-[-8%] top-[-3rem] h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="animate-float-soft animation-delay-300 absolute right-[-6%] top-[8rem] h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="animate-float-soft animation-delay-500 absolute left-1/2 top-[22rem] h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link className="flex items-center" to="/">
              <BrandLogo
                className="justify-start"
                containerClassName="items-center"
                imageClassName="w-[220px] sm:w-[260px]"
                mode="dark"
                size="lg"
              />
            </Link>

            <nav className="hidden items-center gap-8 lg:flex">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  className="text-sm font-medium text-slate-300 transition hover:text-white"
                  href={item.href}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <a
                className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 sm:inline-flex"
                href={DESKTOP_DOWNLOAD_URL}
                rel="noreferrer"
                target="_blank"
              >
                Download App
              </a>
              <Link
                className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 sm:inline-flex"
                to="/login"
              >
                Sign In
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(79,70,229,0.4)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_48px_rgba(79,70,229,0.48)]"
                to="/register"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="relative overflow-hidden pt-14 sm:pt-16 lg:pt-20">
            <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24">
              <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
                <div className="relative z-10">
                  <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200 shadow-[0_10px_30px_rgba(8,145,178,0.2)] backdrop-blur-md">
                    <HardDriveDownload className="h-3.5 w-3.5" />
                    Offline-first for Sri Lankan sellers
                  </div>

                  <h1 className="animate-fade-up animation-delay-100 mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem] xl:leading-[1.02]">
                    Run orders, dispatch, and profit tracking from one reliable desktop workflow.
                  </h1>

                  <p className="animate-fade-up animation-delay-200 mt-5 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
                    OrderSync.lk helps Sri Lankan sellers keep working offline, sync when online, and stay in control of
                    orders, customers, labels, invoices, dispatch, and performance.
                  </p>

                  <div className="animate-fade-up animation-delay-300 mt-8 flex flex-col gap-3 sm:flex-row">
                    <a
                      className="animate-pulse-glow inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(59,130,246,0.35)] transition hover:translate-y-[-1px] hover:shadow-[0_24px_60px_rgba(79,70,229,0.45)]"
                      href={DESKTOP_DOWNLOAD_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Download Desktop App
                      <HardDriveDownload className="h-4 w-4" />
                    </a>
                    <Link
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-cyan-300/30 hover:bg-white/12"
                      to="/register"
                    >
                      Start Free Trial
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/8 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-cyan-300/30 hover:bg-white/12"
                      href="#pricing"
                    >
                      View Pricing
                    </a>
                  </div>

                  <div className="animate-fade-up animation-delay-400 mt-6 flex flex-wrap gap-3">
                    {trustBullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3.5 py-2 text-sm text-slate-200 backdrop-blur-sm"
                      >
                        <Check className="h-4 w-4 text-emerald-300" />
                        {bullet}
                      </div>
                    ))}
                  </div>

                  <div className="animate-fade-up animation-delay-500 mt-8 grid gap-3 sm:grid-cols-3">
                    {heroStats.map((stat, index) => (
                      <div
                        key={stat.label}
                        className={`animate-fade-up rounded-[24px] border border-white/10 bg-white/6 px-4 py-4 shadow-[0_16px_40px_rgba(2,6,23,0.25)] backdrop-blur-sm ${
                          index === 0 ? 'animation-delay-100' : index === 1 ? 'animation-delay-200' : 'animation-delay-300'
                        }`}
                      >
                        <p className="text-sm text-slate-400">{stat.label}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-5 text-sm font-medium text-slate-400">
                    4-day free trial • Windows 10/11 • No credit card required
                  </p>
                </div>

                <div className="animate-fade-up animation-delay-300 relative">
                  <div className="absolute -left-6 top-12 hidden h-36 w-36 rounded-full bg-cyan-400/25 blur-3xl lg:block" />
                  <div className="absolute -right-6 bottom-10 hidden h-44 w-44 rounded-full bg-violet-500/25 blur-3xl lg:block" />

                  <div className="animate-float-soft relative rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.8))] p-4 shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-5">
                    <div className="rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.22),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(3,7,18,0.94))] p-5 text-white sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-sm">
                          <p className="text-sm font-medium text-cyan-200/80">Daily control panel</p>
                          <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                            One workspace for selling, printing, and dispatch.
                          </h3>
                        </div>
                        <span className="animate-fade-in animation-delay-200 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Sync ready
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[24px] border border-white/8 bg-white/8 p-5">
                          <p className="text-sm text-slate-300">Orders captured today</p>
                          <p className="mt-3 text-3xl font-semibold">128</p>
                          <p className="mt-2 text-sm text-slate-400">Work continues even with unstable internet</p>
                        </div>
                        <div className="rounded-[24px] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-violet-500/15 p-5">
                          <p className="text-sm text-cyan-100">Estimated profit</p>
                          <p className="mt-3 text-3xl font-semibold">LKR 48,500</p>
                          <p className="mt-2 text-sm text-slate-300">Revenue and expenses in one view</p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-[28px] border border-white/8 bg-white p-5 text-slate-900 shadow-[0_20px_60px_rgba(255,255,255,0.08)]">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Reliable workflow</p>
                            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                              From order confirmation to printed dispatch
                            </p>
                          </div>
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-indigo-100 text-indigo-600">
                            <SmartphoneCharging className="h-5 w-5" />
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {[
                            'Capture orders from chats, calls, and staff notes',
                            'Print labels and invoices without switching tools',
                            'Track dispatch, customers, and costs clearly',
                            'Continue offline, then sync when internet returns',
                          ].map((item) => (
                            <div
                              key={item}
                              className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fbff,#f1f5f9)] px-4 py-3 text-sm font-medium text-slate-700"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative bg-[#eef4ff] py-20" id="features">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_60%)]" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <div>
                  <SectionHeading
                    eyebrow="Problem to solution"
                    title="When your workflow is fragmented, the business feels heavier than it should."
                    description="The fix is not another generic app. It is one dependable desktop system that matches how orders arrive, how dispatch moves, and how sellers actually need to track performance."
                  />

                  <div className="mt-8 space-y-4">
                    {solutionPillars.map((item, index) => {
                      const Icon = item.icon

                      return (
                        <div
                          key={item.title}
                          className={`animate-fade-up rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(30,41,59,0.08)] backdrop-blur-sm ${
                            index === 0 ? 'animation-delay-100' : index === 1 ? 'animation-delay-200' : 'animation-delay-300'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <span className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 via-blue-100 to-violet-100 text-indigo-600">
                              <Icon className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="text-base font-semibold tracking-tight text-slate-950">{item.title}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {problemPoints.map((item, index) => (
                    <article
                      key={item.title}
                      className={`animate-fade-up group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_70px_rgba(59,130,246,0.14)] ${
                        index < 2 ? 'animation-delay-200' : 'animation-delay-300'
                      }`}
                    >
                      <div
                        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
                          index % 2 === 0 ? 'from-cyan-400 via-blue-500 to-violet-500' : 'from-violet-500 via-indigo-500 to-cyan-400'
                        }`}
                      />
                      <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{item.title}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="relative bg-[linear-gradient(180deg,#f7faff_0%,#ffffff_100%)] py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading
                align="center"
                eyebrow="Core features"
                title="Everything your team needs to run the day with less chaos and more control"
                description="Feature by feature, OrderSync.lk reduces manual work, improves reliability, and gives sellers clearer visibility across operations."
              />

              <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {featureCards.map((feature, index) => {
                  const Icon = feature.icon

                  return (
                    <article
                      key={feature.title}
                      className={`animate-fade-up group relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_70px_rgba(79,70,229,0.16)] ${
                        index % 4 === 0 ? 'animation-delay-100' : index % 4 === 1 ? 'animation-delay-200' : index % 4 === 2 ? 'animation-delay-300' : 'animation-delay-400'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 transition duration-300 group-hover:opacity-100`} />
                      <div className="relative">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-indigo-950 text-cyan-200 shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">{feature.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="relative bg-[#071224] py-20" id="why-ordersync">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.16),transparent_28%)]" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <div>
                  <SectionHeading
                    eyebrow="Why OrderSync.lk"
                    title="Built to feel reliable when daily commerce gets messy"
                    description="The value is not just managing orders. It is helping the business stay composed when the internet drops, dispatch gets busy, or order volume spikes."
                    theme="dark"
                  />

                  <div className="mt-8 rounded-[30px] border border-white/10 bg-white/6 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-cyan-200">
                      <Sparkles className="h-5 w-5" />
                      <p className="text-sm font-semibold uppercase tracking-[0.22em]">Premium operational clarity</p>
                    </div>
                    <p className="mt-4 text-lg leading-8 text-slate-200">
                      OrderSync.lk gives sellers one confident system for intake, customer context, printing, dispatch, and profit tracking,
                      so the business feels more organized and more scalable every day.
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {['Offline-first reliability', 'Desktop speed for busy teams', 'Local workflow alignment', 'Clear reporting and sync visibility'].map(
                        (item) => (
                          <div key={item} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-medium text-slate-100">
                            {item}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {whyOrderSync.map((item, index) => {
                    const Icon = item.icon

                    return (
                      <article
                        key={item.title}
                        className={`animate-fade-up rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.3)] backdrop-blur-md ${
                          index < 2 ? 'animation-delay-200' : 'animation-delay-300'
                        }`}
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-cyan-200">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0a1324_0%,#111b33_100%)] py-20 text-white" id="pricing">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[8%] top-14 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="absolute right-[10%] top-16 h-64 w-64 rounded-full bg-violet-500/14 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Pricing</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Clear plans for sellers at every stage of growth
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-300">
                  Start with a trial, stay productive offline, and move up as your team, devices, and order volume expand.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
                <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                  4-day free trial • No card required
                </span>
                {pricingHighlights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-full border border-white/10 bg-white/6 px-4 py-2 font-medium text-slate-300 backdrop-blur-sm"
                  >
                    <span className="text-slate-400">{item.label}:</span> <span className="text-white">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {pricingPlans.map((plan, index) => {
                  const toneClass =
                    plan.tone === 'featured'
                      ? 'border-cyan-300/35 bg-[linear-gradient(180deg,rgba(20,30,55,0.98),rgba(10,18,36,0.98))] shadow-[0_28px_80px_rgba(79,70,229,0.4)]'
                      : 'border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(10,15,28,0.94))] shadow-[0_18px_55px_rgba(2,6,23,0.32)]'

                  const buttonClass =
                    plan.featured
                      ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 text-white shadow-[0_16px_40px_rgba(59,130,246,0.35)] hover:translate-y-[-1px]'
                      : 'bg-white/8 text-white hover:bg-white/14'

                  return (
                    <article
                      key={plan.name}
                      className={`animate-fade-up relative flex h-full flex-col overflow-visible rounded-[26px] border p-4 pt-5 transition duration-300 hover:-translate-y-1 ${toneClass} ${
                        index === 0 ? 'animation-delay-100' : index === 1 ? 'animation-delay-200' : index === 2 ? 'animation-delay-300' : index === 3 ? 'animation-delay-400' : 'animation-delay-500'
                      }`}
                    >
                      {plan.badge ? (
                        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-indigo-500/30">
                            <Star className="h-3 w-3" />
                            {plan.badge}
                          </span>
                        </div>
                      ) : null}

                      <div className="mt-2">
                        <p className={`text-sm font-semibold ${plan.featured ? 'text-cyan-200' : 'text-slate-200'}`}>{plan.name}</p>
                        <div className="mt-3 min-h-[3.5rem]">
                          <span className="text-[1.9rem] font-semibold tracking-tight text-white">{plan.price}</span>
                          {plan.cadence ? <span className="ml-1.5 text-xs font-medium text-slate-400">{plan.cadence}</span> : null}
                        </div>
                        {plan.name === 'Free Trial' ? (
                          <p className="mt-1 text-xs text-slate-400">No card required • Cancel anytime</p>
                        ) : null}
                        <p className="mt-2 min-h-[3rem] text-sm leading-6 text-slate-300">{plan.description}</p>
                      </div>

                      <div className="mt-4 space-y-2">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-2 text-xs leading-5 text-slate-200">
                            <Check className={`mt-0.5 h-3.5 w-3.5 flex-none ${plan.featured ? 'text-cyan-300' : 'text-indigo-300'}`} />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Link
                        className={`mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${buttonClass}`}
                        to={plan.href}
                      >
                        {plan.cta}
                      </Link>
                      {plan.name === 'Free Trial' ? (
                        <p className="mt-2 text-center text-[11px] text-slate-500">Trial expires automatically after 4 days</p>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="relative bg-[#f4f8ff] py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading
                align="center"
                eyebrow="Seller feedback"
                title="Trusted because the workflow feels more stable, faster, and easier to manage"
                description="The strongest feedback keeps coming back to the same things: fewer missed details, faster dispatch work, and better visibility into the business."
              />

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {testimonials.map((item, index) => (
                  <article
                    key={item.name}
                    className={`animate-fade-up relative overflow-hidden rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ${
                      index === 0 ? 'animation-delay-100' : index === 1 ? 'animation-delay-200' : 'animation-delay-300'
                    }`}
                  >
                    <div
                      className={`absolute inset-x-0 top-0 h-1 ${
                        index === 0
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                          : index === 1
                            ? 'bg-gradient-to-r from-blue-500 to-violet-500'
                            : 'bg-gradient-to-r from-violet-500 to-cyan-400'
                      }`}
                    />
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={`${item.name}-${starIndex}`} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-4 text-base leading-7 text-slate-700">“{item.quote}”</p>
                    <div className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                      {item.result}
                    </div>
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="font-semibold text-slate-950">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.role}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="relative bg-[linear-gradient(180deg,#ffffff_0%,#eef4ff_100%)] py-20" id="faq">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading
                align="center"
                eyebrow="FAQ"
                title="Questions sellers usually ask before they start"
                description="The main question is reliability. Here is the short version of how OrderSync.lk fits into real day-to-day seller operations."
              />

              <div className="mx-auto mt-10 max-w-4xl space-y-4">
                {faqs.map((item, index) => (
                  <FaqItem
                    item={item}
                    isOpen={openFaq === index}
                    key={item.question}
                    onToggle={() => setOpenFaq(openFaq === index ? -1 : index)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden bg-[#071224] px-4 pb-20 pt-10 sm:px-6 lg:px-8" id="contact">
            <div className="mx-auto max-w-7xl">
              <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.22),transparent_32%),linear-gradient(135deg,#0f1c36_0%,#13264a_50%,#1e1b4b_100%)] px-6 py-10 text-white shadow-[0_30px_90px_rgba(2,6,23,0.45)] sm:px-8 sm:py-12">
                <div className="pointer-events-none absolute inset-0 opacity-60">
                  <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
                  <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
                </div>

                <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Ready to try it?</p>
                    <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                      Upgrade from scattered tools to one confident seller operating system.
                    </h2>
                    <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
                      Start your free trial and see how OrderSync.lk helps your team manage orders, customers, labels,
                      invoices, dispatch, and profit from one offline-first desktop workflow.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-200">
                      {['4-day free trial', 'Offline-first desktop app', 'Clear setup for Sri Lankan sellers'].map((item) => (
                        <div key={item} className="rounded-full border border-white/10 bg-white/8 px-3.5 py-2 backdrop-blur-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                    <a
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.15)] transition hover:translate-y-[-1px] hover:bg-slate-100"
                      href={DESKTOP_DOWNLOAD_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Download for Windows
                      <HardDriveDownload className="h-4 w-4" />
                    </a>
                    <Link
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/16"
                      to="/register"
                    >
                      Start Free Trial
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/16"
                      to="/login"
                    >
                      Sign In
                      <Headphones className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default LandingPage
