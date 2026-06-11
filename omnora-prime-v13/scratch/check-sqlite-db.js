const Database = require('better-sqlite3')
const db = new Database('./NOXIS-local.db')

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
  console.log('Tables in local SQLite:', tables)
  for (const t of tables) {
    const info = db.prepare(`PRAGMA table_info(${t.name})`).all()
    console.log(`Table ${t.name} columns:`, info.map(i => i.name))
  }
} catch (e) {
  console.error(e)
} finally {
  db.close()
}
