import * as fs from 'fs'
import path from 'path'

/**
 * Migrates an unencrypted SQLite database to an encrypted one.
 * Uses SQLCipher's built-in sqlcipher_export feature.
 */
export async function migrateToEncrypted(
  oldPath: string,
  newPath: string,
  key: string
) {
  if (!fs.existsSync(oldPath)) {
    throw new Error(`Source database not found: ${oldPath}`)
  }

  // Dynamically load Database to prevent static package tracking in standalone builds
  const Database = require('better-sqlite3-multiple-ciphers')

  console.log(`[Migration] Migrating ${oldPath} to encrypted ${newPath}...`)

  try {
    // 1. Open old unencrypted DB
    const oldDb = new Database(oldPath, {
      nativeBinding: process.env.BETTER_SQLITE3_BINDING || undefined,
    })
    
    // 2. Create new directory if needed
    const newDir = path.dirname(newPath)
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true })
    }

    // 3. Attach the new (soon to be encrypted) database
    // We use ATTACH DATABASE to link the two
    oldDb.exec(`ATTACH DATABASE '${newPath}' AS encrypted KEY '${key}'`)
    
    // 4. Export all tables and data from the old DB to the new encrypted one
    console.log('[Migration] Exporting data to encrypted volume...')
    oldDb.exec(`SELECT sqlcipher_export('encrypted')`)
    
    // 5. Detach and close
    oldDb.exec(`DETACH DATABASE encrypted`)
    oldDb.close()

    console.log('[Migration] Migration successful ✓')
    
    // 6. Finalize: Backup old and move new to production if needed
    // (Note: renaming logic usually handled by the caller to ensure safety)
    
    return true
  } catch (err) {
    console.error('[Migration] Failed:', err)
    throw err
  }
}
