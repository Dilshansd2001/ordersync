import { Outlet } from 'react-router-dom'
import BrandLogo from '@/components/BrandLogo'
import ThemeToggle from '@/components/ThemeToggle'
import { useTheme } from '@/hooks/useTheme'

function AuthLayout() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-10 transition-colors dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_30%),linear-gradient(180deg,#071224_0%,#0b1220_100%)]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full">
          <div className="mb-5 flex justify-end">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/92 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-none">
            <div className="mb-8 flex justify-center">
              <BrandLogo imageClassName="w-[320px] sm:w-[420px]" mode="adaptive" size="xl" />
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  )
}

export default AuthLayout
