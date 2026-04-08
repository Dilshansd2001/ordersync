const { EventEmitter } = require('node:events')
const path = require('node:path')

const { createLocalDbModule, SyncApiClient } = require('../../../local-db/src')
const { validateCustomerPayload } = require('../validation/customerValidator')
const { validateOrderPayload } = require('../validation/orderValidator')
const { validateProductPayload } = require('../validation/productValidator')

class OrderSyncDesktopService extends EventEmitter {
  constructor({
    baseDbDir,
    syncApiBaseUrl,
    resolveActiveTenantContext,
    getAuthHeaders,
    isOnline = () => true,
    autoSyncIntervalMs = 60_000,
    logger = null,
  }) {
    super()

    if (!baseDbDir) {
      throw new Error('baseDbDir is required.')
    }

    if (typeof resolveActiveTenantContext !== 'function') {
      throw new Error('resolveActiveTenantContext must be a function.')
    }

    this.resolveActiveTenantContext = resolveActiveTenantContext
    this.getAuthHeaders = getAuthHeaders
    this.isOnline = isOnline
    this.syncApiBaseUrl = syncApiBaseUrl?.replace(/\/+$/, '') || ''
    this.autoSyncIntervalMs = autoSyncIntervalMs
    this.autoSyncTimer = null
    this.syncStateByTenant = new Map()
    this.logger = logger

    this.localDb = createLocalDbModule({
      baseDir: path.resolve(baseDbDir),
    })

    this.apiClient = new SyncApiClient({
      baseUrl: syncApiBaseUrl,
      getHeaders: getAuthHeaders || null,
    })

    this.syncManager = this.localDb.createSyncManager({
      apiClient: this.apiClient,
      deviceIdProvider: async (tenantId) => {
        const context = await this.resolveTenantContext(tenantId)
        return context.deviceId
      },
    })
  }

  async resolveTenantContext(expectedTenantId = null) {
    const context = await this.resolveActiveTenantContext()

    if (!context?.tenantId) {
      throw new Error('No active tenant context is available.')
    }

    if (expectedTenantId && context.tenantId !== expectedTenantId) {
      throw new Error('Resolved tenant context does not match the requested tenant.')
    }

    return context
  }

  getTenantState(tenantId) {
    return (
      this.syncStateByTenant.get(tenantId) || {
        tenantId,
        isRunning: false,
        pendingCount: 0,
        lastSyncTime: null,
        lastResult: null,
        lastError: null,
      }
    )
  }

  setTenantState(tenantId, patch) {
    const nextState = {
      ...this.getTenantState(tenantId),
      ...patch,
    }

    this.syncStateByTenant.set(tenantId, nextState)
    this.emit('sync-status', nextState)
    return nextState
  }

  async getPendingCount() {
    const { tenantId } = await this.resolveTenantContext()
    const repositories = this.localDb.getRepositories(tenantId)
    const pendingCount = repositories.syncQueue.getPendingCount()
    this.setTenantState(tenantId, { pendingCount })
    return pendingCount
  }

  async getLastSyncTime() {
    const { tenantId } = await this.resolveTenantContext()
    const repositories = this.localDb.getRepositories(tenantId)
    const row = repositories.db
      .prepare(
        `SELECT setting_value
         FROM settings
         WHERE setting_key = '__sync.last_pull_completed_at'
         LIMIT 1`
      )
      .get()

    const lastSyncTime = row?.setting_value || null
    this.setTenantState(tenantId, { lastSyncTime })
    return lastSyncTime
  }

  async getSyncStatus() {
    const { tenantId } = await this.resolveTenantContext()
    const [pendingCount, lastSyncTime, diagnostics] = await Promise.all([
      this.getPendingCount(),
      this.getLastSyncTime(),
      this.getSyncDiagnostics(),
    ])

    return this.setTenantState(tenantId, {
      isRunning: this.syncManager.isSyncRunning(tenantId),
      pendingCount,
      lastSyncTime,
      diagnostics,
    })
  }

