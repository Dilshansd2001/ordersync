import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  PackageSearch,
  RefreshCcw,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import inventoryService from '@/services/inventoryService'
import orderService from '@/services/orderService'

const READ_STORAGE_KEY = 'ordersync-notification-read-map'

const severityStyles = {
  critical:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  info:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
}

const severityOrder = {
  critical: 0,
  warning: 1,
  info: 2,
  success: 3,
}

const readMapKey = (workspaceKey) => `${READ_STORAGE_KEY}:${workspaceKey || 'workspace'}`

const loadReadIds = (workspaceKey) => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(readMapKey(workspaceKey))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveReadIds = (workspaceKey, ids) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(readMapKey(workspaceKey), JSON.stringify(ids))
}

const createNotificationId = (...parts) => parts.filter(Boolean).join(':')

const getTimeLabel = (value) => {
  if (!value) {
    return 'Just now'
  }

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) {
    return 'Just now'
  }

  const difference = Math.max(0, Date.now() - timestamp)
  const minutes = Math.floor(difference / 60000)

  if (minutes < 1) {
    return 'Just now'
  }

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function NotificationCenter({ workspaceKey }) {
  const panelRef = useRef(null)
  const buttonRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(() => loadReadIds(workspaceKey))

  useEffect(() => {
    setReadIds(loadReadIds(workspaceKey))
  }, [workspaceKey])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handlePointerDown = (event) => {
      const target = event.target
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return
      }

      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !readIds.includes(notification.id)).length,
    [notifications, readIds]
  )

  const markAllAsRead = (nextNotifications) => {
    const ids = nextNotifications.map((notification) => notification.id)
    setReadIds(ids)
    saveReadIds(workspaceKey, ids)
  }

  const buildNotifications = (orders = [], products = []) => {
    const pendingOrders = orders.filter((order) => order.status === 'PENDING')
    const failedCourierOrders = orders.filter(
      (order) => order.courierSyncStatus === 'FAILED' || order.courierSyncStatus === 'SKIPPED'
    )
    const recentlyDispatched = orders.filter((order) => order.status === 'DISPATCHED').slice(0, 3)
    const lowStockProducts = products.filter(
      (product) => Number(product.stockCount || 0) > 0 && Number(product.stockCount || 0) < 5
    )
    const outOfStockProducts = products.filter((product) => Number(product.stockCount || 0) <= 0)

    const nextNotifications = []

    if (pendingOrders.length) {
      nextNotifications.push({
        id: createNotificationId('pending-orders', pendingOrders.length),
        title: `${pendingOrders.length} pending order${pendingOrders.length === 1 ? '' : 's'} awaiting dispatch`,
        body: 'Review the pending queue so new orders move into fulfillment quickly.',
        icon: Clock3,
        severity: 'info',
        timestamp: pendingOrders[0]?.createdAt,
      })
    }

    failedCourierOrders.slice(0, 2).forEach((order) => {
      nextNotifications.push({
        id: createNotificationId('courier', order._id, order.courierSyncStatus),
        title: `Courier sync needs attention for ${order.orderId}`,
        body: order.courierSyncError || 'Dispatch sync did not complete successfully.',
        icon: RefreshCcw,
        severity: 'warning',
        timestamp: order.updatedAt || order.createdAt,
      })
    })

    outOfStockProducts.slice(0, 2).forEach((product) => {
      nextNotifications.push({
        id: createNotificationId('out-of-stock', product._id, product.stockCount),
        title: `${product.name} is out of stock`,
        body: 'Restock this item to keep it available in your selling workflow.',
        icon: AlertTriangle,
        severity: 'critical',
        timestamp: product.updatedAt || product.createdAt,
      })
    })

    lowStockProducts.slice(0, 2).forEach((product) => {
      nextNotifications.push({
        id: createNotificationId('low-stock', product._id, product.stockCount),
        title: `${product.name} is running low`,
        body: `${product.stockCount} unit${product.stockCount === 1 ? '' : 's'} left in inventory.`,
        icon: PackageSearch,
        severity: 'warning',
        timestamp: product.updatedAt || product.createdAt,
      })
    })

    recentlyDispatched.slice(0, 2).forEach((order) => {
      nextNotifications.push({
        id: createNotificationId('dispatched', order._id, order.updatedAt),
        title: `${order.orderId} moved to dispatched`,
        body: order.trackingNumber
          ? `Tracking number ${order.trackingNumber} is attached.`
          : 'Add a tracking number if the courier has already assigned one.',
        icon: CheckCircle2,
        severity: 'success',
        timestamp: order.updatedAt || order.createdAt,
      })
    })

    return nextNotifications
      .sort((left, right) => {
        const severityDifference =
          severityOrder[left.severity] - severityOrder[right.severity]
        if (severityDifference !== 0) {
          return severityDifference
        }

        return new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime()
      })
      .slice(0, 8)
  }

  const loadNotifications = async () => {
    try {
      setLoading(true)
      setError('')
      const [ordersResponse, productsResponse] = await Promise.all([
        orderService.getOrders(),
        inventoryService.getProducts(),
      ])
      const nextNotifications = buildNotifications(ordersResponse.data || [], productsResponse.data || [])
      setNotifications(nextNotifications)
      markAllAsRead(nextNotifications)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async () => {
    const nextOpen = !open
    setOpen(nextOpen)

    if (nextOpen) {
      await loadNotifications()
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        aria-label="Open notifications"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/60 bg-white/80 text-slate-500 shadow-sm backdrop-blur transition hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-white"
        onClick={handleToggle}
        type="button"
      >
        <Bell className="h-5 w-5" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="absolute right-0 z-30 mt-3 w-[360px] rounded-[28px] border border-white/60 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
        >
          <div className="flex items-center justify-between rounded-2xl px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">Notifications</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inventory, dispatch, and order alerts
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {notifications.length} items
            </span>
          </div>

          <div className="mt-2 max-h-[420px] space-y-2 overflow-y-auto px-1 pb-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading notifications...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            ) : notifications.length ? (
              notifications.map((notification) => {
                const Icon = notification.icon
                return (
                  <div
                    key={notification.id}
                    className={`rounded-2xl border px-4 py-3 ${severityStyles[notification.severity] || severityStyles.info}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/70 dark:bg-slate-950/40">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold">{notification.title}</p>
                          <span className="shrink-0 text-[11px] font-medium opacity-80">
                            {getTimeLabel(notification.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-5 opacity-90">{notification.body}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                No notifications right now. New alerts will appear here as orders and inventory change.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default NotificationCenter
