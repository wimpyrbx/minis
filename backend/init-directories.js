const fs = require('fs').promises
const path = require('path')

async function initDirectories() {
  const baseDir = path.join(__dirname, '..', 'public', 'images', 'minis')
  const originalBaseDir = path.join(baseDir, 'originals')
  
  // Create base directories
  await fs.mkdir(baseDir, { recursive: true })
  await fs.mkdir(originalBaseDir, { recursive: true })
  
  // Create first level directories (0-9)
  for (let i = 0; i < 10; i++) {
    const dir1 = path.join(baseDir, i.toString())
    const originalDir1 = path.join(originalBaseDir, i.toString())
    await fs.mkdir(dir1, { recursive: true })
    await fs.mkdir(originalDir1, { recursive: true })
    
    // Create second level directories (0-9)
    for (let j = 0; j < 10; j++) {
      const dir2 = path.join(dir1, j.toString())
      const originalDir2 = path.join(originalDir1, j.toString())
      await fs.mkdir(dir2, { recursive: true })
      await fs.mkdir(originalDir2, { recursive: true })
    }
  }
}

initDirectories().catch(console.error) 