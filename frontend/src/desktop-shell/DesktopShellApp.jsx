import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import GracePeriodWarningBanner from '@/components/desktop-shell/GracePeriodWarningBanner'
import { hydrateDesktopSession, logout as clearAuthState } from '@/features/authSlice'
import BootstrapShell from '@/pages/desktop-shell/BootstrapShell'
import LoginShell from '@/pages/desktop-shell/LoginShell'
import SubscriptionInactiveShell from '@/pages/desktop-shell/SubscriptionInactiveShell'
import TenantSelectorShell from '@/pages/desktop-shell/TenantSelectorShell'
import TrialExpiredShell from '@/pages/desktop-shell/TrialExpiredShell'
import WorkspaceRoutes from '@/routes/WorkspaceRoutes'

const createInitialState = () => ({
  screen: 'bootstrap',
  metadata: {},
  tenants: [],
  message: null,
  accessMode: null,
})

const getReadableAuthError = (error, fallbackMessage) => {
  if (error?.backendMessage) {
    return error.backendMessage
  }

  if (typeof error?.body === 'string' && error.body.trim()) {
    try {
      const parsed = JSON.parse(error.body)
      if (parsed?.message) {
        return parsed.message
      }
    } catch {
      return error.body
    }
  }

  return error?.message || fallbackMessage
}

function DesktopShellApp() {
  const dispatch = useDispatch()
  const [shellState, setShellState] = useState(createInitialState)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')
  const [selectedTenantId, setSelectedTenantId] = useState(null)

  const applyState = useCallback(
    (nextState) => {
      setShellState(nextState)
      setSelectedTenantId(nextState?.tenants?.[0]?.tenantId || null)

      if (nextState?.metadata?.userName || nextState?.metadata?.businessName) {
        dispatch(
          hydrateDesktopSession({
            user: nextState.metadata.userName
              ? {
                  name: nextState.metadata.userName,
                  email: nextState.metadata.userEmail,
                  role: nextState.metadata.userRole || 'ADMIN',
                }
              : null,
            business: nextState.metadata.businessName
              ? {
                  name: nextState.metadata.businessName,
                  tagline: nextState.metadata.businessTagline,
                  subscriptionPlan: nextState.metadata.planName,
                }
              : null,
          }),
        )
      }

      if (!nextState?.isAuthenticated) {
        dispatch(clearAuthState())
      }
    },
    [dispatch],
  )

  const loadBootstrapState = useCallback(async () => {
    setIsBusy(true)
    setError('')

    try {
      const nextState = await window.ordersyncShell.getBootstrapState()
      applyState(nextState)
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load the desktop workspace state.')
      applyState({
        ...createInitialState(),
        screen: 'login',
      })
    } finally {
      setIsBusy(false)
    }
  }, [applyState])

  useEffect(() => {
    loadBootstrapState()
  }, [loadBootstrapState])

  useEffect(() => {
    if (shellState.screen !== 'workspace_ready') {
      return
    }

    let isMounted = true

    const openWorkspace = async () => {
      try {
        const nextState = await window.ordersyncShell.enterWorkspace(shellState)
        if (isMounted) {
          applyState(nextState)
        }
      } catch (workspaceError) {
        if (isMounted) {
          setError(workspaceError?.message || 'Failed to open the workspace.')
        }
      }
    }

    openWorkspace()

    return () => {
      isMounted = false
    }
  }, [applyState, shellState])

  const handleLogin = async (credentials) => {
    setIsBusy(true)
    setError('')

    try {
      const nextState = await window.ordersyncShell.login(credentials)
      applyState(nextState)
    } catch (loginError) {
      setError(getReadableAuthError(loginError, 'Sign-in failed.'))
    } finally {
      setIsBusy(false)
    }
  }

  const handleSelectTenant = async (tenantId) => {
    setSelectedTenantId(tenantId)
    setIsBusy(true)
    setError('')

    try {
      const nextState = await window.ordersyncShell.selectTenant(tenantId)
      applyState(nextState)
    } catch (selectionError) {
      setError(selectionError?.message || 'Failed to link the selected tenant.')
    } finally {
      setIsBusy(false)
    }
  }

  const handleLogout = async () => {
    setIsBusy(true)
    setError('')

    try {
      const nextState = await window.ordersyncShell.logout()
      applyState(nextState)
    } catch (logoutError) {
      setError(logoutError?.message || 'Failed to sign out.')
    } finally {
      setIsBusy(false)
    }
  }

  const screenContent = useMemo(() => {
    switch (shellState.screen) {
      case 'login':
        return <LoginShell error={error} isSubmitting={isBusy} onSubmit={handleLogin} />
      case 'tenant_selector':
        return (
          <TenantSelectorShell
            isSubmitting={isBusy}
            onSelect={handleSelectTenant}
            selectedTenantId={selectedTenantId}
            tenants={shellState.tenants}
          />
        )
      case 'trial_expired':
        return <TrialExpiredShell metadata={shellState.metadata} onLogout={handleLogout} />
      case 'subscription_inactive':
        return (
          <SubscriptionInactiveShell
            accessMode={shellState.accessMode}
            message={shellState.message}
            metadata={shellState.metadata}
            onLogout={handleLogout}
            onRetry={loadBootstrapState}
          />
        )
      case 'workspace':
        return null
      case 'workspace_ready':
      case 'bootstrap':
      default:
        return <BootstrapShell metadata={shellState.metadata} />
    }
  }, [error, handleLogout, isBusy, loadBootstrapState, selectedTenantId, shellState])

  if (shellState.screen === 'workspace') {
    return (
      <>
        {shellState.accessMode === 'offline_grace' ? (
          <GracePeriodWarningBanner graceExpiresAt={shellState.metadata?.graceExpiresAt} />
        ) : null}
        <WorkspaceRoutes fallbackPath="/app/dashboard" onLogout={handleLogout} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_30%),linear-gradient(180deg,#071224_0%,#0a1429_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <div className="w-full max-w-6xl">{screenContent}</div>
      </div>
    </div>
  )
}

export default DesktopShellApp