  async getSyncDiagnostics() {
    const { tenantId } = await this.resolveTenantContext()
    const repositories = this.localDb.getRepositories(tenantId)
    const failedItems = repositories.syncQueue.getFailedItems(25)
    const conflictItems = repositories.syncQueue.getConflictItems(25)
    const lastError = repositories.syncQueue.getLastError()

    return {
      pendingCount: repositories.syncQueue.getPendingCount(),
      failedCount: failedItems.length,
      conflictCount: conflictItems.length,
      lastError,
      issues: [
        ...failedItems.map((item) => ({
          type: 'failed_queue_item',
          severity: 'error',
          entityType: item.entity_type,
          entityId: item.entity_id,
          queueId: item.id,
          operation: item.operation,
          status: item.status,
          attemptCount: item.attempt_count,
          message: item.last_error_message || 'Sync failed.',
          code: item.last_error_code || 'sync_failed',
          updatedAt: item.updated_at,
        })),
        ...conflictItems.map((item) => ({
          type: 'conflict_record',
          severity: 'warning',
          entityType: item.entity_type,
          entityId: item.entity_id,
          queueId: item.id,
          operation: item.operation,
          status: item.status,
          attemptCount: item.attempt_count,
          message: item.last_error_message || 'Sync conflict detected.',
          code: item.last_error_code || 'sync_conflict',
          updatedAt: item.updated_at,
        })),
      ],
    }
  }

  async retrySyncIssue(payload = {}) {
    const { tenantId } = await this.resolveTenantContext()
    const repositories = this.localDb.getRepositories(tenantId)
    const queueId = payload?.queueId || payload?.id

    if (!queueId) {
      throw new Error('queueId is required to retry a sync issue.')
    }

    repositories.syncQueue.retryById(queueId)
    this.logger?.info('sync', 'Retrying a single sync issue.', {
      tenantId,
      queueId,
    })

    if (this.isOnline()) {
      return this.triggerSync()
    }

    return this.getSyncStatus()
  }

  async retrySafeSyncItems() {
    const { tenantId } = await this.resolveTenantContext()
    const repositories = this.localDb.getRepositories(tenantId)
    const retriedCount = repositories.syncQueue.retryAllSafeItems()

    this.logger?.info('sync', 'Retrying safe sync items.', {
      tenantId,
      retriedCount,
    })

    if (this.isOnline() && retriedCount > 0) {
      const state = await this.triggerSync()
      return {
        retriedCount,
        state,
      }
    }

    return {
      retriedCount,
      state: await this.getSyncStatus(),
    }
  }

  async triggerSync() {
    const { tenantId } = await this.resolveTenantContext()

    this.setTenantState(tenantId, {
      isRunning: true,
      lastError: null,
    })

    try {
      this.logger?.info('sync', 'Triggering tenant sync.', { tenantId })
      const result = await this.syncManager.syncTenant(tenantId)
      const pendingCount = await this.getPendingCount()
      const lastSyncTime = await this.getLastSyncTime()
      const diagnostics = await this.getSyncDiagnostics()

      const nextState = this.setTenantState(tenantId, {
        isRunning: false,
        pendingCount,
        lastSyncTime,
        diagnostics,
        lastResult: result,
        lastError: null,
      })

      this.logger?.info('sync', 'Tenant sync completed.', {
        tenantId,
        result,
      })

      return nextState
    } catch (error) {
      const nextState = this.setTenantState(tenantId, {
        isRunning: false,
        lastError: {
          message: error.message,
        },
      })

      this.logger?.error('sync', 'Tenant sync failed.', {
        tenantId,
        message: error.message,
      })

      return nextState
    }
  }

  async createOrder(payload) {
    const { tenantId } = await this.resolveTenantContext()
    validateOrderPayload(payload)
    const orderService = this.localDb.getOrderService(tenantId)
    const order = orderService.createOrder(payload)
    this.logger?.info('orders', 'Created local order.', {
      tenantId,
      entityId: order.entity_id,
      orderNumber: order.order_number,
    })
    await this.getPendingCount()
    return order
  }

