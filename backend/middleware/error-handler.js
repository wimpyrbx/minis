const errorHandler = (err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
}

module.exports = errorHandler 