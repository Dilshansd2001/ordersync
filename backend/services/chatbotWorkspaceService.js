const Business = require('../models/Business')
const Customer = require('../models/Customer')
const Expense = require('../models/Expense')
const Order = require('../models/Order')
const Product = require('../models/Product')

const MAX_RECENT_ORDERS = 5
const MAX_LOW_STOCK_PRODUCTS = 5
const MAX_PRODUCT_PREVIEW = 5
const MAX_TOP_CUSTOMERS = 5
const MAX_RECENT_EXPENSES = 5
const LOW_STOCK_THRESHOLD = 5

const sumCurrency = (items, selector) =>
  items.reduce((total, item) => total + Number(selector(item) || 0), 0)

const buildStatusBreakdown = (orders) =>
  ['PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED', 'CANCELLED'].map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }))

const toIsoDate = (value) => (value ? new Date(value).toISOString() : null)

const buildWorkspaceSnapshot = async ({ businessId, user, clientContext = {} }) => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    business,
    totalOrders,
    pendingDispatches,
    activeCustomers,
    totalProducts,
    allOrderStatuses,
    lowStockProducts,
    productPreview,
    recentOrders,
    monthlyOrders,
    topCustomers,
    recentExpenses,
    monthlyExpenses,
  ] = await Promise.all([
    Business.findById(businessId).select('name tagline subscriptionPlan').lean(),
    Order.countDocuments({ businessId, deletedAt: null }),
    Order.countDocuments({ businessId, deletedAt: null, status: 'PENDING' }),
    Customer.countDocuments({ businessId, deletedAt: null }),
    Product.countDocuments({ businessId, deletedAt: null }),
    Order.find({ businessId, deletedAt: null }).select('status').lean(),
    Product.find({
      businessId,
      deletedAt: null,
      isAvailable: true,
      stockCount: { $lte: LOW_STOCK_THRESHOLD },
    })
      .sort({ stockCount: 1, updatedAt: -1 })
      .limit(MAX_LOW_STOCK_PRODUCTS)
      .select('name sku stockCount category updatedAt')
      .lean(),
    Product.find({
      businessId,
      deletedAt: null,
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(MAX_PRODUCT_PREVIEW)
      .select('name sku stockCount category updatedAt isAvailable')
      .lean(),
    Order.find({ businessId, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(MAX_RECENT_ORDERS)
      .select('orderId customerName totalAmount status paymentMethod district createdAt')
      .lean(),
    Order.find({
      businessId,
      deletedAt: null,
      createdAt: { $gte: startOfMonth },
      status: { $ne: 'RETURNED' },
    })
      .select('totalAmount status createdAt')
      .lean(),
    Customer.find({ businessId, deletedAt: null })
      .sort({ totalSpend: -1, orderCount: -1, updatedAt: -1 })
      .limit(MAX_TOP_CUSTOMERS)
      .select('name totalSpend orderCount loyaltyStatus updatedAt')
      .lean(),
    Expense.find({
      businessId,
      deletedAt: null,
      date: { $gte: thirtyDaysAgo },
    })
      .sort({ date: -1, createdAt: -1 })
      .limit(MAX_RECENT_EXPENSES)
      .select('category amount description date')
      .lean(),
    Expense.find({
      businessId,
      deletedAt: null,
      date: { $gte: startOfMonth },
    })
      .select('amount')
      .lean(),
  ])

  const monthlyRevenue = sumCurrency(monthlyOrders, (order) => order.totalAmount)
  const monthlyExpenseTotal = sumCurrency(monthlyExpenses, (expense) => expense.amount)

  return {
    generatedAt: now.toISOString(),
    assistantScope: 'read_only_workspace_assistant',
    runtime: clientContext.runtime || 'web',
    currentView: clientContext.currentView || null,
    business: {
      name: business?.name || clientContext.businessName || 'OrderSync.lk workspace',
      tagline: business?.tagline || '',
      subscriptionPlan: business?.subscriptionPlan || '',
    },
    user: {
      name: user?.name || 'Workspace user',
      role: user?.role || 'ADMIN',
    },
    metrics: {
      totalOrders,
      pendingDispatches,
      activeCustomers,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      monthlyRevenue,
      monthlyExpenses: monthlyExpenseTotal,
      netSalesEstimate: monthlyRevenue - monthlyExpenseTotal,
    },
    recentOrders: recentOrders.map((order) => ({
      orderId: order.orderId,
      customerName: order.customerName || 'Unknown customer',
      totalAmount: Number(order.totalAmount || 0),
      status: order.status,
      paymentMethod: order.paymentMethod,
      district: order.district || '',
      createdAt: toIsoDate(order.createdAt),
    })),
    orderStatusBreakdown: buildStatusBreakdown(allOrderStatuses),
    lowStockProducts: lowStockProducts.map((product) => ({
      name: product.name,
      sku: product.sku,
      stockCount: Number(product.stockCount || 0),
      category: product.category || 'Uncategorized',
      updatedAt: toIsoDate(product.updatedAt),
    })),
    productPreview: productPreview.map((product) => ({
      name: product.name,
      sku: product.sku,
      stockCount: Number(product.stockCount || 0),
      category: product.category || 'Uncategorized',
      isAvailable: Boolean(product.isAvailable),
      updatedAt: toIsoDate(product.updatedAt),
    })),
    topCustomers: topCustomers.map((customer) => ({
      name: customer.name,
      totalSpend: Number(customer.totalSpend || 0),
      orderCount: Number(customer.orderCount || 0),
      loyaltyStatus: customer.loyaltyStatus,
      updatedAt: toIsoDate(customer.updatedAt),
    })),
    recentExpenses: recentExpenses.map((expense) => ({
      category: expense.category,
      amount: Number(expense.amount || 0),
      description: expense.description || '',
      date: toIsoDate(expense.date),
    })),
    desktopSync: clientContext.syncStatus
      ? {
          isDesktop: true,
          isRunning: Boolean(clientContext.syncStatus.isRunning),
          pendingCount: Number(clientContext.syncStatus.pendingCount || 0),
          failedCount: Number(clientContext.syncStatus.failedCount || 0),
          conflictCount: Number(clientContext.syncStatus.conflictCount || 0),
          lastSyncTime: clientContext.syncStatus.lastSyncTime || null,
          lastError: clientContext.syncStatus.lastError || null,
        }
      : null,
  }
}

module.exports = {
  buildWorkspaceSnapshot,
}
