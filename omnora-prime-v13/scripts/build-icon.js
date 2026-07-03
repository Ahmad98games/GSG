const pngToIco = require('png-to-ico').default
const fs = require('fs')
const path = require('path')

async function buildIcon() {
  const sourcePng = path.join(
    __dirname, '../public/logos/icons/1024x1024.png'
  )

  if (!fs.existsSync(sourcePng)) {
    console.error('Source PNG not found at', sourcePng)
    console.log('Available logo files in public/logos/icons:')
    const dir = path.join(__dirname, '../public/logos/icons')
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(f =>
        console.log(' -', f, '(' + Math.round(fs.statSync(path.join(dir, f)).size / 1024) + 'KB)')
      )
    }
    process.exit(1)
  }

  console.log('Generating multi-resolution icon.ico from', sourcePng)
  const buf = await pngToIco(sourcePng)
  
  const buildDir = path.join(__dirname, '../build')
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir)
  }
  
  fs.writeFileSync(
    path.join(buildDir, 'icon.ico'),
    buf
  )
  console.log('icon.ico generated:', Math.round(buf.length / 1024) + 'KB')
}

buildIcon().catch(console.error)
