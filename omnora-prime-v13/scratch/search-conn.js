const fs = require('fs')
const path = require('path')

function searchDir(dir) {
  try {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const fullPath = path.join(dir, file)
      if (file === 'node_modules' || file === '.next' || file === '.git') continue
      try {
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          searchDir(fullPath)
        } else {
          try {
            const content = fs.readFileSync(fullPath, 'utf8')
            if (content.includes('pooler.supabase.com') || content.includes('postgres:') || content.includes('postgresql://')) {
              console.log(`Found in: ${fullPath}`)
              const lines = content.split('\n')
              lines.forEach((line, idx) => {
                if (line.includes('pooler.supabase.com') || line.includes('postgres:') || line.includes('postgresql://')) {
                  console.log(`  Line ${idx+1}: ${line.trim()}`)
                }
              })
            }
          } catch (e) {}
        }
      } catch (e) {}
    }
  } catch (e) {}
}

searchDir('c:\\Users\\omnora\\OneDrive\\Desktop\\new_system')
