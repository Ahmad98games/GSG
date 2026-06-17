const fs = require('fs')
const path = require('path')

const deleteFolder = (dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
    console.log(`✓ Deleted: ${dir}`)
  }
}

const cleanFolder = (baseDir) => {
  if (!fs.existsSync(baseDir)) return
  fs.readdirSync(baseDir).forEach(file => {
    if (file.startsWith('better-sqlite3')) {
      deleteFolder(path.join(baseDir, file))
    }
  })
}

console.log('=== Cleaning Standalone SQLite Modules ===')
cleanFolder('.next/standalone/node_modules')
cleanFolder('.next/standalone/.next/node_modules')
console.log('=== Standalone SQLite Modules cleaned successfully ===')
