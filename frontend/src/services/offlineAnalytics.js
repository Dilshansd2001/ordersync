import { repositories } from '@/repositories'

const EMPTY_DASHBOARD_STATS = {
  totalOrders: 0,
  totalRevenue: 0,
  pendingDispatches: 0,
  activeCustomers: 0,
  recentOrders: [],
  revenueTrend: [],
  statusDistribution: [],
}

const EMPTY_REPORT = {
  grossRevenue: 0,
  cogs: 0,
  totalExpenses: 0,
  netProfit: 0,
  averageOrderValue: 0,
  returnCount: 0,
  returnValue: 0,
  codExpected: 0,
  codCollected: 0,
  yearlyProfit: [],
  revenueByCategory: [],
  monthlyComparison: {
    currentMonth: { revenue: 0, profit: 0 },
    previousMonth: { revenue: 0, profit: 0 },
  },
}

const ORDER_STATUSES = ['PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED', 'CANCELLED']

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const toDate = (value) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)

const isWithinDateRange = (date, filters = {}) => {
  if (!date) {
    return false
  }

  const fromDate = filters.from ? startOfDay(new Date(filters.from)) : null
  const toDateValue = filters.to ? endOfDay(new Date(filters.to)) : null

  if (fromDate && date < fromDate) {
    return false
  }

  if (toDateValue && date > toDateValue) {
    return false
  }

  return true
}

const getOrderCreatedAt = (order) => toDate(order?.createdAt || order?.created_at)
const getExpenseDate = (expense) => toDate(expense?.date || expense?.expense_date || expense?.createdAt)

const buildSevenDayRevenueTrend = (orders) => {
  const today = new Date()
  const buckets = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const key = startOfDay(date).toISOString().slice(0, 10)

    return {
      key,
      label: date.toLocaleDateString('en-LK', { month: 'short', day: 'numeric' }),
      revenue: 0,
    }
  })

  const revenueByDay = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  for (const order of orders) {
    const createdAt = getOrderCreatedAt(order)
    if (!createdAt) {
      continue
    }

    const bucket = revenueByDay.get(startOfDay(createdAt).toISOString().slice(0, 10))
    if (!bucket) {
      continue
    }

    bucket.revenue += toNumber(order.totalAmount)
  }

  return buckets.map(({ label, revenue }) => ({ label, revenue }))
}

const buildStatusDistribution = (orders) =>
  ORDER_STATUSES.map((status) => ({
    name: status,
    value: orders.filter((order) => order.status === status).length,
  }))

const getProductBuyingPrice = (productMap, entityId) => toNumber(productMap.get(entityId)?.buyingPrice)
const getProductCategory = (productMap, entityId) => productMap.get(entityId)?.category || 'Uncategorized'

const getRealizedOrders = (orders) => orders.filter((order) => !['CANCELLED', 'RETURNED'].includes(order.status))
const getReturnedOrders = (orders) => orders.filter((order) => order.status === 'RETURNED')

const buildMonthlyProfitSeries = ({ orders, expenses, productMap, year }) => {
  return Array.from({ length: 12 }).map((_, monthIndex) => {
    const monthOrders = getRealizedOrders(orders).filter((order) => {
      const createdAt = getOrderCreatedAt(order)
      return createdAt && createdAt.getFullYear() === year && createdAt.getMonth() === monthIndex
    })

    const monthExpenses = expenses.filter((expense) => {
      const expenseDate = getExpenseDate(expense)
      return expenseDate && expenseDate.getFullYear() === year && expenseDate.getMonth() === monthIndex
    })

    const revenue = monthOrders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0)
    const cogs = monthOrders.reduce(
      (sum, order) =>
        sum +
        (order.items || []).reduce(
          (itemSum, item) =>
            itemSum + getProductBuyingPrice(productMap, item.productEntityId) * toNumber(item.qty),
          0
        ),
      0
    )
    const totalExpenses = monthExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0)

    return {
      month: new Date(year, monthIndex, 1).toLocaleDateString('en-LK', { month: 'short' }),
      profit: revenue - cogs - totalExpenses,
    }
  })
}

const buildRevenueByCategory = ({ orders, productMap }) => {
  const totals = new Map()

  for (const order of getRealizedOrders(orders)) {
    for (const item of order.items || []) {
      const key = getProductCategory(productMap, item.productEntityId)
      totals.set(key, (totals.get(key) || 0) + toNumber(item.qty) * toNumber(item.unitPrice))
    }
  }

  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value)
}

