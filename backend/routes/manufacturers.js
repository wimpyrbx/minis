const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const manufacturers = await req.db.all(`
      SELECT * FROM production_companies 
      ORDER BY name
    `)
    res.json(manufacturers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const result = await req.db.run(
      'INSERT INTO production_companies (name) VALUES (?)',
      [name.trim()]
    )
    const newManufacturer = await req.db.get(
      'SELECT * FROM production_companies WHERE id = ?', 
      result.lastID
    )
    res.status(201).json(newManufacturer)
  } catch (error) {
    // Handle unique constraint violation
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A manufacturer with this name already exists' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' })
    }

    // Check if manufacturer exists
    const exists = await req.db.get(
      'SELECT 1 FROM production_companies WHERE id = ?',
      [id]
    )

    if (!exists) {
      return res.status(404).json({ error: 'Manufacturer not found' })
    }

    await req.db.run(
      'UPDATE production_companies SET name = ? WHERE id = ?',
      [name.trim(), id]
    )
    const updatedManufacturer = await req.db.get(
      'SELECT * FROM production_companies WHERE id = ?', 
      id
    )
    res.json(updatedManufacturer)
  } catch (error) {
    // Handle unique constraint violation
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A manufacturer with this name already exists' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Check if manufacturer exists
    const exists = await req.db.get(
      'SELECT 1 FROM production_companies WHERE id = ?',
      [id]
    )

    if (!exists) {
      return res.status(404).json({ error: 'Manufacturer not found' })
    }

    // Check if manufacturer has product lines
    const hasProductLines = await req.db.get(`
      SELECT COUNT(*) as count 
      FROM product_lines 
      WHERE company_id = ?
    `, [id])

    if (hasProductLines.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete manufacturer as it has associated product lines' 
      })
    }

    await req.db.run('DELETE FROM production_companies WHERE id = ?', id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
