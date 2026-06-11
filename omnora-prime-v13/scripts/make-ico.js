const pngToIco = require('png-to-ico').default || require('png-to-ico')
const fs = require('fs')
const path = require('path')

const pngPath = path.join(
  __dirname, '../public/logos/noxis.png'
)

pngToIco(pngPath)
  .then(buf => {
    const outPath = path.join(
      __dirname, '../build/icon.ico'
    )
    fs.mkdirSync(
      path.dirname(outPath),
      { recursive: true }
    )
    fs.writeFileSync(outPath, buf)
    console.log('Created: build/icon.ico')
  })
  .catch(err => {
    console.error('ICO creation failed:', err)
    // Fallback: copy PNG
    fs.copyFileSync(
      pngPath,
      path.join(__dirname, '../build/icon.png')
    )
    console.log('Fallback: PNG copied to build/')
  })
