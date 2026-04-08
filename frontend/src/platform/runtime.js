export const isDesktopRuntime = () =>
  typeof window !== 'undefined' &&
  typeof window.ordersync !== 'undefined' &&
  typeof window.ordersyncAuth !== 'undefined'

export const getRuntimeMode = () => (isDesktopRuntime() ? 'desktop' : 'web')
