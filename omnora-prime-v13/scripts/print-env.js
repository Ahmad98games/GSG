import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0)
console.log('KEY starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 15) : 'undefined')
