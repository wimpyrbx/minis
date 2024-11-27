const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')
const fs = require('fs/promises')
const sharp = require('sharp')
const { mkdirp } = require('mkdirp')
const fsSync = require('fs')
const multer = require('multer')
const upload = multer()

const errorHandler = require('./middleware/error-handler')
const dbMiddleware = require('./middleware/database')

const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Add static file serving from parent public directory
app.use(express.static(path.join(__dirname, '..', 'public')))

// Database initialization
let db = null

async function initDatabase() {
  try {
    const dbPath = path.join(__dirname, 'minis.db')
    
    const dbDir = path.dirname(dbPath)
    if (!fsSync.existsSync(dbDir)) {
      await fs.mkdir(dbDir, { recursive: true })
    }

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })
    
    console.log('Database initialized successfully')
    return db
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

// Add status endpoint
app.get('/status', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        status: 'error',
        message: 'Database not initialized'
      })
    }

    const result = await db.get('SELECT COUNT(*) as count FROM mini_categories')
    res.json({ 
      status: 'connected',
      database: {
        initialized: true,
        tables: {
          categories: result.count
        }
      }
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    })
  }
})

// Start server only after database is initialized
async function startServer() {
  try {
    db = await initDatabase()

    // Add database middleware after initialization
    app.use((req, res, next) => {
      req.db = db
      next()
    })
    app.use(dbMiddleware)

    // Import and mount all routes
    const databaseRoutes = require('./routes/database')
    const categoriesRoutes = require('./routes/categories')
    const typesRoutes = require('./routes/types')
    const manufacturersRoutes = require('./routes/manufacturers')
    const productsRoutes = require('./routes/products')
    const productSetsRoutes = require('./routes/productSets')
    const minisRoutes = require('./routes/minis')
    const settingsRoutes = require('./routes/settings')
    const tagsRoutes = require('./routes/tags')
    const referenceRoutes = require('./routes/reference')

    app.use('/api', databaseRoutes)
    app.use('/api/categories', categoriesRoutes)
    app.use('/api/types', typesRoutes)
    app.use('/api/manufacturers', manufacturersRoutes)
    app.use('/api/product-lines', productsRoutes)
    app.use('/api/product-sets', productSetsRoutes)
    app.use('/api/minis', minisRoutes)
    app.use('/api/settings', settingsRoutes)
    app.use('/api/tags', tagsRoutes)
    app.use('/api', referenceRoutes)

    // Error handler
    app.use(errorHandler)

    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

module.exports = app 