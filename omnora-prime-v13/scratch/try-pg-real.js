const { Client } = require('pg')

const host = 'db.zgxmvwxzjmpmesqliwxl.supabase.co'
const passwords = [
  'noxis2026',
  'noxis_secure_sentinel_bridge_2026',
  'postgres',
  'admin'
]

async function tryConnect() {
  for (const pw of passwords) {
    const client = new Client({
      host,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: pw
    })
    try {
      console.log(`Trying password: ${pw}...`)
      await client.connect()
      console.log(`Success! Password is: ${pw}`)
      await client.end()
      break
    } catch (e) {
      console.error(`Failed for ${pw}:`, e.message)
    }
  }
}

tryConnect()
