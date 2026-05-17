// scratch/seed_personas.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PERSONAS = [
  {
    industry_key: 'textile_sa', region: 'south_asian', industry_type: 'textile',
    display_name_sa: 'Kapra — Textile', display_name_intl: 'Textile Manufacturing',
    worker_term_sa: 'Karigar', worker_term_intl: 'Operative',
    stock_primary_unit: 'meter', currency_hint: 'PKR', tax_label: 'GST', default_tax_rate: 17.00,
    dashboard_widgets: ['today_production','stock_value','outstanding_khata','karigar_count','low_stock','pending_transfers'],
    nav_items: ['dashboard','stock','khata','production','karigars','dispatch','reports','settings'],
    hidden_features: ['gdpr_export','edi_integration','upc_barcode'],
    terminology: { "worker": "Karigar", "ledger": "Khata" }
  },
  {
    industry_key: 'medical_sa', region: 'south_asian', industry_type: 'medical',
    display_name_sa: 'Medical — Dawa Pharma', display_name_intl: 'Pharmaceutical Distribution',
    worker_term_sa: 'Staff', worker_term_intl: 'Staff',
    stock_primary_unit: 'unit', currency_hint: 'PKR', tax_label: 'GST', default_tax_rate: 0.00,
    dashboard_widgets: ['expiry_alerts','stock_value','today_sales'],
    nav_items: ['dashboard','stock','khata','sales','expiry','reports','settings'],
    hidden_features: [],
    terminology: { "worker": "Staff", "ledger": "Khata" }
  },
  {
    industry_key: 'logistics_intl', region: 'international', industry_type: 'logistics',
    display_name_sa: '3PL Logistics', display_name_intl: '3PL Logistics Provider',
    worker_term_sa: 'Handler', worker_term_intl: 'Handler',
    stock_primary_unit: 'unit', currency_hint: 'USD', tax_label: 'VAT', default_tax_rate: 20.00,
    dashboard_widgets: ['shipments_today','sla_compliance'],
    nav_items: ['dashboard','inventory','ledger','shipments','workforce','fleet','analytics','settings'],
    hidden_features: [],
    terminology: { "worker": "Handler", "ledger": "Ledger" }
  }
];

async function seed() {
  console.log('Seeding industries...');
  const { error } = await supabase.from('industry_personas').upsert(PERSONAS, { onConflict: 'industry_key' });
  if (error) console.error('Seed Error:', error);
  else console.log('Seeding successful.');
}

seed();

