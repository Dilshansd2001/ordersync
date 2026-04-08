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
