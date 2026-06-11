const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

console.log('Env Keys containing DB or PASSWORD or KEY:')
for (const key of Object.keys(process.env)) {
  if (key.includes('DB') || key.includes('PASSWORD') || key.includes('KEY') || key.includes('POSTGRES') || key.includes('DATABASE')) {
    console.log(`${key}: ${process.env[key] ? 'DEFINED (length ' + process.env[key].length + ')' : 'UNDEFINED'}`)
  }
}
