const mongoose = require('mongoose')
const Customer = require('../models/Customer')
const Expense = require('../models/Expense')
const Order = require('../models/Order')
const Product = require('../models/Product')

const buildRevenueTrend = (revenueAggregation) => {
  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
    date.setUTCDate(date.getUTCDate() - (6 - index))

    return {
      key: date.toISOString().slice(0, 10),
      date: formatter.format(date),
      revenue: 0,
    }
  })

  const revenueMap = new Map(days.map((day) => [day.key, day]))

  revenueAggregation.forEach((entry) => {
    const existingDay = revenueMap.get(entry._id)

    if (existingDay) {
      existingDay.revenue = entry.revenue
    }
  })

  return days.map(({ date, revenue }) => ({ date, revenue }))
}

const buildStatusDistribution = (statusAggregation) => {
  const statuses = ['PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED']
  const statusMap = new Map(statusAggregation.map((entry) => [entry._id, entry.value]))

  return statuses.map((status) => ({
    name: status,
    value: statusMap.get(status) || 0,
  }))
}

const monthLabel = (date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(date)

const normalizeDateRange = (from, to) => {
  const endDate = to ? new Date(to) : new Date()
  endDate.setHours(23, 59, 59, 999)

  const startDate = from ? new Date(from) : new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  startDate.setHours(0, 0, 0, 0)

  return { startDate, endDate }
}

const sumOrderRevenue = (orders) =>
  orders
    .filter((order) => order.status !== 'RETURNED')
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)

const sumReturnValue = (orders) =>
  orders
    .filter((order) => order.status === 'RETURNED')
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)

const calculateCogs = (orders, productMap) =>
  orders
    .filter((order) => order.status === 'DELIVERED')
    .reduce(
      (sum, order) =>
        sum +
        (order.items || []).reduce((itemSum, item) => {
          const product = item.productId ? productMap.get(String(item.productId)) : null
          return itemSum + Number(product?.buyingPrice || 0) * Number(item.qty || 0)
        }, 0),
      0
    )

const buildMonthlyBuckets = (orders, expenses, productMap) => {
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(new Date().getUTCFullYear(), index, 1))
    return {
      key: `${date.getUTCFullYear()}-${String(index + 1).padStart(2, '0')}`,
      month: monthLabel(date),
      revenue: 0,
      expenses: 0,
      cogs: 0,
    }
  })

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  orders.forEach((order) => {
    const createdAt = new Date(order.createdAt)
    const key = `${createdAt.getUTCFullYear()}-${String(createdAt.getUTCMonth() + 1).padStart(2, '0')}`
    const bucket = bucketMap.get(key)

    if (!bucket) {
      return
    }

    if (order.status !== 'RETURNED') {
      bucket.revenue += Number(order.totalAmount || 0)
    }

    if (order.status === 'DELIVERED') {
      bucket.cogs += (order.items || []).reduce((sum, item) => {
        const product = item.productId ? productMap.get(String(item.productId)) : null
        return sum + Number(product?.buyingPrice || 0) * Number(item.qty || 0)
      }, 0)
    }
  })

  expenses.forEach((expense) => {
    const expenseDate = new Date(expense.date)
    const key = `${expenseDate.getUTCFullYear()}-${String(expenseDate.getUTCMonth() + 1).padStart(2, '0')}`
    const bucket = bucketMap.get(key)

    if (bucket) {
      bucket.expenses += Number(expense.amount || 0)
    }
  })

  return buckets.map((bucket) => ({
    month: bucket.month,
    revenue: bucket.revenue,
    profit: bucket.revenue - bucket.cogs - bucket.expenses,
  }))
}

const buildRevenueByCategory = (orders, productMap) => {
  const revenueMap = new Map()

  orders
    .filter((order) => order.status !== 'RETURNED')
    .forEach((order) => {
      ;(order.items || []).forEach((item) => {
        const product = item.productId ? productMap.get(String(item.productId)) : null
        const category = product?.category || 'Uncategorized'
        const revenue = Number(item.unitPrice || 0) * Number(item.qty || 0)
        revenueMap.set(category, (revenueMap.get(category) || 0) + revenue)
      })
    })

  return Array.from(revenueMap.entries()).map(([name, value]) => ({ name, value }))
}

