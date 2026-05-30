import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'noxis-admin-2025';

function getWeekBucket(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export default async function AdminSignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedParams = await searchParams;
  const token = typeof resolvedParams.token === 'string' ? resolvedParams.token : undefined;

  if (token !== ADMIN_SECRET) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#EF4444' }}>
        Not found
      </div>
    );
  }

  const admin = createAdminClient();
  const weekBucket = getWeekBucket();

  // 1. Query this week's signals
  const { data: thisWeekSignals } = await admin
    .from('industry_signals')
    .select('*')
    .eq('week_bucket', weekBucket);

  // 2. Query all signals for historical aggregations
  const { data: allSignals = [] } = await admin
    .from('industry_signals')
    .select('*');

  const safeAllSignals = allSignals || [];

  // Aggregations
  const totalThisWeek = thisWeekSignals?.length || 0;

  // Breakdown by signal type
  const breakdown: Record<string, number> = {};
  safeAllSignals.forEach(s => {
    breakdown[s.signal_type] = (breakdown[s.signal_type] || 0) + 1;
  });

  // Unique reporting lists
  const industries = Array.from(new Set(safeAllSignals.map(s => s.industry).filter(Boolean)));
  const cities = Array.from(new Set(safeAllSignals.map(s => s.city).filter(Boolean)));

  // Average SKU prices by category
  const skuPrices: Record<string, { sum: number; count: number; unit: string }> = {};
  safeAllSignals
    .filter(s => s.signal_type === 'sku_price')
    .forEach(s => {
      const key = s.metric_name || 'general';
      if (!skuPrices[key]) {
        skuPrices[key] = { sum: 0, count: 0, unit: s.metric_unit || 'units' };
      }
      skuPrices[key].sum += Number(s.metric_value || 0);
      skuPrices[key].count += 1;
    });
  const avgSkuPrices = Object.entries(skuPrices).map(([name, data]) => ({
    name,
    avg_value: (data.sum / data.count).toFixed(2),
    unit: data.unit,
    count: data.count,
  }));

  // Average wage rates by industry
  const wages: Record<string, { sum: number; count: number }> = {};
  safeAllSignals
    .filter(s => s.signal_type === 'wage_rate')
    .forEach(s => {
      const key = s.industry || 'general';
      if (!wages[key]) {
        wages[key] = { sum: 0, count: 0 };
      }
      wages[key].sum += Number(s.metric_value || 0);
      wages[key].count += 1;
    });
  const avgWages = Object.entries(wages).map(([ind, data]) => ({
    industry: ind,
    avg_value: (data.sum / data.count).toFixed(2),
    count: data.count,
  }));

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#E2E8F0', backgroundColor: '#0F1113', minHeight: '100vh' }}>
      <h1 style={{ color: '#F1F5F9', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
        NOXIS INTEL LAYER — SIGNALS AUDIT PANEL
      </h1>

      <div style={{ margin: '2rem 0', display: 'flex', gap: '2rem' }}>
        <div style={{ border: '1px solid #334155', padding: '1rem', flex: 1 }}>
          <h3>WEEKLY THROTTLE</h3>
          <p style={{ fontSize: '2rem', margin: '0.5rem 0', color: '#60A5FA', fontWeight: 'bold' }}>
            {totalThisWeek}
          </p>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Signals collected in week bucket: {weekBucket}</span>
        </div>

        <div style={{ border: '1px solid #334155', padding: '1rem', flex: 1 }}>
          <h3>HISTORICAL CAPTURES</h3>
          <p style={{ fontSize: '2rem', margin: '0.5rem 0', color: '#34D399', fontWeight: 'bold' }}>
            {safeAllSignals.length}
          </p>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Total database signal entries</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', margin: '2rem 0' }}>
        <div style={{ border: '1px solid #334155', padding: '1rem' }}>
          <h3>SIGNAL TYPE BREAKDOWN</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #475569', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Type</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(breakdown).map(([type, count]) => (
                <tr key={type} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '0.5rem' }}>{type}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ border: '1px solid #334155', padding: '1rem' }}>
          <h3>REPORTING DEMOGRAPHICS</h3>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>INDUSTRIES ACTIVE:</strong> {industries.length}</p>
            <div style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {industries.join(', ') || 'None'}
            </div>
            
            <p><strong>CITIES REPORTING:</strong> {cities.length}</p>
            <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
              {cities.join(', ') || 'None'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid #334155', padding: '1rem', margin: '2rem 0' }}>
        <h3>AVERAGE SKU PRICE RATES BY CATEGORY</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #475569', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>Category Reference</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Average Price</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Reporting Count</th>
            </tr>
          </thead>
          <tbody>
            {avgSkuPrices.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#64748B' }}>No SKU price signals logged yet</td>
              </tr>
            ) : (
              avgSkuPrices.map(item => (
                <tr key={item.name} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '0.5rem' }}>{item.name}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', color: '#FCD34D' }}>{item.avg_value} {item.unit}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ border: '1px solid #334155', padding: '1rem', margin: '2rem 0' }}>
        <h3>AVERAGE WAGE RATES BY INDUSTRY</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #475569', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>Industry Vertical</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Average Wage Rate</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Artisans Count</th>
            </tr>
          </thead>
          <tbody>
            {avgWages.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#64748B' }}>No wage rates logged yet</td>
              </tr>
            ) : (
              avgWages.map(item => (
                <tr key={item.industry} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '0.5rem' }}>{item.industry}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', color: '#FCD34D' }}>PKR {item.avg_value}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
