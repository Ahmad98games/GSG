const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

function generateKey(tier) {
  const prefix = tier.toUpperCase().slice(0, 4);
  const random = crypto.randomBytes(6).toString('hex').toUpperCase();
  const parts = random.match(/.{1,4}/g) || [];
  return `${prefix}-${parts.join('-')}`;
}

const key = generateKey('ELITE');

console.log('='.repeat(50));
console.log('NOXIS HUB — ELITE LICENSE KEY GENERATED');
console.log('='.repeat(50));
console.log('License Key:   ', key);
console.log('Tier:          ', 'ELITE (Unrestricted)');
console.log('Max Devices:   ', 50);
console.log('Customer Email:', 'pakahmad9815@gmail.com');
console.log('Password:      ', '98158302384');
console.log('Use Case:      ', 'Wholesale & Multi-Branch Distribution');
console.log('Valid Until:   ', 'Lifetime / Permanent');
console.log('='.repeat(50));
