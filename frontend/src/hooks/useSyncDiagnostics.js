import { useCallback, useEffect, useState } from 'react'
import { repositories } from '@/repositories'

const initialState = {
  diagnostics: null,
  loading: true,
  refreshing: false,
  error: null,
}

export const useSyncDiagnostics = () => {
  const [state, setState] = useState(initialState)

  const load = useCallback(async ({ silent = false } = {}) => {
    setState((current) => ({
      ...current,
      loading: silent ? current.loading : !current.diagnostics,
      refreshing: silent ? true : Boolean(current.diagnostics),
      error: null,
    }))

    try {
      const diagnostics = await repositories.sync.getDiagnostics()
      setState({
        diagnostics,
        loading: false,
        refreshing: false,
        error: null,
      })
      return diagnostics
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error,
      }))
      throw error
    }
  }, [])

  useEffect(() => {
    let mounted = true

    load().catch(() => null)

    const handleSyncStatus = async () => {
      if (!mounted) {
        return
      }

      await load({ silent: true }).catch(() => null)
    }

    window.addEventListener('ordersync:sync-status', handleSyncStatus)

    return () => {
      mounted = false
      window.removeEventListener('ordersync:sync-status', handleSyncStatus)
    }
  }, [load])

  const refresh = useCallback(async () => load({ silent: true }), [load])

  const retryIssue = useCallback(
    async (issue) => {
      const result = await repositories.sync.retryIssue(issue)
      await load({ silent: true })
      return result
    },
    [load]
  )

  const retryAllSafeItems = useCallback(async () => {
    const result = await repositories.sync.retrySafeItems()
    await load({ silent: true })
    return result
  }, [load])

  const triggerSync = useCallback(async () => {
    const result = await repositories.sync.triggerSync()
    await load({ silent: true })
    return result
  }, [load])

  return {
    ...state,
    refresh,
    retryAllSafeItems,
    retryIssue,
    triggerSync,
  }
}
