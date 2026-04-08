export const ORDER_SYNC_WEB_URL = 'https://ordersync-c6b.pages.dev'
export const ORDER_SYNC_PRICING_URL = `${ORDER_SYNC_WEB_URL}/#pricing`
export const ORDER_SYNC_REGISTER_URL = `${ORDER_SYNC_WEB_URL}/register`
export const ORDER_SYNC_SUPPORT_EMAIL = 'admin@ordersync.com'
export const ORDER_SYNC_FORGOT_PASSWORD_URL = `mailto:${ORDER_SYNC_SUPPORT_EMAIL}?subject=Forgot%20Password`

export const openExternalLink = async (url) => {
  if (!url) {
    return
  }

  if (typeof window !== 'undefined' && window.ordersyncExternal?.open) {
    await window.ordersyncExternal.open(url)
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}
