const Expense = require('../models/Expense')

const createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      businessId: req.businessId,
    })

    return res.status(201).json({
      success: true,
      message: 'Expense created successfully.',
      data: expense,
    })
  } catch (error) {
    return next(error)
  }
}

const getExpenses = async (req, res, next) => {
  try {
    const query = { businessId: req.businessId }

    if (req.query.category) {
      query.category = req.query.category
    }

    if (req.query.from || req.query.to) {
      query.date = {}

      if (req.query.from) {
        query.date.$gte = new Date(req.query.from)
      }

      if (req.query.to) {
        query.date.$lte = new Date(req.query.to)
      }
    }

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    })
  } catch (error) {
    return next(error)
  }
}

const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, businessId: req.businessId })

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.',
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  createExpense,
  getExpenses,
  deleteExpense,
}