  async bulkCreateOrders(payloads = []) {
    const { tenantId } = await this.resolveTenantContext()
    const orderService = this.localDb.getOrderService(tenantId)
    const orders = Array.isArray(payloads) ? payloads : []

    if (!orders.length) {
      throw new Error('At least one order is required for bulk upload.')
    }

    orders.forEach((payload) => validateOrderPayload(payload))

    const createdOrders = orderService.createOrders(orders)
    this.logger?.info('orders', 'Created local bulk orders.', {
      tenantId,
      count: createdOrders.length,
    })
    await this.getPendingCount()
    return createdOrders
  }

  async listOrders(filters = {}) {
    const { tenantId } = await this.resolveTenantContext()
    const orderService = this.localDb.getOrderService(tenantId)
    return orderService.list(filters)
  }

  async getOrderById(orderEntityId) {
    const { tenantId } = await this.resolveTenantContext()
    const orderService = this.localDb.getOrderService(tenantId)
    return orderService.getById(orderEntityId)
  }

  async updateOrderStatus(payload) {
    const { tenantId } = await this.resolveTenantContext()
    const orderService = this.localDb.getOrderService(tenantId)
    const result = orderService.updateStatus({
      orderEntityId: payload?.orderEntityId || payload?.id || payload?.entityId,
      status: payload?.data?.status || payload?.status,
      trackingNumber: payload?.data?.trackingNumber || payload?.trackingNumber || null,
    })
    this.logger?.info('orders', 'Updated local order status.', {
      tenantId,
      entityId: result.entity_id,
      status: result.status,
    })
    await this.getPendingCount()
    return result
  }

