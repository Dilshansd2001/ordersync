const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Something went wrong.',
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  })
}

module.exports = {
  notFound,
  errorHandler,
}
