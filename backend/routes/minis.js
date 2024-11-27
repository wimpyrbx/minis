const express = require('express')
const router = express.Router()
const multer = require('multer')
const upload = multer()
const sharp = require('sharp')
const path = require('path')
const fs = require('fs').promises

// Routes
router.get('/', async (req, res) => {
  try {
    const minis = await req.db.all(`
      SELECT 
        m.*,
        pb.painted_by_name,
        bs.base_size_name,
        ps.name as product_set_name,
        pl.name as product_line_name,
        pc.name as manufacturer_name,
        GROUP_CONCAT(DISTINCT mc.name) as category_names,
        GROUP_CONCAT(DISTINCT mt.name) as type_names,
        GROUP_CONCAT(DISTINCT mpt.name) as proxy_type_names,
        GROUP_CONCAT(DISTINCT t.name) as tag_names
      FROM minis m
      LEFT JOIN painted_by pb ON m.painted_by_id = pb.id
      LEFT JOIN base_sizes bs ON m.base_size_id = bs.id
      LEFT JOIN product_sets ps ON m.product_set_id = ps.id
      LEFT JOIN product_lines pl ON ps.product_line_id = pl.id
      LEFT JOIN production_companies pc ON pl.company_id = pc.id
      LEFT JOIN mini_to_categories mtc ON m.id = mtc.mini_id
      LEFT JOIN mini_categories mc ON mtc.category_id = mc.id
      LEFT JOIN mini_to_types mtt ON m.id = mtt.mini_id
      LEFT JOIN mini_types mt ON mtt.type_id = mt.id
      LEFT JOIN mini_to_proxy_types mtpt ON m.id = mtpt.mini_id
      LEFT JOIN mini_types mpt ON mtpt.type_id = mpt.id
      LEFT JOIN mini_to_tags mttg ON m.id = mttg.mini_id
      LEFT JOIN tags t ON mttg.tag_id = t.id
      GROUP BY m.id
      ORDER BY m.id DESC
    `)

    // Add image paths to each mini
    const minisWithImages = minis.map(mini => {
      const x = mini.id.toString()[0]
      const y = mini.id.toString().length > 1 ? mini.id.toString()[1] : '0'
      return {
        ...mini,
        image_path: `/images/minis/${x}/${y}/${mini.id}.webp`,
        original_image_path: `/images/minis/originals/${x}/${y}/${mini.id}.webp`
      }
    })

    res.json(minisWithImages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', upload.none(), async (req, res) => {
  try {
    await req.db.run('BEGIN TRANSACTION')
    
    const {
      name, description, location,
      quantity, categories, types, proxy_types, 
      tags, painted_by, base_size_id,
      product_sets, image
    } = req.body

    // Parse JSON strings if needed
    const parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories
    const parsedTypes = typeof types === 'string' ? JSON.parse(types) : types
    const parsedProxyTypes = typeof proxy_types === 'string' ? JSON.parse(proxy_types) : proxy_types
    const parsedProductSets = typeof product_sets === 'string' ? JSON.parse(product_sets) : product_sets
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags

    const product_set_id = parsedProductSets?.length > 0 ? parsedProductSets[0] : null

    // Insert main mini record
    const result = await req.db.run(
      `INSERT INTO minis (
        name, description, location,
        quantity, painted_by_id, base_size_id, product_set_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        name?.trim(),
        description?.trim() || null,
        location?.trim(),
        quantity || 1,
        painted_by,
        base_size_id,
        product_set_id
      ]
    )

    const miniId = result.lastID

    // Handle image if provided
    if (image) {
      const imageBuffer = Buffer.from(image.split(',')[1], 'base64')
      
      // Calculate directory paths based on ID
      const idStr = miniId.toString()
      const x = idStr[0]
      const y = idStr.length > 1 ? idStr[1] : '0'
      
      const originalDir = path.join('public', 'images', 'minis', 'originals', x, y)
      const thumbDir = path.join('public', 'images', 'minis', x, y)
      
      // Ensure directories exist
      await fs.mkdir(originalDir, { recursive: true })
      await fs.mkdir(thumbDir, { recursive: true })
      
      const originalPath = path.join(originalDir, `${miniId}.webp`)
      const thumbPath = path.join(thumbDir, `${miniId}.webp`)

      // Save original image
      await sharp(imageBuffer)
        .webp({ quality: 100 })
        .toFile(originalPath)

      // Create and save thumbnail
      await sharp(imageBuffer)
        .resize(50, 50, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 80 })
        .toFile(thumbPath)
    }

    // Handle tags
    if (parsedTags?.length > 0) {
      for (const tagName of parsedTags) {
        let tagResult = await req.db.get('SELECT id FROM tags WHERE name = ?', tagName.trim())
        
        if (!tagResult) {
          const newTag = await req.db.run(
            'INSERT INTO tags (name) VALUES (?)',
            [tagName.trim()]
          )
          tagResult = { id: newTag.lastID }
        }

        await req.db.run(
          'INSERT INTO mini_to_tags (mini_id, tag_id) VALUES (?, ?)',
          [miniId, tagResult.id]
        )
      }
    }

    // Insert categories
    if (parsedCategories?.length > 0) {
      for (const categoryId of parsedCategories) {
        await req.db.run(
          'INSERT INTO mini_to_categories (mini_id, category_id) VALUES (?, ?)',
          [miniId, categoryId]
        )
      }
    }

    // Insert types
    if (parsedTypes?.length > 0) {
      for (const typeId of parsedTypes) {
        await req.db.run(
          'INSERT INTO mini_to_types (mini_id, type_id) VALUES (?, ?)',
          [miniId, typeId]
        )
      }
    }

    // Insert proxy types
    if (parsedProxyTypes?.length > 0) {
      for (const typeId of parsedProxyTypes) {
        await req.db.run(
          'INSERT INTO mini_to_proxy_types (mini_id, type_id) VALUES (?, ?)',
          [miniId, typeId]
        )
      }
    }

    await req.db.run('COMMIT')

    // Fetch complete mini data and add image paths
    const newMini = await req.db.get(`
      SELECT 
        m.*,
        pb.painted_by_name,
        bs.base_size_name,
        ps.name as product_set_name,
        pl.name as product_line_name,
        pc.name as manufacturer_name,
        GROUP_CONCAT(DISTINCT mc.name) as category_names,
        GROUP_CONCAT(DISTINCT mt.name) as type_names,
        GROUP_CONCAT(DISTINCT mpt.name) as proxy_type_names,
        GROUP_CONCAT(DISTINCT t.name) as tag_names
      FROM minis m
      LEFT JOIN painted_by pb ON m.painted_by_id = pb.id
      LEFT JOIN base_sizes bs ON m.base_size_id = bs.id
      LEFT JOIN product_sets ps ON m.product_set_id = ps.id
      LEFT JOIN product_lines pl ON ps.product_line_id = pl.id
      LEFT JOIN production_companies pc ON pl.company_id = pc.id
      LEFT JOIN mini_to_categories mtc ON m.id = mtc.mini_id
      LEFT JOIN mini_categories mc ON mtc.category_id = mc.id
      LEFT JOIN mini_to_types mtt ON m.id = mtt.mini_id
      LEFT JOIN mini_types mt ON mtt.type_id = mt.id
      LEFT JOIN mini_to_proxy_types mtpt ON m.id = mtpt.mini_id
      LEFT JOIN mini_types mpt ON mtpt.type_id = mpt.id
      LEFT JOIN mini_to_tags mttg ON m.id = mttg.mini_id
      LEFT JOIN tags t ON mttg.tag_id = t.id
      WHERE m.id = ?
      GROUP BY m.id
    `, miniId)

    // Add image paths
    const x = miniId.toString()[0]
    const y = miniId.toString().length > 1 ? miniId.toString()[1] : '0'
    const miniWithImages = {
      ...newMini,
      image_path: `/images/minis/${x}/${y}/${miniId}.webp`,
      original_image_path: `/images/minis/originals/${x}/${y}/${miniId}.webp`
    }

    res.status(201).json(miniWithImages)

  } catch (error) {
    await req.db.run('ROLLBACK')
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    await req.db.run('BEGIN TRANSACTION')

    const miniId = req.params.id
    const {
      name, description, location,
      quantity, categories, types, proxy_types, 
      tags, painted_by_id, base_size_id, product_set_id
    } = req.body

    // Update the main mini record
    await req.db.run(
      `UPDATE minis SET
        name = ?, description = ?, location = ?, 
        quantity = ?, painted_by_id = ?, base_size_id = ?,
        product_set_id = ?, updated_at = datetime('now')
      WHERE id = ?`,
      [
        name.trim(),
        description?.trim() || null,
        location.trim(),
        quantity || 1,
        painted_by_id || 1,
        base_size_id || 3,
        product_set_id || null,
        miniId
      ]
    )

    // Update categories
    await req.db.run('DELETE FROM mini_to_categories WHERE mini_id = ?', miniId)
    if (categories?.length > 0) {
      for (const categoryId of categories) {
        await req.db.run(
          'INSERT INTO mini_to_categories (mini_id, category_id) VALUES (?, ?)',
          [miniId, categoryId]
        )
      }
    }

    // Update types
    await req.db.run('DELETE FROM mini_to_types WHERE mini_id = ?', miniId)
    if (types?.length > 0) {
      for (const typeId of types) {
        await req.db.run(
          'INSERT INTO mini_to_types (mini_id, type_id) VALUES (?, ?)',
          [miniId, typeId]
        )
      }
    }

    // Update proxy types
    await req.db.run('DELETE FROM mini_to_proxy_types WHERE mini_id = ?', miniId)
    if (proxy_types?.length > 0) {
      for (const typeId of proxy_types) {
        await req.db.run(
          'INSERT INTO mini_to_proxy_types (mini_id, type_id) VALUES (?, ?)',
          [miniId, typeId]
        )
      }
    }

    // Update tags
    await req.db.run('DELETE FROM mini_to_tags WHERE mini_id = ?', miniId)
    if (tags?.length > 0) {
      for (const tagName of tags) {
        let tagResult = await req.db.get('SELECT id FROM tags WHERE name = ?', tagName)
        
        if (!tagResult) {
          const newTag = await req.db.run('INSERT INTO tags (name) VALUES (?)', tagName)
          tagResult = { id: newTag.lastID }
        }

        await req.db.run(
          'INSERT INTO mini_to_tags (mini_id, tag_id) VALUES (?, ?)',
          [miniId, tagResult.id]
        )
      }
    }

    await req.db.run('COMMIT')

    // Get the updated mini data
    const updatedMini = await req.db.get(`
      SELECT 
        m.*,
        pb.painted_by_name,
        bs.base_size_name,
        ps.name as product_set_name,
        pl.name as product_line_name,
        pc.name as manufacturer_name,
        GROUP_CONCAT(DISTINCT mc.name) as category_names,
        GROUP_CONCAT(DISTINCT mt.name) as type_names,
        GROUP_CONCAT(DISTINCT mpt.name) as proxy_type_names,
        GROUP_CONCAT(DISTINCT t.name) as tag_names
      FROM minis m
      LEFT JOIN painted_by pb ON m.painted_by_id = pb.id
      LEFT JOIN base_sizes bs ON m.base_size_id = bs.id
      LEFT JOIN product_sets ps ON m.product_set_id = ps.id
      LEFT JOIN product_lines pl ON ps.product_line_id = pl.id
      LEFT JOIN production_companies pc ON pl.company_id = pc.id
      LEFT JOIN mini_to_categories mtc ON m.id = mtc.mini_id
      LEFT JOIN mini_categories mc ON mtc.category_id = mc.id
      LEFT JOIN mini_to_types mtt ON m.id = mtt.mini_id
      LEFT JOIN mini_types mt ON mtt.type_id = mt.id
      LEFT JOIN mini_to_proxy_types mtpt ON m.id = mtpt.mini_id
      LEFT JOIN mini_types mpt ON mtpt.type_id = mpt.id
      LEFT JOIN mini_to_tags mttg ON m.id = mttg.mini_id
      LEFT JOIN tags t ON mttg.tag_id = t.id
      WHERE m.id = ?
      GROUP BY m.id
    `, miniId)

    res.json(updatedMini)
  } catch (error) {
    await req.db.run('ROLLBACK')
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await req.db.run('BEGIN TRANSACTION')

    // Delete all relationships
    await req.db.run('DELETE FROM mini_to_tags WHERE mini_id = ?', req.params.id)
    await req.db.run('DELETE FROM mini_to_categories WHERE mini_id = ?', req.params.id)
    await req.db.run('DELETE FROM mini_to_types WHERE mini_id = ?', req.params.id)
    await req.db.run('DELETE FROM mini_to_proxy_types WHERE mini_id = ?', req.params.id)

    // Delete the mini itself
    await req.db.run('DELETE FROM minis WHERE id = ?', req.params.id)

    await req.db.run('COMMIT')
    res.status(204).send()
  } catch (error) {
    await req.db.run('ROLLBACK')
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id/relationships', async (req, res) => {
  try {
    const miniId = req.params.id
    
    const mini = await req.db.get(`
      SELECT 
        m.*,
        pb.id as painted_by_id,
        pb.painted_by_name,
        bs.base_size_name,
        ps.name as product_set_name,
        pl.name as product_line_name,
        pc.name as manufacturer_name,
        GROUP_CONCAT(DISTINCT mc.name) as category_names,
        GROUP_CONCAT(DISTINCT mc.id) as category_ids,
        GROUP_CONCAT(DISTINCT mt.name) as type_names,
        GROUP_CONCAT(DISTINCT mt.id) as type_ids,
        GROUP_CONCAT(DISTINCT mpt.name) as proxy_type_names,
        GROUP_CONCAT(DISTINCT mpt.id) as proxy_type_ids,
        GROUP_CONCAT(DISTINCT t.name) as tag_names,
        GROUP_CONCAT(DISTINCT t.id) as tag_ids,
        GROUP_CONCAT(DISTINCT ps.id) as product_set_ids
      FROM minis m
      LEFT JOIN painted_by pb ON m.painted_by_id = pb.id
      LEFT JOIN base_sizes bs ON m.base_size_id = bs.id
      LEFT JOIN product_sets ps ON m.product_set_id = ps.id
      LEFT JOIN product_lines pl ON ps.product_line_id = pl.id
      LEFT JOIN production_companies pc ON pl.company_id = pc.id
      LEFT JOIN mini_to_categories mtc ON m.id = mtc.mini_id
      LEFT JOIN mini_categories mc ON mtc.category_id = mc.id
      LEFT JOIN mini_to_types mtt ON m.id = mtt.mini_id
      LEFT JOIN mini_types mt ON mtt.type_id = mt.id
      LEFT JOIN mini_to_proxy_types mtpt ON m.id = mtpt.mini_id
      LEFT JOIN mini_types mpt ON mtpt.type_id = mpt.id
      LEFT JOIN mini_to_tags mttg ON m.id = mttg.mini_id
      LEFT JOIN tags t ON mttg.tag_id = t.id
      WHERE m.id = ?
      GROUP BY m.id
    `, miniId)
    
    if (!mini) {
      return res.status(404).json({ error: 'Mini not found' })
    }

    // Convert comma-separated IDs to arrays
    const processedMini = {
      ...mini,
      category_ids: mini.category_ids ? mini.category_ids.split(',') : [],
      type_ids: mini.type_ids ? mini.type_ids.split(',') : [],
      proxy_type_ids: mini.proxy_type_ids ? mini.proxy_type_ids.split(',') : [],
      tag_ids: mini.tag_ids ? mini.tag_ids.split(',') : [],
      product_set_ids: mini.product_set_ids ? mini.product_set_ids.split(',') : []
    }

    res.json(processedMini)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
