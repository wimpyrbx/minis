const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const settings = await req.db.all('SELECT settings_id, setting_name, setting_value FROM settings')
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.setting_name] = curr.setting_value
      return acc
    }, {})
    res.json(settingsObj)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:name', async (req, res) => {
  try {
    const { name } = req.params
    const { value } = req.body
    const result = await req.db.run(
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

// Move specific settings endpoint before the generic /:name endpoint
router.get('/productadmin_entries_per_page', async (req, res) => {
  try {
    const setting = await req.db.get(
      'SELECT setting_value FROM settings WHERE setting_name = ?', 
      ['productadmin_entries_per_page']
    )
    res.json({ value: setting?.setting_value || '10' })
  } catch (error) {
    console.error('Error fetching productadmin_entries_per_page:', error)
    res.json({ value: '10' }) // Always return a valid value
  }
})

router.get('/minisadmin_entries_per_page', async (req, res) => {
  try {
    const setting = await req.db.get(
      'SELECT setting_value FROM settings WHERE setting_name = ?', 
      ['minisadmin_entries_per_page']
    )
    res.json({ value: setting?.setting_value || '10' })
  } catch (error) {
    console.error('Error fetching minisadmin_entries_per_page:', error)
    res.json({ value: '10' }) // Always return a valid value
  }
})

// Generic settings endpoint comes last
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params
    const setting = await req.db.get(
      'SELECT setting_value FROM settings WHERE setting_name = ?', 
      [name]
    )
    
    // Default values for specific settings
    const defaults = {
      'productadmin_entries_per_page': '10',
      'minisadmin_entries_per_page': '10'
    }

    res.json({ 
      value: setting?.setting_value || defaults[name] || null 
    })
  } catch (error) {
    console.error(`Settings error for ${req.params.name}:`, error)
    res.status(500).json({ 
      error: `Error fetching setting: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

module.exports = router