const buildMonthComparison = ({ orders, expenses, productMap }) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1)

  const summarizeMonth = (year, month) => {
    const monthOrders = getRealizedOrders(orders).filter((order) => {
      const createdAt = getOrderCreatedAt(order)
      return createdAt && createdAt.getFullYear() === year && createdAt.getMonth() === month
    })

    const monthExpenses = expenses.filter((expense) => {
      const expenseDate = getExpenseDate(expense)
      return expenseDate && expenseDate.getFullYear() === year && expenseDate.getMonth() === month
    })

    const revenue = monthOrders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0)
    const cogs = monthOrders.reduce(
      (sum, order) =>
        sum +
        (order.items || []).reduce(
          (itemSum, item) =>
            itemSum + getProductBuyingPrice(productMap, item.productEntityId) * toNumber(item.qty),
          0
        ),
      0
    )

    return {
      revenue,
      profit: revenue - cogs - monthExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0),
    }
  }

  return {
    currentMonth: summarizeMonth(currentYear, currentMonth),
    previousMonth: summarizeMonth(previousMonthDate.getFullYear(), previousMonthDate.getMonth()),
  }
}

const loadOfflineSourceData = async (filters = {}) => {
  const [orders, customers, expenses, products] = await Promise.all([
    repositories.orders.list({ status: 'ALL' }),
    repositories.customers.list({ page: 1, pageSize: 200 }),
    repositories.expenses.list(filters),
    repositories.products.list({ page: 1, pageSize: 200 }),
  ])

  return {
    orders: Array.isArray(orders) ? orders : [],
    customers: Array.isArray(customers) ? customers : customers?.items || [],
    expenses: Array.isArray(expenses) ? expenses : [],
    products: Array.isArray(products) ? products : products?.items || [],
  }
}

export const getOfflineDashboardStats = async () => {
  const { orders, customers } = await loadOfflineSourceData()
  const realizedOrders = getRealizedOrders(orders)

  return {
    totalOrders: orders.length,
    totalRevenue: realizedOrders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0),
    pendingDispatches: orders.filter((order) => order.status === 'PENDING').length,
    activeCustomers: customers.length,
    recentOrders: [...orders]
      .sort((left, right) => (getOrderCreatedAt(right)?.getTime() || 0) - (getOrderCreatedAt(left)?.getTime() || 0))
      .slice(0, 5),
    revenueTrend: buildSevenDayRevenueTrend(realizedOrders),
    statusDistribution: buildStatusDistribution(orders),
  }
}

export const getOfflineFinancialReport = async (filters = {}) => {
  const { orders, expenses, products } = await loadOfflineSourceData(filters)
  const filteredOrders = orders.filter((order) => isWithinDateRange(getOrderCreatedAt(order), filters))
  const filteredExpenses = expenses.filter((expense) => isWithinDateRange(getExpenseDate(expense), filters))
  const productMap = new Map(products.map((product) => [product.entityId || product._id || product.entity_id, product]))

  const realizedOrders = getRealizedOrders(filteredOrders)
  const returnedOrders = getReturnedOrders(filteredOrders)
  const grossRevenue = realizedOrders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0)
  const cogs = realizedOrders.reduce(
    (sum, order) =>
      sum +
      (order.items || []).reduce(
        (itemSum, item) => itemSum + getProductBuyingPrice(productMap, item.productEntityId) * toNumber(item.qty),
        0
      ),
    0
  )
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0)
  const returnValue = returnedOrders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0)
  const codExpected = realizedOrders
    .filter((order) => order.paymentMethod === 'COD')
    .reduce((sum, order) => sum + toNumber(order.codAmount || order.totalAmount), 0)
  const codCollected = filteredOrders
    .filter((order) => order.paymentMethod === 'COD' && order.status === 'DELIVERED')
    .reduce((sum, order) => sum + toNumber(order.codAmount || order.totalAmount), 0)

  return {
    ...EMPTY_REPORT,
    grossRevenue,
    cogs,
    totalExpenses,
    netProfit: grossRevenue - cogs - totalExpenses,
    averageOrderValue: realizedOrders.length ? grossRevenue / realizedOrders.length : 0,
    returnCount: returnedOrders.length,
    returnValue,
    codExpected,
    codCollected,
    yearlyProfit: buildMonthlyProfitSeries({
      orders: filteredOrders,
      expenses: filteredExpenses,
      productMap,
      year: new Date().getFullYear(),
    }),
    revenueByCategory: buildRevenueByCategory({ orders: filteredOrders, productMap }),
    monthlyComparison: buildMonthComparison({ orders: filteredOrders, expenses: filteredExpenses, productMap }),
  }
}

export const offlineAnalyticsDefaults = {
  dashboard: EMPTY_DASHBOARD_STATS,
  report: EMPTY_REPORT,
}
