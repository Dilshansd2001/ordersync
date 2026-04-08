const path = require('node:path')
const { DatabaseManager } = require('./DatabaseManager')
const { createRepositories } = require('./repositories')
const { CustomerService } = require('./services/customerService')
const { ExpenseService } = require('./services/expenseService')
const { OrderService } = require('./services/orderService')
const { ProductService } = require('./services/productService')
const { SyncManager } = require('./sync/SyncManager')
const { SyncApiClient } = require('./sync/SyncApiClient')

const createLocalDbModule = ({ baseDir }) => {
  const manager = new DatabaseManager({
    baseDir,
    migrationsDir: path.join(__dirname, 'migrations'),
  })

  return {
    manager,
    getRepositories(tenantId) {
      return createRepositories(manager.getConnection(tenantId))
    },
    getOrderService(tenantId) {
      return new OrderService(manager.getConnection(tenantId))
    },
    getProductService(tenantId) {
      return new ProductService(manager.getConnection(tenantId))
    },
    getCustomerService(tenantId) {
      return new CustomerService(manager.getConnection(tenantId))
    },
    getExpenseService(tenantId) {
      return new ExpenseService(manager.getConnection(tenantId))
    },
    createSyncManager(options) {
      return new SyncManager({
        databaseManager: manager,
        ...options,
      })
    },
  }
}

module.exports = {
  DatabaseManager,
  createRepositories,
  CustomerService,
  ExpenseService,
  OrderService,
  ProductService,
  SyncApiClient,
  SyncManager,
  createLocalDbModule,
}
