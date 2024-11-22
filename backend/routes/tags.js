const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const tags = await req.db.all(`
      SELECT * FROM tags 
      ORDER BY name
    `)
    res.json(tags)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/cleanup', async (req, res) => {
  try {
    await req.db.run(`
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

module.exports = router
