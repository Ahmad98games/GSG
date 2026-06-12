const { Resolver } = require('dns');
const resolver = new Resolver();
resolver.setServers(['8.8.8.8']);

console.log('Resolving db.zgxmvwxzjmpmesqliwxl.supabase.co via 8.8.8.8...');
resolver.resolve4('db.zgxmvwxzjmpmesqliwxl.supabase.co', (err, addresses) => {
  if (err) {
    console.error('Resolution failed:', err);
  } else {
    console.log('Addresses:', addresses);
  }
});
