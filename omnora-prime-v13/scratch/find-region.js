const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

dns.resolve4('zgxmvwxzjmpmesqliwxl.supabase.co', (err, addresses) => {
  if (err) {
    console.error('DNS Resolution failed:', err);
  } else {
    console.log('Resolved IP addresses for Supabase project URL:', addresses);
  }
});
