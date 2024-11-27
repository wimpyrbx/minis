const express = require('express')
const router = express.Router()

// Product Lines
router.get('/', async (req, res) => {
  try {
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

module.exports = router

