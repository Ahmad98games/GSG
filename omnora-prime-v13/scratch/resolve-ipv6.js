const { Resolver } = require('dns');
const resolver = new Resolver();
resolver.setServers(['8.8.8.8']);

console.log('Resolving AAAA (IPv6) for db.zgxmvwxzjmpmesqliwxl.supabase.co...');
resolver.resolve6('db.zgxmvwxzjmpmesqliwxl.supabase.co', (err, addresses) => {
  if (err) {
    console.error('IPv6 Resolution failed:', err);
  } else {
    console.log('IPv6 Addresses:', addresses);
  }
});