  async createOrderShipment(payload) {
    if (!this.isOnline()) {
      throw new Error('Connect to the internet before creating a courier shipment.')
    }

    const { tenantId } = await this.resolveTenantContext()
    const repositories = this.localDb.getRepositories(tenantId)
    const orderService = this.localDb.getOrderService(tenantId)
    const orderEntityId =
      payload?.orderEntityId || payload?.entityId || payload?.id || payload

    if (!orderEntityId) {
      throw new Error('Order ID is required to create a shipment.')
    }

    const localOrder = repositories.orders.getOrderAggregate(orderEntityId)

    if (!localOrder || localOrder.deleted_at) {
      throw new Error('Order not found.')
    }

    if (!localOrder.cloud_id) {
      throw new Error('Sync this order first before creating a courier shipment from desktop.')
    }

    const authHeaders = await this.getAuthHeaders()
    const response = await fetch(`${this.syncApiBaseUrl}/orders/${localOrder.cloud_id}/shipment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    })

    const contentType = response.headers.get('content-type') || ''
    const body = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : { message: await response.text().catch(() => '') }

    if (!response.ok) {
      throw new Error(body?.message || 'Failed to create shipment.')
    }

    const cloudOrder = body?.data
    const updatedOrder = orderService.applyCourierUpdate({
      orderEntityId: localOrder.entity_id,
      status: cloudOrder?.status || localOrder.status,
      trackingNumber: cloudOrder?.trackingNumber || cloudOrder?.tracking_number || localOrder.tracking_number,
      courierShipmentId:
        cloudOrder?.courierShipmentId || cloudOrder?.courier_shipment_id || null,
      courierSyncStatus:
        cloudOrder?.courierSyncStatus || cloudOrder?.courier_sync_status || 'SYNCED',
      courierSyncError:
        cloudOrder?.courierSyncError || cloudOrder?.courier_sync_error || '',
      courierLastSyncedAt:
        cloudOrder?.courierLastSyncedAt || cloudOrder?.courier_last_synced_at || new Date().toISOString(),
      labelUrl: cloudOrder?.labelUrl || cloudOrder?.label_url || '',
      deliveryService: cloudOrder?.deliveryService || cloudOrder?.delivery_service || localOrder.delivery_service,
    })

    this.logger?.info('orders', 'Created courier shipment from desktop.', {
      tenantId,
      entityId: updatedOrder.entity_id,
      cloudId: localOrder.cloud_id,
    })

    return updatedOrder
  }

  async cancelOrder(payload) {
    const { tenantId } = await this.resolveTenantContext()
    const orderService = this.localDb.getOrderService(tenantId)
    const result = orderService.cancelOrder(payload)
    await this.getPendingCount()
    return result
  }

  async correctOrder(payload) {
    const { tenantId } = await this.resolveTenantContext()
    const orderService = this.localDb.getOrderService(tenantId)
    const result = orderService.correctOrder(payload)
    await this.getPendingCount()
    return result
  }

  async listProducts(filters = {}) {
    const { tenantId } = await this.resolveTenantContext()
    const productService = this.localDb.getProductService(tenantId)
    return productService.list(filters)
  }

  async createProduct(payload) {
    const { tenantId } = await this.resolveTenantContext()
    validateProductPayload(payload)
    const productService = this.localDb.getProductService(tenantId)
    const result = productService.create(payload)
    this.logger?.info('products', 'Created local product.', {
      tenantId,
      entityId: result.entity_id,
      sku: result.sku,
    })
    await this.getPendingCount()
    return result
  }

  async updateProduct(payload) {
    const { tenantId } = await this.resolveTenantContext()
    validateProductPayload(payload.data || {}, { partial: true })
    const productService = this.localDb.getProductService(tenantId)
    const result = productService.update(payload)
    this.logger?.info('products', 'Updated local product.', {
      tenantId,
      entityId: result.entity_id,
    })
    await this.getPendingCount()
    return result
  }

  async deleteProduct(entityId) {
    const { tenantId } = await this.resolveTenantContext()
    const productService = this.localDb.getProductService(tenantId)
    const result = productService.remove(entityId)
    await this.getPendingCount()
    return result
  }

  async listCustomers(filters = {}) {
    const { tenantId } = await this.resolveTenantContext()
    const customerService = this.localDb.getCustomerService(tenantId)
    return customerService.list(filters)
  }

  async createCustomer(payload) {
    const { tenantId } = await this.resolveTenantContext()
    validateCustomerPayload(payload)
    const customerService = this.localDb.getCustomerService(tenantId)
    const result = customerService.create(payload)
    this.logger?.info('customers', 'Created local customer.', {
      tenantId,
      entityId: result.entity_id,
    })
    await this.getPendingCount()
    return result
  }

  async updateCustomer(payload) {
    const { tenantId } = await this.resolveTenantContext()
    validateCustomerPayload(payload.data || {}, { partial: true })
    const customerService = this.localDb.getCustomerService(tenantId)
    const result = customerService.update(payload)
    this.logger?.info('customers', 'Updated local customer.', {
      tenantId,
      entityId: result.entity_id,
    })
    await this.getPendingCount()
    return result
  }

  async deleteCustomer(entityId) {
    const { tenantId } = await this.resolveTenantContext()
    const customerService = this.localDb.getCustomerService(tenantId)
    const result = customerService.remove(entityId)
    await this.getPendingCount()
    return result
  }

  async listExpenses(filters = {}) {
    const { tenantId } = await this.resolveTenantContext()
    const expenseService = this.localDb.getExpenseService(tenantId)
    return expenseService.list(filters)
  }

  async createExpense(payload) {
    const { tenantId } = await this.resolveTenantContext()
    const expenseService = this.localDb.getExpenseService(tenantId)
    const result = expenseService.create(payload)
    this.logger?.info('expenses', 'Created local expense.', {
      tenantId,
      entityId: result.entity_id,
    })
    await this.getPendingCount()
    return result
  }

  async deleteExpense(entityId) {
    const { tenantId } = await this.resolveTenantContext()
    const expenseService = this.localDb.getExpenseService(tenantId)
    const result = expenseService.remove(entityId)
    await this.getPendingCount()
    return result
  }

  startAutoSync() {
    if (this.autoSyncTimer) {
      return
    }

    this.autoSyncTimer = setInterval(async () => {
      if (!this.isOnline()) {
        return
      }

      const context = await this.resolveTenantContext().catch(() => null)
      if (!context?.tenantId) {
        return
      }

      if (this.syncManager.isSyncRunning(context.tenantId)) {
        return
      }

      await this.triggerSync().catch(() => null)
    }, this.autoSyncIntervalMs)
  }

  stopAutoSync() {
    if (!this.autoSyncTimer) {
      return
    }

    clearInterval(this.autoSyncTimer)
    this.autoSyncTimer = null
  }
}

module.exports = {
  OrderSyncDesktopService,
}
