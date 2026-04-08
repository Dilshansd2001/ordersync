import darkLogo from '@/assets/branding/ordersync-logo-dark.svg'
import lightLogo from '@/assets/branding/ordersync-logo-light.svg'
import { cn } from '@/utils/cn'

function BrandLogo({
  alt = 'OrderSync.lk',
  className,
  containerClassName,
  imageClassName,
  mode = 'adaptive',
  size = 'md',
  subtitle,
}) {
  const sizeClassName =
    size === 'sm'
      ? 'w-[140px]'
      : size === 'lg'
        ? 'w-[220px] sm:w-[260px]'
        : size === 'xl'
          ? 'w-[280px] sm:w-[360px]'
          : 'w-[180px]'

  const logoClassName = cn('block h-auto max-w-full object-contain', sizeClassName, imageClassName)

  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div className={cn('flex items-center', containerClassName)}>
        {mode === 'light' ? (
          <img alt={alt} className={logoClassName} src={lightLogo} />
        ) : mode === 'dark' ? (
          <img alt={alt} className={logoClassName} src={darkLogo} />
        ) : (
          <>
            <img alt={alt} className={cn(logoClassName, 'dark:hidden')} src={lightLogo} />
            <img alt={alt} className={cn(logoClassName, 'hidden dark:block')} src={darkLogo} />
          </>
        )}
      </div>

      {subtitle ? (
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  )
}

export default BrandLogo
