const dns = require('dns');

dns.resolve('db.zgxmvwxzjmpmesqliwxl.supabase.co', (err, addresses) => {
  console.log('Direct DB resolve:', { err, addresses });
});

dns.lookup('db.zgxmvwxzjmpmesqliwxl.supabase.co', (err, address, family) => {
  console.log('Direct DB lookup:', { err, address, family });
});
