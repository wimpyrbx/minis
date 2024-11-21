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

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

let db = null

// Initialize database
async function initDatabase() {
  try {
    const dbPath = path.join(__dirname, 'minis.db')
    
    // Create database directory if it doesn't exist
    const dbDir = path.dirname(dbPath)
    if (!fsSync.existsSync(dbDir)) {
      await fs.mkdir(dbDir, { recursive: true })
    }

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })
    
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
    } else if (table === 'settings') {
      // Special handling for settings table
      schema = await db.get(`
        SELECT sql 
        FROM sqlite_master 
        WHERE type='table' AND name=?
      `, [table])
      records = await db.all('SELECT settings_id, setting_name, setting_value FROM settings')
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

// Update the SQL execution endpoint
app.post('/api/execute-sql', async (req, res) => {
  try {
    const { sql } = req.body
    
    // Split SQL into separate statements
    const statements = sql.split(';').filter(stmt => stmt.trim())
    
    let results = []
    
    // Execute each statement
    for (const statement of statements) {
      const trimmedStatement = statement.trim()
      if (!trimmedStatement) continue

      if (trimmedStatement.toLowerCase().startsWith('select')) {
        // For SELECT queries, return the results
        const result = await db.all(trimmedStatement)
        results.push({
          type: 'SELECT',
          rows: result,
          rowCount: result.length
        })
      } else {
        // For other queries (INSERT, UPDATE, etc), execute and return affected rows
        const result = await db.run(trimmedStatement)
        results.push({
          type: 'EXECUTE',
          statement: trimmedStatement.split('\n')[0], // First line of statement
          changes: result.changes || 0,
          lastID: result.lastID || null
        })
      }
    }
    
    res.json({
      success: true,
      results: results,
      message: `Successfully executed ${statements.length} statement(s)`
    })
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message,
      results: []
    })
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
    // Check if category has types
    const hasTypes = await db.get(`
      SELECT COUNT(*) as count 
      FROM mini_types 
      WHERE category_id = ?
    `, req.params.id)

    if (hasTypes.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete category as it contains one or more types' 
      })
    }

    // Check if category is in use by minis
    const inUse = await db.get(`
      SELECT COUNT(*) as count 
      FROM mini_to_categories 
      WHERE category_id = ?
    `, req.params.id)

    if (inUse.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete category as it is being used by one or more minis' 
      })
    }

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
    // Check if type is in use as regular type or proxy type
    const inUse = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM mini_to_types WHERE type_id = ?) +
        (SELECT COUNT(*) FROM mini_to_proxy_types WHERE type_id = ?) as count
    `, [req.params.id, req.params.id])

    if (inUse.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete type as it is being used by one or more minis' 
      })
    }

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
    // Check if manufacturer has product lines
    const hasLines = await db.get(`
      SELECT COUNT(*) as count 
      FROM product_lines 
      WHERE company_id = ?
    `, req.params.id)

    if (hasLines.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete manufacturer as it contains one or more product lines' 
      })
    }

    // Check if any product sets from this manufacturer are in use
    const inUse = await db.get(`
      SELECT COUNT(*) as count 
      FROM mini_to_product_sets mps
      JOIN product_sets ps ON mps.set_id = ps.id
      JOIN product_lines pl ON ps.product_line_id = pl.id
      WHERE pl.company_id = ?
    `, req.params.id)

    if (inUse.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete manufacturer as it contains product lines with sets being used by one or more minis' 
      })
    }

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
    // Check if product line has sets
    const hasSets = await db.get(`
      SELECT COUNT(*) as count 
      FROM product_sets 
      WHERE product_line_id = ?
    `, req.params.id)

    if (hasSets.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete product line as it contains one or more product sets' 
      })
    }

    // Check if any product sets in this line are in use
    const inUse = await db.get(`
      SELECT COUNT(*) as count 
      FROM mini_to_product_sets mps
      JOIN product_sets ps ON mps.set_id = ps.id
      WHERE ps.product_line_id = ?
    `, req.params.id)

    if (inUse.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete product line as it contains sets being used by one or more minis' 
      })
    }

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
    // Check if product set is in use
    const inUse = await db.get(`
      SELECT COUNT(*) as count 
      FROM mini_to_product_sets 
      WHERE set_id = ?
    `, req.params.id)

    if (inUse.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete product set as it is being used by one or more minis' 
      })
    }

    await db.run('DELETE FROM product_sets WHERE id = ?', req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update the processAndSaveImage function
async function processAndSaveImage(imageData, miniId) {
  // Remove data:image/xyz;base64, prefix
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
  const imageBuffer = Buffer.from(base64Data, 'base64')

  // Create directory paths based on ID
  const idStr = miniId.toString()
  const dir1 = idStr.length > 2 ? idStr.slice(0, 1) : '0'
  const dir2 = idStr.length > 1 ? idStr.slice(1, 2) : '0'
  
  // Paths for thumbnails - use path.join with parent directory
  const thumbDirPath = path.join(__dirname, '..', 'public', 'images', 'minis', dir1, dir2)
  await fs.mkdir(thumbDirPath, { recursive: true })
  const thumbnailPath = path.join(thumbDirPath, `${miniId}.webp`)
  const publicThumbPath = `/images/minis/${dir1}/${dir2}/${miniId}.webp`

  // Paths for originals - use path.join with parent directory
  const originalDirPath = path.join(__dirname, '..', 'public', 'images', 'minis', 'originals', dir1, dir2)
  await fs.mkdir(originalDirPath, { recursive: true })
  const originalPath = path.join(originalDirPath, `${miniId}.webp`)
  const publicOriginalPath = `/images/minis/originals/${dir1}/${dir2}/${miniId}.webp`

  // Process and save thumbnail
  await sharp(imageBuffer)
    .resize({ height: 50, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .webp({ quality: 80 })
    .toFile(thumbnailPath)

  // Process and save original (convert to webp but maintain original size)
  await sharp(imageBuffer)
    .webp({ quality: 90 })
    .toFile(originalPath)

  return {
    thumbnail: publicThumbPath,
    original: publicOriginalPath
  }
}

// Update the deleteImages function
async function deleteImages(miniId) {
  try {
    const idStr = miniId.toString()
    const dir1 = idStr.length > 2 ? idStr.slice(0, 1) : '0'
    const dir2 = idStr.length > 1 ? idStr.slice(1, 2) : '0'

    // Paths for both thumbnail and original - use path.join with parent directory
    const thumbnailPath = path.join(__dirname, '..', 'public', 'images', 'minis', dir1, dir2, `${miniId}.webp`)
    const originalPath = path.join(__dirname, '..', 'public', 'images', 'minis', 'originals', dir1, dir2, `${miniId}.webp`)

    // Delete both files if they exist
    await Promise.all([
      fs.unlink(thumbnailPath).catch(() => {}),  // Ignore error if file doesn't exist
      fs.unlink(originalPath).catch(() => {})
    ])
  } catch (error) {
    console.error(`Error deleting images for mini ${miniId}:`, error)
  }
}

// Modify the POST endpoint for minis
app.post('/api/minis', upload.none(), async (req, res) => {
  try {
    console.log('Received request body:', req.body)
    await db.run('BEGIN TRANSACTION')
    
    // Parse JSON strings back to arrays
    const {
      name, description, location, image_path,
      quantity, categories, types, proxy_types, 
      tags, tag_ids, product_sets, painted_by
    } = req.body

    // Parse JSON strings if they're strings
    const parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories
    const parsedTypes = typeof types === 'string' ? JSON.parse(types) : types
    const parsedProxyTypes = typeof proxy_types === 'string' ? JSON.parse(proxy_types) : proxy_types
    const parsedProductSets = typeof product_sets === 'string' ? JSON.parse(product_sets) : product_sets
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags
    const parsedTagIds = typeof tag_ids === 'string' ? JSON.parse(tag_ids) : tag_ids

    console.log('Parsed data:', {
      name,
      description,
      location,
      quantity,
      categories: parsedCategories,
      types: parsedTypes,
      proxy_types: parsedProxyTypes,
      tags: parsedTags,
      tag_ids: parsedTagIds,
      product_sets: parsedProductSets
    })

    // Insert the main mini record first to get the ID
    const result = await db.run(
      `INSERT INTO minis (
        name, description, location,
        quantity, painted_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        name?.trim(),
        description?.trim() || null,
        location?.trim(),
        quantity || 1,
        painted_by || 'prepainted'
      ]
    )

    const miniId = result.lastID
    console.log('Created mini with ID:', miniId)

    // Process image if provided
    if (image_path) {
      console.log('Processing image for mini:', miniId)
      const imagePaths = await processAndSaveImage(image_path, miniId)
      await db.run(
        'UPDATE minis SET image_path = ?, original_image_path = ? WHERE id = ?',
        [imagePaths.thumbnail, imagePaths.original, miniId]
      )
    }

    // Insert categories
    if (parsedCategories?.length > 0) {
      console.log('Inserting categories:', parsedCategories)
      for (const categoryId of parsedCategories) {
        await db.run(
          'INSERT INTO mini_to_categories (mini_id, category_id) VALUES (?, ?)',
          [miniId, categoryId]
        )
      }
    }

    // Insert types
    if (parsedTypes?.length > 0) {
      console.log('Inserting types:', parsedTypes)
      for (const typeId of parsedTypes) {
        await db.run(
          'INSERT INTO mini_to_types (mini_id, type_id) VALUES (?, ?)',
          [miniId, typeId]
        )
      }
    }

    // Insert proxy types
    if (parsedProxyTypes?.length > 0) {
      console.log('Inserting proxy types:', parsedProxyTypes)
      for (const typeId of parsedProxyTypes) {
        await db.run(
          'INSERT INTO mini_to_proxy_types (mini_id, type_id) VALUES (?, ?)',
          [miniId, typeId]
        )
      }
    }

    // Insert tags
    if (parsedTags?.length > 0) {
      console.log('Processing tags:', parsedTags)
      for (const tagName of parsedTags) {
        // Try to get existing tag
        console.log('Looking up tag:', tagName)
        let tagResult = await db.get('SELECT id FROM tags WHERE name = ?', tagName)
        
        // Create tag if it doesn't exist
        if (!tagResult) {
          console.log('Creating new tag:', tagName)
          const newTag = await db.run('INSERT INTO tags (name) VALUES (?)', tagName)
          tagResult = { id: newTag.lastID }
        }

        console.log('Linking tag to mini:', { tagId: tagResult.id, miniId })
        // Link tag to mini
        await db.run(
          'INSERT INTO mini_to_tags (mini_id, tag_id) VALUES (?, ?)',
          [miniId, tagResult.id]
        )
      }
    }

    // Insert product sets
    if (parsedProductSets?.length > 0) {
      console.log('Inserting product sets:', parsedProductSets)
      for (const setId of parsedProductSets) {
        await db.run(
          'INSERT INTO mini_to_product_sets (mini_id, set_id) VALUES (?, ?)',
          [miniId, setId]
        )
      }
    }

    // Commit the transaction
    console.log('Committing transaction')
    await db.run('COMMIT')

    // Get the complete mini data
    console.log('Fetching complete mini data')
    const mini = await db.get(`
      SELECT 
        m.*,
        GROUP_CONCAT(DISTINCT mc.name) as category_names,
        GROUP_CONCAT(DISTINCT mt.name) as type_names,
        GROUP_CONCAT(DISTINCT mpt.name) as proxy_type_names,
        GROUP_CONCAT(DISTINCT t.name) as tag_names,
        GROUP_CONCAT(DISTINCT ps.name || ' (' || pl.name || ' by ' || pc.name || ')') as product_set_names
      FROM minis m
      LEFT JOIN mini_to_categories mtc ON m.id = mtc.mini_id
      LEFT JOIN mini_categories mc ON mtc.category_id = mc.id
      LEFT JOIN mini_to_types mtt ON m.id = mtt.mini_id
      LEFT JOIN mini_types mt ON mtt.type_id = mt.id
      LEFT JOIN mini_to_proxy_types mtpt ON m.id = mtpt.mini_id
      LEFT JOIN mini_types mpt ON mtpt.type_id = mpt.id
      LEFT JOIN mini_to_tags mttg ON m.id = mttg.mini_id
      LEFT JOIN tags t ON mttg.tag_id = t.id
      LEFT JOIN mini_to_product_sets mtps ON m.id = mtps.mini_id
      LEFT JOIN product_sets ps ON mtps.set_id = ps.id
      LEFT JOIN product_lines pl ON ps.product_line_id = pl.id
      LEFT JOIN production_companies pc ON pl.company_id = pc.id
      WHERE m.id = ?
      GROUP BY m.id
    `, miniId)

    console.log('Returning mini data:', mini)
    res.status(201).json(mini)

  } catch (error) {
    // Rollback on error
    console.error('Error during mini creation, rolling back:', error)
    console.error('Stack trace:', error.stack)
    await db.run('ROLLBACK')
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

// Add this new endpoint to get all minis with their related data
app.get('/api/minis', async (req, res) => {
  try {
    const minis = await db.all(`
      SELECT 
        m.*,
        GROUP_CONCAT(DISTINCT mc.name) as category_names,
        GROUP_CONCAT(DISTINCT mt.name) as type_names,
        GROUP_CONCAT(DISTINCT mpt.name) as proxy_type_names,
        GROUP_CONCAT(DISTINCT t.name) as tag_names,
        GROUP_CONCAT(DISTINCT ps.name || ' (' || pl.name || ' by ' || pc.name || ')') as product_set_names
      FROM minis m
      LEFT JOIN mini_to_categories mtc ON m.id = mtc.mini_id
      LEFT JOIN mini_categories mc ON mtc.category_id = mc.id
      LEFT JOIN mini_to_types mtt ON m.id = mtt.mini_id
      LEFT JOIN mini_types mt ON mtt.type_id = mt.id
      LEFT JOIN mini_to_proxy_types mtpt ON m.id = mtpt.mini_id
      LEFT JOIN mini_types mpt ON mtpt.type_id = mpt.id
      LEFT JOIN mini_to_tags mttg ON m.id = mttg.mini_id
      LEFT JOIN tags t ON mttg.tag_id = t.id
      LEFT JOIN mini_to_product_sets mtps ON m.id = mtps.mini_id
      LEFT JOIN product_sets ps ON mtps.set_id = ps.id
      LEFT JOIN product_lines pl ON ps.product_line_id = pl.id
      LEFT JOIN production_companies pc ON pl.company_id = pc.id
      GROUP BY m.id
      ORDER BY m.name
    `)
    res.json(minis)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/minis/:id', async (req, res) => {
  try {
    const miniId = req.params.id
    
    await db.run('BEGIN TRANSACTION')

    // Delete all related records first
    await Promise.all([
      // Delete mini-to-category relationships
      db.run('DELETE FROM mini_to_categories WHERE mini_id = ?', miniId),
      // Delete mini-to-type relationships
      db.run('DELETE FROM mini_to_types WHERE mini_id = ?', miniId),
      // Delete mini-to-proxy-type relationships
      db.run('DELETE FROM mini_to_proxy_types WHERE mini_id = ?', miniId),
      // Delete mini-to-tag relationships
      db.run('DELETE FROM mini_to_tags WHERE mini_id = ?', miniId),
      // Delete mini-to-product-set relationships
      db.run('DELETE FROM mini_to_product_sets WHERE mini_id = ?', miniId)
    ])

    // Clean up unused tags
    await db.run(`
      DELETE FROM tags 
      WHERE id NOT IN (
        SELECT DISTINCT tag_id 
        FROM mini_to_tags
      )
    `)
    
    // Delete the images
    await deleteImages(miniId)
    
    // Finally delete the mini record itself
    await db.run('DELETE FROM minis WHERE id = ?', miniId)
    
    // Commit the transaction
    await db.run('COMMIT')
    
    res.status(204).send()
  } catch (error) {
    // Rollback on error
    await db.run('ROLLBACK')
    console.error('Error deleting mini:', error)
    res.status(500).json({ error: error.message })
  }
})

// Modify the PUT endpoint for minis
app.put('/api/minis/:id', async (req, res) => {
  try {
    await db.run('BEGIN TRANSACTION')

    const miniId = req.params.id
    const {
      name, description, location, image_path,
      quantity, categories, types, proxy_types, 
      tags, product_sets, painted_by
    } = req.body

    // Process new image if provided
    let imagePaths = null
    if (image_path && image_path.startsWith('data:image')) {
      // Delete old images first
      await deleteImages(miniId)
      imagePaths = await processAndSaveImage(image_path, miniId)
    }

    // Update the main mini record
    await db.run(
      `UPDATE minis SET
        name = ?, description = ?, location = ?, 
        image_path = COALESCE(?, image_path),
        original_image_path = COALESCE(?, original_image_path),
        quantity = ?, painted_by = ?, updated_at = datetime('now')
      WHERE id = ?`,
      [
        name.trim(),
        description?.trim() || null,
        location.trim(),
        imagePaths?.thumbnail,
        imagePaths?.original,
        quantity || 1,
        painted_by || 'prepainted',
        miniId
      ]
    )

    // Clear existing relationships
    await db.run('DELETE FROM mini_to_categories WHERE mini_id = ?', miniId)
    await db.run('DELETE FROM mini_to_types WHERE mini_id = ?', miniId)
    await db.run('DELETE FROM mini_to_proxy_types WHERE mini_id = ?', miniId)
    await db.run('DELETE FROM mini_to_tags WHERE mini_id = ?', miniId)
    await db.run('DELETE FROM mini_to_product_sets WHERE mini_id = ?', miniId)

    // Insert categories
    if (categories?.length > 0) {
      console.log('Inserting updated categories:', categories)
      for (const categoryId of categories) {
        await db.run(
          'INSERT INTO mini_to_categories (mini_id, category_id) VALUES (?, ?)',
          [miniId, categoryId]
        )
      }
    }

    // Insert types
    if (types?.length > 0) {
      console.log('Inserting updated types:', types)
      for (const typeId of types) {
        await db.run(
          'INSERT INTO mini_to_types (mini_id, type_id) VALUES (?, ?)',
          [miniId, typeId]
        )
      }
    }

    // Insert proxy types
    if (proxy_types?.length > 0) {
      console.log('Inserting updated proxy types:', proxy_types)
      for (const typeId of proxy_types) {
        await db.run(
          'INSERT INTO mini_to_proxy_types (mini_id, type_id) VALUES (?, ?)',
          [miniId, typeId]
        )
      }
    }

    // Insert tags
    if (tags?.length > 0) {
      console.log('Processing updated tags:', tags)
      for (const tagName of tags) {
        let tagResult = await db.get('SELECT id FROM tags WHERE name = ?', tagName)
        if (!tagResult) {
          const newTag = await db.run('INSERT INTO tags (name) VALUES (?)', tagName)
          tagResult = { id: newTag.lastID }
        }
        await db.run(
          'INSERT INTO mini_to_tags (mini_id, tag_id) VALUES (?, ?)',
          [miniId, tagResult.id]
        )
      }
    }

    // Clean up unused tags
    await db.run(`
      DELETE FROM tags 
      WHERE id NOT IN (
        SELECT DISTINCT tag_id 
        FROM mini_to_tags
      )
    `)

    // Insert product sets
    if (product_sets?.length > 0) {
      console.log('Inserting updated product sets:', product_sets)
      for (const setId of product_sets) {
        await db.run(
          'INSERT INTO mini_to_product_sets (mini_id, set_id) VALUES (?, ?)',
          [miniId, setId]
        )
      }
    }

    // Commit the transaction
    console.log('Committing transaction')
    await db.run('COMMIT')

    // Get the updated mini data
    const mini = await db.get(`
      SELECT 
        m.*,
        GROUP_CONCAT(DISTINCT mc.name) as category_names,
        GROUP_CONCAT(DISTINCT mt.name) as type_names,
        GROUP_CONCAT(DISTINCT mpt.name) as proxy_type_names,
        GROUP_CONCAT(DISTINCT t.name) as tag_names,
        GROUP_CONCAT(DISTINCT ps.name || ' (' || pl.name || ' by ' || pc.name || ')') as product_set_names
      FROM minis m
      LEFT JOIN mini_to_categories mtc ON m.id = mtc.mini_id
      LEFT JOIN mini_categories mc ON mtc.category_id = mc.id
      LEFT JOIN mini_to_types mtt ON m.id = mtt.mini_id
      LEFT JOIN mini_types mt ON mtt.type_id = mt.id
      LEFT JOIN mini_to_proxy_types mtpt ON m.id = mtpt.mini_id
      LEFT JOIN mini_types mpt ON mtpt.type_id = mpt.id
      LEFT JOIN mini_to_tags mttg ON m.id = mttg.mini_id
      LEFT JOIN tags t ON mttg.tag_id = t.id
      LEFT JOIN mini_to_product_sets mtps ON m.id = mtps.mini_id
      LEFT JOIN product_sets ps ON mtps.set_id = ps.id
      LEFT JOIN product_lines pl ON ps.product_line_id = pl.id
      LEFT JOIN production_companies pc ON pl.company_id = pc.id
      WHERE m.id = ?
      GROUP BY m.id
    `, miniId)

    res.json(mini)

  } catch (error) {
    console.error('Error during mini update, rolling back:', error)
    await db.run('ROLLBACK')
    res.status(500).json({ error: error.message })
  }
})

// Add endpoint to get mini with all relationships
app.get('/api/minis/:id/relationships', async (req, res) => {
  try {
    const miniId = req.params.id
    
    // Get basic mini data
    const mini = await db.get('SELECT * FROM minis WHERE id = ?', miniId)
    
    // Get categories
    const categories = await db.all(`
      SELECT category_id 
      FROM mini_to_categories 
      WHERE mini_id = ?
    `, miniId)
    
    // Get types
    const types = await db.all(`
      SELECT type_id 
      FROM mini_to_types 
      WHERE mini_id = ?
    `, miniId)
    
    // Get proxy types
    const proxyTypes = await db.all(`
      SELECT type_id 
      FROM mini_to_proxy_types 
      WHERE mini_id = ?
    `, miniId)
    
    // Get tags
    const tags = await db.all(`
      SELECT t.name 
      FROM mini_to_tags mt
      JOIN tags t ON mt.tag_id = t.id
      WHERE mini_id = ?
    `, miniId)
    
    // Get product sets
    const productSets = await db.all(`
      SELECT set_id 
      FROM mini_to_product_sets 
      WHERE mini_id = ?
    `, miniId)
    
    res.json({
      ...mini,
      categories: categories.map(c => c.category_id.toString()),
      types: types.map(t => t.type_id.toString()),
      proxy_types: proxyTypes.map(t => t.type_id.toString()),
      tags: tags.map(t => t.name),
      product_sets: productSets.map(ps => ps.set_id.toString())
    })
    
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}) 

// Update the static file serving
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images'))) 

// Add settings endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.all('SELECT settings_id, setting_name, setting_value FROM settings')
    // Convert to key-value object
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.setting_name] = curr.setting_value
      return acc
    }, {})
    res.json(settingsObj)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/settings/:name', async (req, res) => {
  try {
    const { name } = req.params
    const { value } = req.body
    const result = await db.run(
      'INSERT OR REPLACE INTO settings (setting_name, setting_value) VALUES (?, ?)',
      [name, value]
    )
    res.json({ 
      settings_id: result.lastID,
      setting_name: name, 
      setting_value: value 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}) 

// Add this new endpoint to clean up unused tags
app.delete('/api/tags/cleanup', async (req, res) => {
  try {
    // Delete tags that aren't associated with any minis
    await db.run(`
      DELETE FROM tags 
      WHERE id NOT IN (
        SELECT DISTINCT tag_id 
        FROM mini_to_tags
      )
    `)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}) 

// Add this near your other endpoints, before the error handler
app.post('/api/export-schema', async (req, res) => {
  try {
    // Get all table names
    const tables = await db.all(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `)

    // Get schema for each table
    const allSchemas = []
    for (const table of tables) {
      // Get table schema
      const schemaResult = await db.get(`
        SELECT sql 
        FROM sqlite_master 
        WHERE type='table' AND name=?
      `, [table.name])

      if (schemaResult?.sql) {
        // Format the schema nicely
        const formattedSchema = schemaResult.sql
          .replace(/,/g, ',\n    ') // Add newlines after commas
          .replace(/\(/g, ' (\n    ') // Add newline after opening parenthesis
          .replace(/\)/g, '\n)') // Add newline before closing parenthesis
          .replace(/CREATE TABLE/g, '\nCREATE TABLE') // Add newline before CREATE TABLE

        allSchemas.push(formattedSchema)
      }
    }
    
    // Create the export directory path - one level up from __dirname
    const exportDir = path.join(__dirname, '..', 'src', 'database')
    const exportPath = path.join(exportDir, 'database.export.txt')
    
    // Create the directory if it doesn't exist
    await fs.mkdir(exportDir, { recursive: true })
    
    // Format the schemas with timestamps and separators
    const timestamp = new Date().toISOString()
    const formattedContent = [
      `-- Database Schema Export`,
      `-- Generated at: ${timestamp}`,
      `-- ----------------------------------------`,
      '',
      ...allSchemas,
      ''
    ].join('\n')
    
    // Write schemas to file
    await fs.writeFile(exportPath, formattedContent, 'utf8')
    
    console.log('Schema exported successfully to:', exportPath)
    res.json({ 
      success: true, 
      message: 'Schema exported successfully',
      path: exportPath
    })
  } catch (error) {
    console.error('Error exporting schema:', error)
    res.status(500).json({ error: error.message })
  }
}) 