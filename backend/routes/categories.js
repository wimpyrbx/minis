const express = require('express')
const router = express.Router()

// Categories endpoints
router.get('/', async (req, res) => {
  try {
    const categories = await req.db.all('SELECT * FROM mini_categories ORDER BY name')
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    const result = await req.db.run(
      'INSERT INTO mini_categories (name) VALUES (?)',
      [name]
    )
    const newCategory = await req.db.get(
      'SELECT * FROM mini_categories WHERE id = ?', 
      result.lastID
    )
    res.status(201).json(newCategory)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body
    await req.db.run(
      'UPDATE mini_categories SET name = ? WHERE id = ?',
      [name, id]
    )
    const updatedCategory = await req.db.get(
      'SELECT * FROM mini_categories WHERE id = ?', 
      id
    )
    res.json(updatedCategory)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    // Check if category has types
    const hasTypes = await req.db.get(`
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
    const inUse = await req.db.get(`
      SELECT COUNT(*) as count 
      FROM mini_to_categories 
      WHERE category_id = ?
    `, req.params.id)

    if (inUse.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete category as it is being used by one or more minis' 
      })
    }

    await req.db.run('DELETE FROM mini_categories WHERE id = ?', req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router 