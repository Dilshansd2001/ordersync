import { useEffect, useState } from 'react'

const getApi = () => window.ordersync || null

export const useOrderSync = () => {
  const [syncStatus, setSyncStatus] = useState({
    isRunning: false,
    pendingCount: 0,
    lastSyncTime: null,
    lastError: null,
  })

  useEffect(() => {
    const api = getApi()
    if (!api) {
      return undefined
    }

    let mounted = true

    api.getSyncStatus().then((status) => {
      if (mounted && status) {
        setSyncStatus(status)
      }
    })

    const handleSyncStatus = (event) => {
      if (mounted) {
        setSyncStatus(event.detail)
      }
    }

    window.addEventListener('ordersync:sync-status', handleSyncStatus)

    return () => {
      mounted = false
      window.removeEventListener('ordersync:sync-status', handleSyncStatus)
    }
  }, [])

  return {
    syncStatus,
    triggerSync: async () => {
      const api = getApi()
      return api ? api.triggerSync() : null
    },
    createOrder: async (payload) => {
      const api = getApi()
      return api ? api.createOrder(payload) : null
    },
    cancelOrder: async (payload) => {
      const api = getApi()
      return api ? api.cancelOrder(payload) : null
    },
    correctOrder: async (payload) => {
      const api = getApi()
      return api ? api.correctOrder(payload) : null
    },
  }
}
