import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { Decimal } from 'decimal.js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  console.log('🚀 Starting demo data seed...');

  // 1. Get existing business_id
  const { data: biz, error: bizError } = await supabase
    .from('business_profiles')
    .select('id')
    .limit(1)
    .single();

  if (bizError || !biz) {
    console.error('❌ Could not find a business profile. Please create one first.', bizError);
    process.exit(1);
  }

  const businessId = biz.id;
  console.log(`🏢 Seeding for Business ID: ${businessId}`);

  // 2. Seed SKUs
  const skus = [
    { sku_code: 'FAB-001', name: 'Khaddar Blue', unit: 'meter', qty_on_hand: 450, cost_price: '85.00', sale_price: '120.00', reorder_level: 100, category: 'Fabric', business_id: businessId },
    { sku_code: 'FAB-002', name: 'Lawn White', unit: 'meter', qty_on_hand: 280, cost_price: '95.00', sale_price: '140.00', reorder_level: 150, category: 'Fabric', business_id: businessId },
    { sku_code: 'THR-001', name: 'Thread Black 500m', unit: 'roll', qty_on_hand: 45, cost_price: '120.00', sale_price: '180.00', reorder_level: 20, category: 'Thread', business_id: businessId },
    { sku_code: 'BTN-001', name: 'Metal Button 12mm', unit: 'box', qty_on_hand: 120, cost_price: '250.00', sale_price: '350.00', reorder_level: 30, category: 'Accessories', business_id: businessId },
    { sku_code: 'ZIP-001', name: 'Nylon Zipper 8 inch', unit: 'piece', qty_on_hand: 500, cost_price: '15.00', sale_price: '25.00', reorder_level: 100, category: 'Accessories', business_id: businessId }
  ];

  const { data: seededSkus, error: skuError } = await supabase
    .from('skus')
    .upsert(skus, { onConflict: 'business_id, sku_code' })
    .select();

  if (skuError) console.error('❌ SKU Seed Error:', skuError);
  else console.log(`✅ Seeded ${seededSkus?.length || 0} SKUs`);

  // 3. Seed Parties
  const partiesData = [
    { name: 'Al-Hamid Textiles', party_type: 'customer', phone: '0300-1234567', current_balance: 45000, business_id: businessId },
    { name: 'Ahmed Fabric Mills', party_type: 'supplier', phone: '0321-9876543', current_balance: 0, business_id: businessId },
    { name: 'City Garments', party_type: 'customer', phone: '0333-4567890', current_balance: 12500, business_id: businessId }
  ];

  const seededParties = [];
  for (const party of partiesData) {
    const { data: existing } = await supabase
      .from('parties')
      .select('id')
      .eq('business_id', businessId)
      .eq('name', party.name)
      .single();

    if (existing) {
      const { data: updated } = await supabase
        .from('parties')
        .update(party)
        .eq('id', existing.id)
        .select()
        .single();
      if (updated) seededParties.push(updated);
    } else {
      const { data: inserted } = await supabase
        .from('parties')
        .insert(party)
        .select()
        .single();
      if (inserted) seededParties.push(inserted);
    }
  }
  console.log(`✅ Seeded ${seededParties.length} Parties`);

  // 4. Seed Karigars
  const karigarsData = [
    { 
      name: 'Muhammad Akram', 
      karigar_code: 'KAR-001', 
      wage_type: 'piece_rate', 
      piece_rate: 25, 
      status: 'active', 
      phone: '0311-1111111', 
      business_id: businessId,
      skill_type: 'Master',
      joining_date: '2024-01-01'
    },
    { 
      name: 'Razia Bibi', 
      karigar_code: 'KAR-002', 
      wage_type: 'daily_wage', 
      daily_rate: 900, 
      status: 'active', 
      business_id: businessId,
      skill_type: 'Stitching',
      joining_date: '2024-02-15'
    },
    { 
      name: 'Shahid Ali', 
      karigar_code: 'KAR-003', 
      wage_type: 'monthly_salary', 
      monthly_salary: 28000, 
      status: 'active', 
      business_id: businessId,
      skill_type: 'Cutting',
      joining_date: '2024-03-10'
    }
  ];

  const { data: seededKarigars, error: karigarError } = await supabase
    .from('karigars')
    .upsert(karigarsData, { onConflict: 'business_id, karigar_code' })
    .select();

  if (karigarError) console.error('❌ Karigar Seed Error:', karigarError);
  else console.log(`✅ Seeded ${seededKarigars?.length || 0} Karigars`);

  // 5. Seed Invoices
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];
  
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];

  const alHamid = seededParties.find(p => p.name === 'Al-Hamid Textiles');
  const cityGarments = seededParties.find(p => p.name === 'City Garments');

  if (alHamid && cityGarments) {
    const invoices = [
      { 
        business_id: businessId,
        invoice_no: 'INV-DEMO-001',
        party_id: alHamid.id,
        total: 45000,
        status: 'issued',
        issue_date: todayStr,
        due_date: thirtyDaysLaterStr,
        subtotal: 45000
      },
      { 
        business_id: businessId,
        invoice_no: 'INV-DEMO-002',
        party_id: cityGarments.id,
        total: 12500,
        paid_amount: 5000,
        status: 'partially_paid',
        issue_date: todayStr,
        due_date: fiveDaysAgoStr,
        subtotal: 12500
      }
    ];

    const { data: seededInvoices, error: invError } = await supabase
      .from('invoices')
      .upsert(invoices, { onConflict: 'business_id, invoice_no' })
      .select();

    if (invError) console.error('❌ Invoice Seed Error:', invError);
    else console.log(`✅ Seeded ${seededInvoices?.length || 0} Invoices`);
  }


  console.log('✨ Demo data seeding complete.');
}

seed().catch(console.error);
