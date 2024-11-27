const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs').promises

// Database management endpoints
router.get('/database/:table', async (req, res) => {
  try {
    const { table } = req.params
    let schema, records

    if (table === 'sqlite_sequence') {
      schema = {
        sql: `CREATE TABLE sqlite_sequence (name TEXT, seq INTEGER)`
      }
      records = await req.db.all('SELECT * FROM sqlite_sequence')
    } else {
      schema = await req.db.get(`
        SELECT sql 
        FROM sqlite_master 
        WHERE type='table' AND name=?
      `, [table])

      const columns = await req.db.all(`
        PRAGMA table_info(${table})
      `)
      const hasIdColumn = columns.some(col => col.name.toLowerCase() === 'id')

      records = await req.db.all(`
        SELECT * 
        FROM ${table}
        ${hasIdColumn ? 'ORDER BY id DESC' : ''}
        LIMIT 10
      `)
    }

    res.json({
      schema: schema?.sql,
      records: records || []
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/execute-sql', async (req, res) => {
  try {
    const { sql } = req.body
    const statements = sql.split(';').filter(stmt => stmt.trim())
    let results = []
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim()
      if (!trimmedStatement) continue

      if (trimmedStatement.toLowerCase().startsWith('select')) {
        const result = await req.db.all(trimmedStatement)
        results.push({
          type: 'SELECT',
          rows: result,
          rowCount: result.length
        })
      } else {
        const result = await req.db.run(trimmedStatement)
        results.push({
          type: 'EXECUTE',
          statement: trimmedStatement.split('\n')[0],
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

router.post('/export-schema', async (req, res) => {
  try {
    const tables = await req.db.all(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `)

    const allSchemas = []
    for (const table of tables) {
      const schemaResult = await req.db.get(`
        SELECT sql 
        FROM sqlite_master 
        WHERE type='table' AND name=?
      `, [table.name])

      if (schemaResult?.sql) {
        const formattedSchema = schemaResult.sql
          .replace(/,/g, ',\n    ')
          .replace(/\(/g, ' (\n    ')
          .replace(/\)/g, '\n)')
          .replace(/CREATE TABLE/g, '\nCREATE TABLE')

        allSchemas.push(formattedSchema)
      }
    }
    
    const exportDir = path.join(__dirname, '..', '..', 'src', 'database')
    const exportPath = path.join(exportDir, 'database.export.txt')
    
    await fs.mkdir(exportDir, { recursive: true })
    
    const timestamp = new Date().toISOString()
    const formattedContent = [
      `-- Database Schema Export`,
      `-- Generated at: ${timestamp}`,
      `-- ----------------------------------------`,
      '',
      ...allSchemas,
      ''
    ].join('\n')
    
    await fs.writeFile(exportPath, formattedContent, 'utf8')
    
    res.json({ 
      success: true, 
      message: 'Schema exported successfully',
      path: exportPath
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router 