const getDashboardStats = async (req, res, next) => {
  try {
    const businessId = req.businessId
    const businessObjectId = new mongoose.Types.ObjectId(businessId)
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const [
      totalOrders,
      pendingDispatches,
      revenueAggregation,
      activeCustomers,
      recentOrders,
      revenueTrendAggregation,
      statusDistributionAggregation,
    ] = await Promise.all([
        Order.countDocuments({ businessId }),
        Order.countDocuments({ businessId, status: 'PENDING' }),
        Order.aggregate([
          { $match: { businessId: businessObjectId } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' },
            },
          },
        ]),
        Customer.countDocuments({ businessId }),
        Order.find({ businessId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('orderId customerName district totalAmount status createdAt'),
        Order.aggregate([
          {
            $match: {
              businessId: businessObjectId,
              createdAt: { $gte: sevenDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt',
                },
              },
              revenue: { $sum: '$totalAmount' },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Order.aggregate([
          { $match: { businessId: businessObjectId } },
          {
            $group: {
              _id: '$status',
              value: { $sum: 1 },
            },
          },
        ]),
      ])

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: revenueAggregation[0]?.totalRevenue || 0,
        pendingDispatches,
        activeCustomers,
        recentOrders,
        revenueTrend: buildRevenueTrend(revenueTrendAggregation),
        statusDistribution: buildStatusDistribution(statusDistributionAggregation),
        totalExpenses: 0,
        cogs: 0,
        grossProfit: revenueAggregation[0]?.totalRevenue || 0,
        netProfit: revenueAggregation[0]?.totalRevenue || 0,
      },
    })
  } catch (error) {
    return next(error)
  }
}

const getFinancialReport = async (req, res, next) => {
  try {
    const businessId = req.businessId
    const { startDate, endDate } = normalizeDateRange(req.query.from, req.query.to)
    const currentYearStart = new Date(new Date().getFullYear(), 0, 1)
    const currentYearEnd = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999)

    const [orders, expenses, products, yearlyOrders, yearlyExpenses] = await Promise.all([
      Order.find({ businessId, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
      Expense.find({ businessId, date: { $gte: startDate, $lte: endDate } }).lean(),
      Product.find({ businessId }).lean(),
      Order.find({ businessId, createdAt: { $gte: currentYearStart, $lte: currentYearEnd } }).lean(),
      Expense.find({ businessId, date: { $gte: currentYearStart, $lte: currentYearEnd } }).lean(),
    ])

    const productMap = new Map(products.map((product) => [String(product._id), product]))
    const grossRevenue = sumOrderRevenue(orders)
    const cogs = calculateCogs(orders, productMap)
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const grossProfit = grossRevenue - cogs
    const netProfit = grossProfit - totalExpenses
    const validOrders = orders.filter((order) => order.status !== 'RETURNED')
    const averageOrderValue = validOrders.length ? grossRevenue / validOrders.length : 0
    const returnCount = orders.filter((order) => order.status === 'RETURNED').length
    const returnValue = sumReturnValue(orders)
    const codExpected = orders
      .filter((order) => order.paymentMethod === 'COD' && order.status !== 'RETURNED')
      .reduce((sum, order) => sum + Number(order.codAmount || 0), 0)
    const codCollected = orders
      .filter((order) => order.paymentMethod === 'COD' && order.status === 'DELIVERED')
      .reduce((sum, order) => sum + Number(order.codAmount || 0), 0)

    const comparisonNow = new Date(endDate)
    const currentMonthStart = new Date(comparisonNow.getFullYear(), comparisonNow.getMonth(), 1)
    const previousMonthStart = new Date(comparisonNow.getFullYear(), comparisonNow.getMonth() - 1, 1)
    const previousMonthEnd = new Date(comparisonNow.getFullYear(), comparisonNow.getMonth(), 0, 23, 59, 59, 999)

    const [previousMonthOrders, previousMonthExpenses] = await Promise.all([
      Order.find({ businessId, createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } }).lean(),
      Expense.find({ businessId, date: { $gte: previousMonthStart, $lte: previousMonthEnd } }).lean(),
    ])

    const currentMonthOrders = orders.filter((order) => new Date(order.createdAt) >= currentMonthStart)
    const currentMonthExpenses = expenses.filter((expense) => new Date(expense.date) >= currentMonthStart)

    return res.status(200).json({
      success: true,
      data: {
        dateRange: {
          from: startDate,
          to: endDate,
        },
        grossRevenue,
        cogs,
        totalExpenses,
        grossProfit,
        netProfit,
        averageOrderValue,
        returnCount,
        returnValue,
        codExpected,
        codCollected,
        monthlyComparison: {
          currentMonth: {
            revenue: sumOrderRevenue(currentMonthOrders),
            profit:
              sumOrderRevenue(currentMonthOrders) -
              calculateCogs(currentMonthOrders, productMap) -
              currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
          },
          previousMonth: {
            revenue: sumOrderRevenue(previousMonthOrders),
            profit:
              sumOrderRevenue(previousMonthOrders) -
              calculateCogs(previousMonthOrders, productMap) -
              previousMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
          },
        },
        yearlyProfit: buildMonthlyBuckets(yearlyOrders, yearlyExpenses, productMap),
        revenueByCategory: buildRevenueByCategory(orders, productMap),
      },
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getDashboardStats,
  getFinancialReport,
}
