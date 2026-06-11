const { Client } = require('pg')

const connectionString = 'postgresql://postgres:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres'
const passwords = [
  'noxis2026',
  'REDACTED_SERVICE_ROLE_KEY',
  'postgres',
  'admin'
]

async function tryConnect() {
  for (const pw of passwords) {
    const connStr = connectionString.replace('[PASSWORD]', pw)
    const client = new Client({ connectionString: connStr })
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
