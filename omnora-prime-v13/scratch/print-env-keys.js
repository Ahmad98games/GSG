const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

for (const [key, value] of Object.entries(process.env)) {
  if (key.includes('SUPABASE') || key.includes('DB') || key.includes('URL') || key.includes('DATABASE')) {
    let masked = value;
    if (value && value.includes('://')) {
      const parts = value.split('://');
      const authParts = parts[1].split('@');
      if (authParts.length > 1) {
        masked = `${parts[0]}://****:****@${authParts[1]}`;
      }
    }
    console.log(`${key}: ${masked}`);
  }
}
