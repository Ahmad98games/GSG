import { createClient }
  from '@/lib/supabase/client'

export async function generatePredictions(
  businessId: string
): Promise<void> {
  const supabase = createClient()
  
  // Delete expired predictions first
  await supabase
    .from('predictions')
    .delete()
    .eq('business_id', businessId)
    .lt('expires_at', new Date().toISOString())
  
  const predictions = []
  
  // ─────────────────────────────────────
  // PREDICTION 1: Stock-out risk (JS Filtered)
  // ─────────────────────────────────────
  const { data: allSkus } = await supabase
    .from('skus')
    .select('id, name, qty_on_hand, reorder_level, unit')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .gt('reorder_level', 0)
    .limit(100)
  
  const lowStockSkus = (allSkus || []).filter((sku: any) => 
    Number(sku.qty_on_hand) <= Number(sku.reorder_level) * 1.5
  ).slice(0, 10)
  
  for (const sku of lowStockSkus) {
    const daysUntilOut = sku.reorder_level > 0
      ? Math.floor(
          (Number(sku.qty_on_hand) / Number(sku.reorder_level)) * 14
        )
      : 30
    
    predictions.push({
      business_id: businessId,
      prediction_type: 'stockout_risk',
      entity_type: 'sku',
      entity_id: sku.id,
      entity_name: sku.name,
      title: `${sku.name} may run out in ${daysUntilOut} days`,
      description: `Current stock: ${sku.qty_on_hand} ${sku.unit}. At current usage rate, this will last approximately ${daysUntilOut} days.`,
      confidence: 0.75,
      recommended_action: `Reorder ${sku.name} now to avoid production delays.`,
      action_route: '/purchase/new',
      action_label: 'Create purchase order',
      urgency: daysUntilOut <= 7
        ? 'critical'
        : daysUntilOut <= 14
        ? 'high'
        : 'medium',
      status: 'active',
      expires_at: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
  }
  
  // ─────────────────────────────────────
  // PREDICTION 2: Customer churn risk
  // ─────────────────────────────────────
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString()
  
  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  ).toISOString()
  
  const { data: churnRisk } = await supabase
    .rpc('get_churn_risk_customers', {
      p_business_id: businessId,
      p_recent_cutoff: thirtyDaysAgo,
      p_historical_cutoff: ninetyDaysAgo,
    })
  
  for (const customer of (churnRisk || []).slice(0, 3)) {
    predictions.push({
      business_id: businessId,
      prediction_type: 'customer_churn',
      entity_type: 'party',
      entity_id: customer.party_id,
      entity_name: customer.party_name,
      title: `${customer.party_name} hasn't ordered in ${customer.days_since_last_order} days`,
      description: `This customer ordered ${customer.prev_order_count} times before but has gone silent. They may have switched suppliers.`,
      confidence: 0.7,
      recommended_action: `Send a WhatsApp message to ${customer.party_name} today.`,
      action_route: `/parties/${customer.party_id}`,
      action_label: 'Send WhatsApp',
      urgency: customer.days_since_last_order > 60
        ? 'high' : 'medium',
      status: 'active',
      expires_at: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
  }
  
  // ─────────────────────────────────────
  // PREDICTION 3: Margin alert
  // ─────────────────────────────────────
  const { data: marginDataList } = await supabase
    .rpc('get_margin_trend', {
      p_business_id: businessId,
      p_months: 3,
    })
  
  const marginData = marginDataList && marginDataList[0]
  
  if (marginData && marginData.trend === 'declining' && Number(marginData.change_pct) < -10) {
    predictions.push({
      business_id: businessId,
      prediction_type: 'margin_alert',
      entity_type: 'business',
      entity_id: businessId,
      entity_name: 'Your business',
      title: `Profit margins dropped ${Math.abs(Number(marginData.change_pct)).toFixed(0)}% in 3 months`,
      description: `Your margins were ${Number(marginData.prev_margin).toFixed(1)}% three months ago and are now ${Number(marginData.current_margin).toFixed(1)}%. Costs are rising faster than your prices.`,
      confidence: 0.85,
      recommended_action: 'Review your sale prices — they may need adjustment.',
      action_route: '/reports',
      action_label: 'View P&L report',
      urgency: 'high',
      status: 'active',
      expires_at: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
  }
  
  // Save all predictions
  if (predictions.length > 0) {
    await supabase
      .from('predictions')
      .upsert(predictions, {
        onConflict: 'business_id,prediction_type,entity_id',
        ignoreDuplicates: false,
      })
  }
}
