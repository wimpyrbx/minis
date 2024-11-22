const dbMiddleware = (req, res, next) => {
  if (!req.db) {
    console.error('Database connection not initialized for:', req.method, req.path)
    return res.status(503).json({ 
      error: 'Database connection not initialized',
      status: 'error',
      path: req.path,
      method: req.method
    })
  }
  next()
}

module.exports = dbMiddleware 