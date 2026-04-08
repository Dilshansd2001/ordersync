const { ProductsRepository } = require('./productsRepository')
const { CustomersRepository } = require('./customersRepository')
const { OrdersRepository } = require('./ordersRepository')
const { OrderItemsRepository } = require('./orderItemsRepository')
const { OrderActionsRepository } = require('./orderActionsRepository')
const { InventoryMovementsRepository } = require('./inventoryMovementsRepository')
const { ExpensesRepository } = require('./expensesRepository')
const { SettingsRepository } = require('./settingsRepository')
const { SyncQueueRepository } = require('./syncQueueRepository')

const createRepositories = (db) => ({
  db,
  products: new ProductsRepository(db),
  customers: new CustomersRepository(db),
  orders: new OrdersRepository(db),
  orderItems: new OrderItemsRepository(db),
  orderActions: new OrderActionsRepository(db),
  inventoryMovements: new InventoryMovementsRepository(db),
  expenses: new ExpensesRepository(db),
  settings: new SettingsRepository(db),
  syncQueue: new SyncQueueRepository(db),
})

module.exports = {
  createRepositories,
}
