const mongoose = require('mongoose')
const Customer = require('../models/Customer')
const { sendTextMessage } = require('../utils/sendTextMessage')

const createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      businessId: req.businessId,
    })

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: customer,
    })
  } catch (error) {
    return next(error)
  }
}

const getCustomers = async (req, res, next) => {
  try {
    const query = { businessId: req.businessId }

    if (req.query.phone) {
      query.phone = req.query.phone
    }

    if (req.query.loyaltyStatus) {
      query.loyaltyStatus = req.query.loyaltyStatus
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    })
  } catch (error) {
    return next(error)
  }
}

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, businessId: req.businessId })

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      })
    }

    return res.status(200).json({
      success: true,
      data: customer,
    })
  } catch (error) {
    return next(error)
  }
}

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      { ...req.body, businessId: req.businessId },
      { new: true, runValidators: true }
    )

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      data: customer,
    })
  } catch (error) {
    return next(error)
  }
}

const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      businessId: req.businessId,
    })

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully.',
    })
  } catch (error) {
    return next(error)
  }
}

const sendCustomerMessage = async (req, res, next) => {
  try {
    const customerLookup = [{ entityId: req.params.id }]

    if (mongoose.isValidObjectId(req.params.id)) {
      customerLookup.unshift({ _id: req.params.id })
    }

    const customer = await Customer.findOne({
      businessId: req.businessId,
      $or: customerLookup,
    })

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      })
    }

    const phoneNumber = customer.whatsappNumber || customer.phone
    const result = await sendTextMessage({
      businessId: req.businessId,
      phoneNumber,
      message: req.body.message,
      values: {
        customerName: customer.name || 'Customer',
        customerPhone: phoneNumber,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully.',
      data: result,
    })
  } catch (error) {
    if (error.message) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    return next(error)
  }
}

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  sendCustomerMessage,
}
