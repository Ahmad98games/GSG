const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: dOrders, error: dError } = await supabase.from('dispatch_orders').select('*').limit(1);
  console.log('dispatch_orders exists check:', { hasError: !!dError, errorMessage: dError?.message });

  const { data: kLogs, error: kError } = await supabase.from('karigar_production_logs').select('*').limit(1);
  console.log('karigar_production_logs exists check:', { hasError: !!kError, errorMessage: kError?.message });
}

check();
