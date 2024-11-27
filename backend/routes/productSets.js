const express = require('express')
const router = express.Router()

// Get all product sets
router.get('/', async (req, res) => {
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

// Create new product set
router.post('/', async (req, res) => {
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

// Update product set
router.put('/:id', async (req, res) => {
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

// Delete product set
router.delete('/:id', async (req, res) => {
  try {
    // Check if product set has any minis
    const hasMinis = await req.db.get(`
      SELECT COUNT(*) as count 
      FROM minis 
      WHERE product_set_id = ?
    `, [req.params.id])

    if (hasMinis.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete product set as it has associated minis' 
      })
    }

    await req.db.run('DELETE FROM product_sets WHERE id = ?', req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router 