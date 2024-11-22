const express = require('express')
const router = express.Router()

router.get('/base-sizes', async (req, res) => {
  try {
    const baseSizes = await req.db.all('SELECT * FROM base_sizes ORDER BY id')
    res.json(baseSizes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/painted-by', async (req, res) => {
  try {
    const paintedBy = await req.db.all('SELECT * FROM painted_by ORDER BY id')
    res.json(paintedBy)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
