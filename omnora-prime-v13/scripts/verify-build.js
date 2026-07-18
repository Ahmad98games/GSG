const fs = require('fs')
const path = require('path')

const REQUIRED_FILES = [
  '.next/standalone/server.js',
  '.next/standalone/server-with-bridge.js',
  '.next/standalone/package.json',
  '.next/standalone/node_modules/next/headers.js',
  '.next/standalone/.next/static',
  'server-with-bridge.js',
  'build/icon.ico',
]

const REQUIRED_DIRS = [
  '.next/standalone',
  '.next/standalone/node_modules',
  '.next/static',
]

// Only check win-unpacked if we are verifying a finished package
const checkWinUnpacked = process.argv.includes('--package')
if (checkWinUnpacked) {
  REQUIRED_FILES.push('dist/win-unpacked/resources/standalone/server.js')
  REQUIRED_FILES.push('dist/win-unpacked/resources/standalone/node_modules/next/headers.js')
}

let allGood = true

console.log('=== Noxis Build Verification ===\n')

REQUIRED_FILES.forEach(file => {
  const exists = fs.existsSync(file)
  console.log(
    `${exists ? '✓' : '✗'} ${file}`
  )
  if (!exists) allGood = false
})

REQUIRED_DIRS.forEach(dir => {
  const exists = fs.existsSync(dir)
  const count = exists
    ? fs.readdirSync(dir).length : 0
  console.log(
    `${exists ? '✓' : '✗'} ${dir} (${count} items)`
  )
  if (!exists) allGood = false
})

// Check SQLite binding
const sqliteBindings = [
  'node_modules/better-sqlite3-multiple-ciphers/prebuilds/win32-x64/node.napi.node',
  'node_modules/better-sqlite3-multiple-ciphers/build/Release/better_sqlite3.node',
]

const sqliteFound = sqliteBindings
  .some(f => fs.existsSync(f))

console.log(
  `${sqliteFound ? '✓' : '✗'} SQLite native binding`
)
if (!sqliteFound) allGood = false

// Check .env.local
const envExists = fs.existsSync('.env.local')
console.log(
  `${envExists ? '✓' : '✗'} .env.local`
)
if (!envExists) allGood = false

console.log('\n' +
  (allGood
    ? '✓ Build verified'
    : '✗ MISSING FILES — fix build issues'
  )
)

process.exit(allGood ? 0 : 1)
