const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')
const fs = require('fs')

const app = express()
app.use(cors())
app.use(express.json())

let db = null

// Initialize database
async function initDatabase() {
  try {
    const dbPath = path.join(__dirname, 'minis.db')
    
    // Create database directory if it doesn't exist
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })
    
    await db.exec('PRAGMA foreign_keys = ON;')
    
    // Create tables - split into separate statements
    const statements = [
      `CREATE TABLE IF NOT EXISTS mini_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          image_path TEXT,
          UNIQUE(name)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_mini_categories_name ON mini_categories(name);`,

      `CREATE TABLE IF NOT EXISTS mini_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category_id INTEGER NOT NULL,
          image_path TEXT,
          FOREIGN KEY (category_id) REFERENCES mini_categories(id) ON DELETE CASCADE,
          UNIQUE(name, category_id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_mini_types_category ON mini_types(category_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mini_types_name ON mini_types(name);`,

      `CREATE TABLE IF NOT EXISTS production_companies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          UNIQUE(name)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_production_companies_name ON production_companies(name);`,

      `CREATE TABLE IF NOT EXISTS product_lines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          company_id INTEGER NOT NULL,
          FOREIGN KEY (company_id) REFERENCES production_companies(id) ON DELETE CASCADE,
          UNIQUE(name, company_id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_product_lines_company ON product_lines(company_id);`,
      `CREATE INDEX IF NOT EXISTS idx_product_lines_name ON product_lines(name);`,

      `CREATE TABLE IF NOT EXISTS product_sets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          product_line_id INTEGER NOT NULL,
          FOREIGN KEY (product_line_id) REFERENCES product_lines(id) ON DELETE CASCADE,
          UNIQUE(name, product_line_id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_product_sets_line ON product_sets(product_line_id);`,
      `CREATE INDEX IF NOT EXISTS idx_product_sets_name ON product_sets(name);`,

      `CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          UNIQUE(name)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);`,

      `CREATE TABLE IF NOT EXISTS minis (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          location TEXT,
          image_path TEXT,
          quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
          painted BOOLEAN DEFAULT 0,
          assembled BOOLEAN DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
      );`,
      `CREATE INDEX IF NOT EXISTS idx_minis_name ON minis(name);`,

      `CREATE TABLE IF NOT EXISTS mini_to_categories (
          mini_id INTEGER NOT NULL,
          category_id INTEGER NOT NULL,
          FOREIGN KEY (mini_id) REFERENCES minis(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES mini_categories(id) ON DELETE CASCADE,
          PRIMARY KEY (mini_id, category_id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_mini_to_categories_mini ON mini_to_categories(mini_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mini_to_categories_category ON mini_to_categories(category_id);`,

      `CREATE TABLE IF NOT EXISTS mini_to_types (
          mini_id INTEGER NOT NULL,
          type_id INTEGER NOT NULL,
          FOREIGN KEY (mini_id) REFERENCES minis(id) ON DELETE CASCADE,
          FOREIGN KEY (type_id) REFERENCES mini_types(id) ON DELETE CASCADE,
          PRIMARY KEY (mini_id, type_id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_mini_to_types_mini ON mini_to_types(mini_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mini_to_types_type ON mini_to_types(type_id);`,

      `CREATE TABLE IF NOT EXISTS mini_to_product_sets (
          mini_id INTEGER NOT NULL,
          set_id INTEGER NOT NULL,
          FOREIGN KEY (mini_id) REFERENCES minis(id) ON DELETE CASCADE,
          FOREIGN KEY (set_id) REFERENCES product_sets(id) ON DELETE CASCADE,
          PRIMARY KEY (mini_id, set_id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_mini_to_product_sets_mini ON mini_to_product_sets(mini_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mini_to_product_sets_set ON mini_to_product_sets(set_id);`,

      `CREATE TABLE IF NOT EXISTS mini_to_tags (
          mini_id INTEGER NOT NULL,
          tag_id INTEGER NOT NULL,
          FOREIGN KEY (mini_id) REFERENCES minis(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
          PRIMARY KEY (mini_id, tag_id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_mini_to_tags_mini ON mini_to_tags(mini_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mini_to_tags_tag ON mini_to_tags(tag_id);`,

      `CREATE TABLE IF NOT EXISTS mini_to_proxy_types (
          mini_id INTEGER NOT NULL,
          type_id INTEGER NOT NULL,
          FOREIGN KEY (mini_id) REFERENCES minis(id) ON DELETE CASCADE,
          FOREIGN KEY (type_id) REFERENCES mini_types(id) ON DELETE CASCADE,
          PRIMARY KEY (mini_id, type_id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_mini_to_proxy_types_mini ON mini_to_proxy_types(mini_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mini_to_proxy_types_type ON mini_to_proxy_types(type_id);`
    ]

    // Execute each statement separately
    for (const statement of statements) {
      await db.exec(statement)
    }

    console.log('Database initialized successfully')

    // Add status endpoint
    app.get('/status', async (req, res) => {
      try {
        const result = await db.get('SELECT COUNT(*) as count FROM mini_categories')
        res.json({ 
          status: 'connected',
          tables: {
            categories: result.count
          }
        })
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    process.exit(1)
  }
}

// Initialize database when server starts
initDatabase()

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something broke!' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Update the database endpoint
app.get('/api/database/:table', async (req, res) => {
  try {
    const { table } = req.params
    let schema, records

    if (table === 'sqlite_sequence') {
      // Special handling for sqlite_sequence table
      schema = {
        sql: `CREATE TABLE sqlite_sequence (
    name TEXT,
    seq INTEGER
)`
      }
      records = await db.all('SELECT * FROM sqlite_sequence')
    } else {
      // Get table schema for regular tables
      schema = await db.get(`
        SELECT sql 
        FROM sqlite_master 
        WHERE type='table' AND name=?
      `, [table])

      // Get recent records with appropriate ORDER BY based on table structure
      const orderColumn = (() => {
        switch (table) {
          case 'mini_to_categories':
          case 'mini_to_types':
          case 'mini_to_product_sets':
          case 'mini_to_tags':
          case 'mini_to_proxy_types':
            return 'mini_id'
          case 'mini_types':
            return 'category_id'
          case 'product_lines':
            return 'company_id'
          case 'product_sets':
            return 'product_line_id'
          default:
            return 'id'
        }
      })()

      records = await db.all(`
        SELECT * 
        FROM ${table} 
        ORDER BY ${orderColumn} DESC 
        LIMIT 10
      `)
    }

    res.json({
      schema: schema?.sql,
      records: records || []
    })
  } catch (error) {
    console.error(`Error fetching data for table ${req.params.table}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// Add this endpoint to handle SQL execution
app.post('/api/execute-sql', async (req, res) => {
  try {
    const { sql } = req.body
    
    // Split SQL into separate statements
    const statements = sql.split(';').filter(stmt => stmt.trim())
    
    let results = []
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim().toLowerCase().startsWith('select')) {
        // For SELECT queries, return the results
        const result = await db.all(statement)
        results = result // Return results of last SELECT
      } else {
        // For other queries (INSERT, UPDATE, etc), execute and continue
        await db.exec(statement)
      }
    }
    
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Categories endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.all('SELECT * FROM mini_categories ORDER BY name')
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/categories', async (req, res) => {
  try {
    const { name, image_path } = req.body
    const result = await db.run(
      'INSERT INTO mini_categories (name, image_path) VALUES (?, ?)',
      [name, image_path]
    )
    const newCategory = await db.get('SELECT * FROM mini_categories WHERE id = ?', result.lastID)
    res.status(201).json(newCategory)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM mini_categories WHERE id = ?', req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Types endpoints
app.get('/api/types', async (req, res) => {
  try {
    const types = await db.all(`
      SELECT mt.*, mc.name as category_name 
      FROM mini_types mt
      JOIN mini_categories mc ON mt.category_id = mc.id
      ORDER BY mc.name, mt.name
    `)
    res.json(types)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/types', async (req, res) => {
  try {
    const { name, category_id, image_path } = req.body
    const result = await db.run(
      'INSERT INTO mini_types (name, category_id, image_path) VALUES (?, ?, ?)',
      [name, category_id, image_path]
    )
    const newType = await db.get(
      `SELECT mt.*, mc.name as category_name 
       FROM mini_types mt
       JOIN mini_categories mc ON mt.category_id = mc.id
       WHERE mt.id = ?`, 
      result.lastID
    )
    res.status(201).json(newType)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/types/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM mini_types WHERE id = ?', req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, image_path } = req.body
    await db.run(
      'UPDATE mini_categories SET name = ?, image_path = ? WHERE id = ?',
      [name, image_path, id]
    )
    const updatedCategory = await db.get('SELECT * FROM mini_categories WHERE id = ?', id)
    res.json(updatedCategory)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update type
app.put('/api/types/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, category_id, image_path } = req.body
    await db.run(
      'UPDATE mini_types SET name = ?, category_id = ?, image_path = ? WHERE id = ?',
      [name, category_id, image_path, id]
    )
    const updatedType = await db.get(
      `SELECT mt.*, mc.name as category_name 
       FROM mini_types mt
       JOIN mini_categories mc ON mt.category_id = mc.id
       WHERE mt.id = ?`, 
      id
    )
    res.json(updatedType)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Manufacturers endpoints
app.get('/api/manufacturers', async (req, res) => {
  try {
    const manufacturers = await db.all(`
      SELECT * FROM production_companies 
      ORDER BY name
    `)
    res.json(manufacturers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/manufacturers', async (req, res) => {
  try {
    const { name } = req.body
    const result = await db.run(
      'INSERT INTO production_companies (name) VALUES (?)',
      [name]
    )
    const newManufacturer = await db.get(
      'SELECT * FROM production_companies WHERE id = ?', 
      result.lastID
    )
    res.status(201).json(newManufacturer)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/manufacturers/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body
    await db.run(
      'UPDATE production_companies SET name = ? WHERE id = ?',
      [name, id]
    )
    const updatedManufacturer = await db.get(
      'SELECT * FROM production_companies WHERE id = ?', 
      id
    )
    res.json(updatedManufacturer)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/manufacturers/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM production_companies WHERE id = ?', req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Product Lines endpoints
app.get('/api/product-lines', async (req, res) => {
  try {
    const productLines = await db.all(`
      SELECT pl.*, pc.name as manufacturer_name
      FROM product_lines pl
      JOIN production_companies pc ON pl.company_id = pc.id
      ORDER BY pl.name
    `)
    res.json(productLines)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/product-lines', async (req, res) => {
  try {
    const { name, company_id } = req.body
    const result = await db.run(
      'INSERT INTO product_lines (name, company_id) VALUES (?, ?)',
      [name, company_id]
    )
    const newProductLine = await db.get(
      `SELECT pl.*, pc.name as manufacturer_name
       FROM product_lines pl
       JOIN production_companies pc ON pl.company_id = pc.id
       WHERE pl.id = ?`, 
      result.lastID
    )
    res.status(201).json(newProductLine)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/product-lines/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, company_id } = req.body
    await db.run(
      'UPDATE product_lines SET name = ?, company_id = ? WHERE id = ?',
      [name, company_id, id]
    )
    const updatedProductLine = await db.get(
      `SELECT pl.*, pc.name as manufacturer_name
       FROM product_lines pl
       JOIN production_companies pc ON pl.company_id = pc.id
       WHERE pl.id = ?`, 
      id
    )
    res.json(updatedProductLine)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/product-lines/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM product_lines WHERE id = ?', req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Product Sets endpoints
app.get('/api/product-sets', async (req, res) => {
  try {
    const productSets = await db.all(`
      SELECT ps.*, pl.name as product_line_name, pc.name as manufacturer_name, pc.id as manufacturer_id
      FROM product_sets ps
      JOIN product_lines pl ON ps.product_line_id = pl.id
      JOIN production_companies pc ON pl.company_id = pc.id
      ORDER BY ps.name
    `)
    res.json(productSets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/product-sets', async (req, res) => {
  try {
    const { name, product_line_id } = req.body
    const result = await db.run(
      'INSERT INTO product_sets (name, product_line_id) VALUES (?, ?)',
      [name, product_line_id]
    )
    const newProductSet = await db.get(
      `SELECT ps.*, pl.name as product_line_name
       FROM product_sets ps
       JOIN product_lines pl ON ps.product_line_id = pl.id
       WHERE ps.id = ?`, 
      result.lastID
    )
    res.status(201).json(newProductSet)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/product-sets/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, product_line_id } = req.body
    await db.run(
      'UPDATE product_sets SET name = ?, product_line_id = ? WHERE id = ?',
      [name, product_line_id, id]
    )
    const updatedProductSet = await db.get(
      `SELECT ps.*, pl.name as product_line_name
       FROM product_sets ps
       JOIN product_lines pl ON ps.product_line_id = pl.id
       WHERE ps.id = ?`, 
      id
    )
    res.json(updatedProductSet)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/product-sets/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM product_sets WHERE id = ?', req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new mini with all relationships
app.post('/api/minis', async (req, res) => {
  const {
    name, description, location, image_path,
    quantity, painted, assembled,
    categories, types, proxy_types, product_sets, tags
  } = req.body

  try {
    // Start a transaction
    await db.run('BEGIN TRANSACTION')

    try {
      // Insert the mini
      const miniResult = await db.run(`
        INSERT INTO minis (
          name, description, location, image_path,
          quantity, painted, assembled
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [name, description, location, image_path, quantity, painted, assembled])

      const miniId = miniResult.lastID

      // Insert categories
      for (const categoryId of categories) {
        await db.run(
          'INSERT INTO mini_to_categories (mini_id, category_id) VALUES (?, ?)',
          [miniId, categoryId]
        )
      }

      // Insert types
      for (const typeId of types) {
        await db.run(
          'INSERT INTO mini_to_types (mini_id, type_id) VALUES (?, ?)',
          [miniId, typeId]
        )
      }

      // Insert proxy types
      for (const typeId of proxy_types) {
        await db.run(
          'INSERT INTO mini_to_proxy_types (mini_id, type_id) VALUES (?, ?)',
          [miniId, typeId]
        )
      }

      // Insert product sets
      for (const setId of product_sets) {
        await db.run(
          'INSERT INTO mini_to_product_sets (mini_id, set_id) VALUES (?, ?)',
          [miniId, setId]
        )
      }

      // Insert tags (create if they don't exist)
      for (const tagName of tags) {
        // Try to get existing tag
        let tagResult = await db.get('SELECT id FROM tags WHERE name = ?', tagName)
        
        // Create tag if it doesn't exist
        if (!tagResult) {
          const newTag = await db.run('INSERT INTO tags (name) VALUES (?)', tagName)
          tagResult = { id: newTag.lastID }
        }

        // Link tag to mini
        await db.run(
          'INSERT INTO mini_to_tags (mini_id, tag_id) VALUES (?, ?)',
          [miniId, tagResult.id]
        )
      }

      // Commit the transaction
      await db.run('COMMIT')

      // Get the complete mini data
      const mini = await db.get('SELECT * FROM minis WHERE id = ?', miniId)
      res.status(201).json(mini)

    } catch (error) {
      // Rollback on error
      await db.run('ROLLBACK')
      throw error
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all tags
app.get('/api/tags', async (req, res) => {
  try {
    const tags = await db.all(`
      SELECT * FROM tags 
      ORDER BY name
    `)
    res.json(tags)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}) 