const { ORDERSYNC_CHANNELS } = require('./channels')

const registerOrdersyncIpcHandlers = ({ ipcMain, desktopService }) => {
  ipcMain.handle(ORDERSYNC_CHANNELS.GET_SYNC_STATUS, async () => desktopService.getSyncStatus())
  ipcMain.handle(ORDERSYNC_CHANNELS.TRIGGER_SYNC, async () => desktopService.triggerSync())
  ipcMain.handle(ORDERSYNC_CHANNELS.GET_PENDING_COUNT, async () => desktopService.getPendingCount())
  ipcMain.handle(ORDERSYNC_CHANNELS.GET_LAST_SYNC_TIME, async () => desktopService.getLastSyncTime())
  ipcMain.handle(ORDERSYNC_CHANNELS.RETRY_SYNC_ISSUE, async (_event, payload) =>
    desktopService.retrySyncIssue(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.RETRY_SAFE_SYNC_ITEMS, async () =>
    desktopService.retrySafeSyncItems()
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.LIST_PRODUCTS, async (_event, filters) =>
    desktopService.listProducts(filters)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.CREATE_PRODUCT, async (_event, payload) =>
    desktopService.createProduct(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.UPDATE_PRODUCT, async (_event, payload) =>
    desktopService.updateProduct(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.DELETE_PRODUCT, async (_event, entityId) =>
    desktopService.deleteProduct(entityId)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.LIST_CUSTOMERS, async (_event, filters) =>
    desktopService.listCustomers(filters)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.CREATE_CUSTOMER, async (_event, payload) =>
    desktopService.createCustomer(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.UPDATE_CUSTOMER, async (_event, payload) =>
    desktopService.updateCustomer(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.DELETE_CUSTOMER, async (_event, entityId) =>
    desktopService.deleteCustomer(entityId)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.LIST_EXPENSES, async (_event, filters) =>
    desktopService.listExpenses(filters)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.CREATE_EXPENSE, async (_event, payload) =>
    desktopService.createExpense(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.DELETE_EXPENSE, async (_event, entityId) =>
    desktopService.deleteExpense(entityId)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.LIST_ORDERS, async (_event, filters) =>
    desktopService.listOrders(filters)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.GET_ORDER_BY_ID, async (_event, entityId) =>
    desktopService.getOrderById(entityId)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.CREATE_ORDER, async (_event, payload) =>
    desktopService.createOrder(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.BULK_CREATE_ORDERS, async (_event, payload) =>
    desktopService.bulkCreateOrders(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.UPDATE_ORDER_STATUS, async (_event, payload) =>
    desktopService.updateOrderStatus(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.CREATE_ORDER_SHIPMENT, async (_event, payload) =>
    desktopService.createOrderShipment(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.CANCEL_ORDER, async (_event, payload) =>
    desktopService.cancelOrder(payload)
  )
  ipcMain.handle(ORDERSYNC_CHANNELS.CORRECT_ORDER, async (_event, payload) =>
    desktopService.correctOrder(payload)
  )
}

module.exports = {
  registerOrdersyncIpcHandlers,
}
