import { MoonStar, SunMedium } from 'lucide-react'

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-3 text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:border-sky-500/40 dark:hover:text-white"
      onClick={onToggle}
      type="button"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-sm">
        {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      </span>
      <span className="hidden text-sm font-semibold sm:block">{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}

export default ThemeToggle
