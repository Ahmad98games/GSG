import { PersonaEngine } from './src/lib/persona/PersonaEngine';
import { Decimal } from 'decimal.js';

async function test() {
  console.log("=== NOXIS CROSS-SYSTEM CHECK CS-2 (HUB) ===");
  
  // Mock persona for the test
  // We'll manually set the terminology since we can't easily mock Supabase here
  (PersonaEngine as any).persona = {
    region: 'south_asian',
    currency: 'PKR',
    currencySymbol: 'Rs.',
    terminology: {
      'branches.count': 'Active Branches: {count}/{max}'
    },
    dateFormat: 'DD/MM/YYYY'
  };

  // 1. t('branches.count', { count: 28, max: 35 })
  const t1 = PersonaEngine.t('branches.count', { count: 28, max: 35 });
  console.log("1. t('branches.count', { 28, 35 }):", t1);

  // 2. fmt(125000, 'PKR', 'SA')
  const f2 = PersonaEngine.formatCurrency(new Decimal('125000'));
  console.log("2. fmt(125000, PKR, SA):", f2);

  // 3. fmt(125000, 'USD', 'INT')
  // Switch persona to Intl
  (PersonaEngine as any).persona = {
    region: 'international',
    currency: 'USD',
    currencySymbol: '$',
    terminology: {},
    dateFormat: 'MM/DD/YYYY'
  };
  const f3 = PersonaEngine.formatCurrency(new Decimal('125000'));
  console.log("3. fmt(125000, USD, INT):", f3); // Note: symbal might be $ if currencySymbol is $
}

test();

