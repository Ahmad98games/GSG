import { createClient } from '@supabase/supabase-js'

async function checkSessions() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('portal_sessions')
    .select('*, portal:client_portals(display_name)')
    .limit(5)

  if (error) {
    console.error('Error fetching sessions:', error)
    return
  }

  console.log('Active Portal Sessions:')
  console.table(data)
}

checkSessions()
