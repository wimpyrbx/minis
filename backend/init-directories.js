const fs = require('fs').promises
const path = require('path')

async function initDirectories() {
  const baseDir = path.join(__dirname, '..', 'public', 'images', 'minis')
  const originalBaseDir = path.join(baseDir, 'originals')
  const thumbBaseDir = baseDir
  
  // Create base directories
  await fs.mkdir(originalBaseDir, { recursive: true })
  await fs.mkdir(thumbBaseDir, { recursive: true })
  
  // Create first level directories (0-9)
  for (let i = 0; i < 10; i++) {
    const originalDir1 = path.join(originalBaseDir, i.toString())
    const thumbDir1 = path.join(thumbBaseDir, i.toString())
    await fs.mkdir(originalDir1, { recursive: true })
    await fs.mkdir(thumbDir1, { recursive: true })
    
    // Create second level directories (0-9)
    for (let j = 0; j < 10; j++) {
      const originalDir2 = path.join(originalDir1, j.toString())
      const thumbDir2 = path.join(thumbDir1, j.toString())
      await fs.mkdir(originalDir2, { recursive: true })
      await fs.mkdir(thumbDir2, { recursive: true })
    }
  }
}

initDirectories().catch(console.error) 