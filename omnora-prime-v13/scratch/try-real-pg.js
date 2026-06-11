const { Client } = require('pg')

const host = 'db.zgxmvwxzjmpmesqliwxl.supabase.co'
const passwords = [
  'noxis2026',
  'REDACTED_SERVICE_ROLE_KEY',
  'postgres',
  'admin'
]

async function tryConnect() {
  for (const pw of passwords) {
    const client = new Client({
      host,
      port: 5432,
      user: 'postgres',
      password: pw,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    })
    try {
      console.log(`Trying password on direct host: ${pw}...`)
      await client.connect()
      console.log(`Success on 5432! Password is: ${pw}`)
      await client.end()
      return
    } catch (e) {
      console.error(`Failed on 5432 for ${pw}:`, e.message)
    }

    // Try pooler port 6543
    const clientPool = new Client({
      host,
      port: 6543,
      user: 'postgres',
      password: pw,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    })
    try {
      console.log(`Trying password on pooler port 6543: ${pw}...`)
      await clientPool.connect()
      console.log(`Success on 6543! Password is: ${pw}`)
      await clientPool.end()
      return
    } catch (e) {
      console.error(`Failed on 6543 for ${pw}:`, e.message)
    }
  }
}

tryConnect()
