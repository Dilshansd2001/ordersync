const { contextBridge, ipcRenderer, shell } = require('electron')
const { ORDERSYNC_CHANNELS } = require('./src/ipc/channels')

ipcRenderer.on(ORDERSYNC_CHANNELS.AUTH_STATUS_EVENT, (_event, payload) => {
  window.dispatchEvent(
    new CustomEvent('ordersync:auth-status', {
      detail: payload,
    })
  )
})

ipcRenderer.on(ORDERSYNC_CHANNELS.SYNC_STATUS_EVENT, (_event, payload) => {
  window.dispatchEvent(
    new CustomEvent('ordersync:sync-status', {
      detail: payload,
    })
  )
})

contextBridge.exposeInMainWorld('ordersyncAuth', {
  bootstrap: () => ipcRenderer.invoke(ORDERSYNC_CHANNELS.AUTH_BOOTSTRAP),
  login: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.AUTH_LOGIN, payload),
  logout: () => ipcRenderer.invoke(ORDERSYNC_CHANNELS.AUTH_LOGOUT),
  getSessionStatus: () => ipcRenderer.invoke(ORDERSYNC_CHANNELS.AUTH_GET_SESSION_STATUS),
})

contextBridge.exposeInMainWorld('ordersyncShell', {
  getBootstrapState: () => ipcRenderer.invoke(ORDERSYNC_CHANNELS.SHELL_GET_BOOTSTRAP_STATE),
  login: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.SHELL_LOGIN, payload),
  logout: () => ipcRenderer.invoke(ORDERSYNC_CHANNELS.SHELL_LOGOUT),
  selectTenant: (tenantId) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.SHELL_SELECT_TENANT, tenantId),
  enterWorkspace: () => ipcRenderer.invoke(ORDERSYNC_CHANNELS.SHELL_ENTER_WORKSPACE),
})

contextBridge.exposeInMainWorld('ordersync', {
  getSyncStatus: () => ipcRenderer.invoke(ORDERSYNC_CHANNELS.GET_SYNC_STATUS),
  triggerSync: () => ipcRenderer.invoke(ORDERSYNC_CHANNELS.TRIGGER_SYNC),
  getPendingCount: () => ipcRenderer.invoke(ORDERSYNC_CHANNELS.GET_PENDING_COUNT),
  getLastSyncTime: () => ipcRenderer.invoke(ORDERSYNC_CHANNELS.GET_LAST_SYNC_TIME),
  retrySyncIssue: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.RETRY_SYNC_ISSUE, payload),
  retrySafeSyncItems: () => ipcRenderer.invoke(ORDERSYNC_CHANNELS.RETRY_SAFE_SYNC_ITEMS),
  listProducts: (filters) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.LIST_PRODUCTS, filters),
  createProduct: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.CREATE_PRODUCT, payload),
  updateProduct: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.UPDATE_PRODUCT, payload),
  deleteProduct: (entityId) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.DELETE_PRODUCT, entityId),
  listCustomers: (filters) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.LIST_CUSTOMERS, filters),
  createCustomer: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.CREATE_CUSTOMER, payload),
  updateCustomer: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.UPDATE_CUSTOMER, payload),
  deleteCustomer: (entityId) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.DELETE_CUSTOMER, entityId),
  listExpenses: (filters) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.LIST_EXPENSES, filters),
  createExpense: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.CREATE_EXPENSE, payload),
  deleteExpense: (entityId) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.DELETE_EXPENSE, entityId),
  listOrders: (filters) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.LIST_ORDERS, filters),
  getOrderById: (entityId) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.GET_ORDER_BY_ID, entityId),
  createOrder: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.CREATE_ORDER, payload),
  bulkCreateOrders: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.BULK_CREATE_ORDERS, payload),
  updateOrderStatus: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.UPDATE_ORDER_STATUS, payload),
  createOrderShipment: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.CREATE_ORDER_SHIPMENT, payload),
  cancelOrder: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.CANCEL_ORDER, payload),
  correctOrder: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.CORRECT_ORDER, payload),
})

contextBridge.exposeInMainWorld('ordersyncChatbot', {
  ask: (payload) => ipcRenderer.invoke(ORDERSYNC_CHANNELS.CHATBOT_ASK, payload),
})

contextBridge.exposeInMainWorld('ordersyncExternal', {
  open: (targetUrl) => {
    if (typeof targetUrl !== 'string') {
      throw new Error('A URL string is required.')
    }

    const isAllowedProtocol =
      targetUrl.startsWith('https://') ||
      targetUrl.startsWith('http://') ||
      targetUrl.startsWith('mailto:')

    if (!isAllowedProtocol) {
      throw new Error('Only http, https, and mailto links are allowed.')
    }

    return shell.openExternal(targetUrl)
  },
})
