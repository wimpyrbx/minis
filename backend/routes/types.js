const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const types = await req.db.all(`
      SELECT 
        t.*,
        c.name as category_name,
        (SELECT COUNT(DISTINCT mini_id) 
         FROM mini_to_types 
         WHERE type_id = t.id) as type_count,
        (SELECT COUNT(DISTINCT mini_id) 
         FROM mini_to_proxy_types 
         WHERE type_id = t.id) as proxy_count
      FROM mini_types t
      LEFT JOIN mini_categories c ON t.category_id = c.id
      ORDER BY c.name, t.name
    `)
    
    res.json(types)
  } catch (err) {
    console.error('Error fetching types:', err)
    res.status(500).json({ error: 'Failed to fetch types' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, category_id } = req.body
    const result = await req.db.run(
      'INSERT INTO mini_types (name, category_id) VALUES (?, ?)',
      [name, category_id]
    )
    const newType = await req.db.get(
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

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, category_id } = req.body
    await req.db.run(
      'UPDATE mini_types SET name = ?, category_id = ? WHERE id = ?',
      [name, category_id, id]
    )
    const updatedType = await req.db.get(
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

router.delete('/:id', async (req, res) => {
  try {
    // Check if type is in use as regular type or proxy type
    const inUse = await req.db.get(`
      SELECT 
        (SELECT COUNT(*) FROM mini_to_types WHERE type_id = ?) +
        (SELECT COUNT(*) FROM mini_to_proxy_types WHERE type_id = ?) as count
    `, [req.params.id, req.params.id])

    if (inUse.count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete type as it is being used by one or more minis' 
      })
    }

    await req.db.run('DELETE FROM mini_types WHERE id = ?', req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
