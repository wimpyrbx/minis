const express = require('express')
const router = express.Router()

// Product Lines
router.get('/', async (req, res) => {
  try {
    // Check if we're accessing through /api/product-sets
    if (req.baseUrl === '/api/product-sets') {
      const productSets = await req.db.all(`
        SELECT ps.*, pl.name as product_line_name, pc.name as manufacturer_name
        FROM product_sets ps
        JOIN product_lines pl ON ps.product_line_id = pl.id
        JOIN production_companies pc ON pl.company_id = pc.id
        ORDER BY pc.name, pl.name, ps.name
      `)
      return res.json(productSets)
    }

    // Original product lines logic
    const productLines = await req.db.all(`
      SELECT pl.*, pc.name as manufacturer_name
      FROM product_lines pl
      JOIN production_companies pc ON pl.company_id = pc.id
      ORDER BY pc.name, pl.name
    `)
    res.json(productLines)
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, company_id } = req.body
    const result = await req.db.run(
      'INSERT INTO product_lines (name, company_id) VALUES (?, ?)',
      [name, company_id]
    )
    const newProductLine = await req.db.get(
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

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, company_id } = req.body
    await req.db.run(
      'UPDATE product_lines SET name = ?, company_id = ? WHERE id = ?',
      [name, company_id, id]
    )
    const updatedProductLine = await req.db.get(
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

router.delete('/:id', async (req, res) => {
  try {
    // Check if product line has any product sets
    const hasSets = await req.db.get(`
      SELECT COUNT(*) as count 
      FROM product_sets 
      WHERE product_line_id = ?
    `, [req.params.id])

    if (hasSets.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete product line as it has associated product sets' 
      })
    }

    await req.db.run('DELETE FROM product_lines WHERE id = ?', req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Global product sets endpoint (to match the frontend expectation)
router.get('/sets', async (req, res) => {
  try {
    const productSets = await req.db.all(`
      SELECT ps.*, pl.name as product_line_name, pc.name as manufacturer_name
      FROM product_sets ps
      JOIN product_lines pl ON ps.product_line_id = pl.id
      JOIN production_companies pc ON pl.company_id = pc.id
      ORDER BY pc.name, pl.name, ps.name
    `)
    res.json(productSets)
  } catch (error) {
    console.error('Error fetching product sets:', error)
    res.status(500).json({ error: error.message })
  }
})

// Keep the original endpoint as an alias
router.get('/sets/all', async (req, res) => {
  try {
    const productSets = await req.db.all(`
      SELECT ps.*, pl.name as product_line_name, pc.name as manufacturer_name
      FROM product_sets ps
      JOIN product_lines pl ON ps.product_line_id = pl.id
      JOIN production_companies pc ON pl.company_id = pc.id
      ORDER BY pc.name, pl.name, ps.name
    `)
    res.json(productSets)
  } catch (error) {
    console.error('Error fetching all product sets:', error)
    res.status(500).json({ error: error.message })
  }
})

// Product Sets by Product Line
router.get('/:lineId/sets', async (req, res) => {
  try {
    const productSets = await req.db.all(`
      SELECT ps.*, pl.name as product_line_name, pc.name as manufacturer_name
      FROM product_sets ps
      JOIN product_lines pl ON ps.product_line_id = pl.id
      JOIN production_companies pc ON pl.company_id = pc.id
      WHERE pl.id = ?
      ORDER BY ps.name
    `, req.params.lineId)
    res.json(productSets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/sets', async (req, res) => {
  try {
    const { name, product_line_id } = req.body
    const result = await req.db.run(
      'INSERT INTO product_sets (name, product_line_id) VALUES (?, ?)',
      [name, product_line_id]
    )
    const newProductSet = await req.db.get(
      `SELECT ps.*, pl.name as product_line_name, pc.name as manufacturer_name
       FROM product_sets ps
       JOIN product_lines pl ON ps.product_line_id = pl.id
       JOIN production_companies pc ON pl.company_id = pc.id
       WHERE ps.id = ?`, 
      result.lastID
    )
    res.status(201).json(newProductSet)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/sets/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, product_line_id } = req.body
    await req.db.run(
      'UPDATE product_sets SET name = ?, product_line_id = ? WHERE id = ?',
      [name, product_line_id, id]
    )
    const updatedProductSet = await req.db.get(
      `SELECT ps.*, pl.name as product_line_name, pc.name as manufacturer_name
       FROM product_sets ps
       JOIN product_lines pl ON ps.product_line_id = pl.id
       JOIN production_companies pc ON pl.company_id = pc.id
       WHERE ps.id = ?`,
      id
    )
    res.json(updatedProductSet)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/sets/:id', async (req, res) => {
  try {
    // Check if product set is used by any minis
    const inUse = await req.db.get(`
      SELECT COUNT(*) as count 
      FROM minis 
      WHERE product_set_id = ?
    `, [req.params.id])

    if (inUse.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete product set as it is being used by one or more minis' 
      })
    }

    await req.db.run('DELETE FROM product_sets WHERE id = ?', req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
