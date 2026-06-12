const dns = require('dns');

dns.resolveCname('zgxmvwxzjmpmesqliwxl.supabase.co', (err, addresses) => {
  console.log('CNAME addresses:', { err, addresses });
});

dns.lookup('zgxmvwxzjmpmesqliwxl.supabase.co', (err, address, family) => {
  console.log('Lookup address:', { err, address, family });
});

dns.resolveMx('zgxmvwxzjmpmesqliwxl.supabase.co', (err, addresses) => {
  console.log('MX addresses:', { err, addresses });
});

dns.resolveTxt('zgxmvwxzjmpmesqliwxl.supabase.co', (err, addresses) => {
  console.log('TXT addresses:', { err, addresses });
});

dns.resolve('zgxmvwxzjmpmesqliwxl.supabase.co', 'ANY', (err, addresses) => {
  console.log('ANY addresses:', { err, addresses });
});
