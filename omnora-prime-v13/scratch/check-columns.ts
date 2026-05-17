import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function check() {
  console.log('Environment variable keys:')
  Object.keys(process.env).forEach(key => {
    // Obscure actual values for security, but print keys and length of value
    const val = process.env[key] || '';
    console.log(`- ${key}: length ${val.length}, starts with: ${val.substring(0, 10)}...`)
  })
}

check()
