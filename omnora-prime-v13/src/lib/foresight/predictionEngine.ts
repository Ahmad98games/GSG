import { createClient } from '@/lib/supabase/client'

export interface ForesightPrediction {
  id: string
  type: string
  title: string
  detail: string
  predictedDate: string | null
  confidence: number
  impact: 'critical' | 'high' | 'medium' | 'low'
  entityLabel: string
  draftAction: {
    label: string
    route: string
    prefill?: Record<string, any>
  } | null
  supportingData: Record<string, any>
}

export async function generatePredictions(
  businessId: string
): Promise<ForesightPrediction[]> {
  const supabase = createClient()
  const predictions: ForesightPrediction[] = []
  const now = new Date()

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ]

  // Load stored patterns
  const { data: patterns } = await supabase
    .from('business_patterns')
    .select('*')
    .eq('business_id', businessId)

  if (!patterns) return []

  // Load current state for context
  const { data: activeInvoices } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, party_id,
      total_amount, balance_due,
      created_at, due_date,
      party:parties(name, phone)
    `)
    .eq('business_id', businessId)
    .eq('status', 'posted')
    .gt('balance_due', 0)

  for (const pattern of patterns) {
    const data = pattern.pattern_data

    switch (pattern.pattern_type) {

      // ── PREDICTION: Slow payer about to miss their due date ──
      case 'customer_payment_cycle': {
        if (data.avgPaymentDays > 0 && pattern.confidence_score >= 0.4) {
          // Find active invoices from this customer
          const custInvoices = (activeInvoices || [])
            .filter((inv: any) => inv.party_id === pattern.entity_id)

          for (const inv of custInvoices) {
            const party = inv.party as any
            const invoiceAge = Math.round(
              (now.getTime() - new Date(inv.created_at).getTime()) / 86400000
            )

            const expectedPaymentDate = new Date(
              new Date(inv.created_at).getTime() + data.avgPaymentDays * 86400000
            )

            const daysUntilExpectedPayment = Math.round(
              (expectedPaymentDate.getTime() - now.getTime()) / 86400000
            )

            // Predict if this payment will be late
            if (daysUntilExpectedPayment <= 5 &&
              daysUntilExpectedPayment >= -7 &&
              (inv.balance_due || 0) > 0) {

              const isOverdue = daysUntilExpectedPayment < 0

              predictions.push({
                id: `payment_${inv.id}`,
                type: 'payment_prediction',
                title: isOverdue
                  ? `${party?.name || 'Customer'} payment is ${Math.abs(daysUntilExpectedPayment)} days past their usual pattern`
                  : `${party?.name || 'Customer'} should pay within ${daysUntilExpectedPayment} days`,
                detail: isOverdue
                  ? `Based on ${pattern.data_points_used} past invoices, ${party?.name || 'Customer'} typically pays in ${data.avgPaymentDays} days. Invoice ${inv.invoice_number} is ${Math.abs(daysUntilExpectedPayment)} days past that. ${data.trend === 'getting_slower' ? 'Their payment speed has been declining recently.' : ''} Balance due: PKR ${inv.balance_due?.toLocaleString('en-PK') || 0}.`
                  : `${party?.name || 'Customer'} has paid ${data.avgPaymentDays} days after invoice on average (${pattern.data_points_used} invoices analyzed). Invoice ${inv.invoice_number} is ${invoiceAge} days old. Expect payment around ${expectedPaymentDate.toLocaleDateString('en-PK')}.`,
                predictedDate: expectedPaymentDate.toISOString().split('T')[0],
                confidence: pattern.confidence_score,
                impact: isOverdue ? 'high' : 'medium',
                entityLabel: party?.name || pattern.entity_label,
                draftAction: isOverdue
                  ? {
                    label: 'Send WhatsApp Reminder',
                    route: `/parties/reminders`,
                    prefill: {
                      partyId: pattern.entity_id,
                    },
                  }
                  : null,
                supportingData: {
                  avgPaymentDays: data.avgPaymentDays,
                  invoiceNumber: inv.invoice_number,
                  balanceDue: inv.balance_due,
                  trend: data.trend,
                },
              })
            }

            // Special warning: seasonal slow month approaching
            if (data.slowPaymentMonths?.includes(now.getMonth() + 1) && (inv.balance_due || 0) > 0) {
              predictions.push({
                id: `seasonal_${inv.id}`,
                type: 'seasonal_payment_warning',
                title: `${party?.name || 'Customer'} historically pays slowly in ${MONTH_NAMES[now.getMonth()]}`,
                detail: `Based on past data, ${party?.name || 'Customer'} takes ${data.avgPaymentDays} days to pay normally, but in ${MONTH_NAMES[now.getMonth()]} their payments slow down. Invoice ${inv.invoice_number} has PKR ${inv.balance_due?.toLocaleString('en-PK') || 0} outstanding. Consider sending an early reminder.`,
                predictedDate: null,
                confidence: pattern.confidence_score * 0.7,
                impact: 'medium',
                entityLabel: party?.name || pattern.entity_label,
                draftAction: {
                  label: 'Send Early Reminder',
                  route: `/parties/reminders`,
                  prefill: { partyId: pattern.entity_id },
                },
                supportingData: {
                  slowMonths: data.slowPaymentMonths,
                  currentMonth: now.getMonth(),
                },
              })
            }
          }
        }
        break
      }

      // ── PREDICTION: Stock runout ──
      case 'stock_consumption_rate': {
        if (data.daysUntilStockout <= 14 && data.daysUntilStockout >= 0) {
          // Find how long the best supplier takes
          const supplierPattern = patterns.find(
            (p: any) => p.pattern_type === 'supplier_lead_time'
          )
          const leadTime = supplierPattern?.pattern_data?.safeLeadTimeDays || 7

          const orderNow = data.daysUntilStockout <= leadTime
          const daysLate = orderNow ? leadTime - data.daysUntilStockout : 0

          predictions.push({
            id: `stock_${pattern.entity_id}`,
            type: 'stock_runout_prediction',
            title: orderNow
              ? `⚠️ Order ${pattern.entity_label} NOW — you are ${daysLate} day${daysLate > 1 ? 's' : ''} behind`
              : `${pattern.entity_label} will run out in ${data.daysUntilStockout} days`,
            detail: orderNow
              ? `At current usage (${data.estimatedDailyUsage} ${data.unit}/day), you will run out of ${pattern.entity_label} in ${data.daysUntilStockout} days. Your supplier typically takes ${leadTime} days to deliver. You needed to order ${daysLate} day${daysLate > 1 ? 's' : ''} ago. Create a purchase order immediately.`
              : `At current usage of ${data.estimatedDailyUsage} ${data.unit} per day, you have ${data.daysUntilStockout} days of stock left. ${supplierPattern ? `Your supplier (${supplierPattern.entity_label}) takes ${leadTime} days. Order in ${data.daysUntilStockout - leadTime} days to avoid a stockout.` : `Order before ${new Date(now.getTime() + (data.daysUntilStockout - 5) * 86400000).toLocaleDateString('en-PK')} to be safe.`}`,
            predictedDate: new Date(
              now.getTime() + data.daysUntilStockout * 86400000
            ).toISOString().split('T')[0],
            confidence: pattern.confidence_score,
            impact: orderNow
              ? 'critical'
              : data.daysUntilStockout <= 5
              ? 'high'
              : 'medium',
            entityLabel: pattern.entity_label,
            draftAction: {
              label: 'Create Purchase Order',
              route: '/purchase/manual', // Use manual PO draft route
              prefill: {
                sku_id: pattern.entity_id,
                suggested_qty: (data.reorderLevel * 2) - data.currentQty,
              },
            },
            supportingData: {
              currentQty: data.currentQty,
              dailyUsage: data.estimatedDailyUsage,
              daysLeft: data.daysUntilStockout,
              supplierLeadTime: leadTime,
            },
          })
        }
        break
      }

      // ── PREDICTION: Karigar performance issue ──
      case 'karigar_performance': {
        if (data.trend === 'declining' &&
          data.totalLogsAnalyzed >= 5 &&
          pattern.confidence_score >= 0.5) {
          predictions.push({
            id: `karigar_${pattern.entity_id}`,
            type: 'worker_performance_alert',
            title: `${pattern.entity_label}'s output is declining`,
            detail: `Over the last ${data.totalLogsAnalyzed} production logs, ${pattern.entity_label}'s average output is decreasing. ${data.rejectionRate > 10 ? `Rejection rate is also elevated at ${data.rejectionRate}%. ` : ''}This may indicate fatigue, equipment issues, or motivation concerns. Consider a check-in.`,
            predictedDate: null,
            confidence: pattern.confidence_score,
            impact: data.rejectionRate > 20 ? 'high' : 'medium',
            entityLabel: pattern.entity_label,
            draftAction: {
              label: 'View Performance',
              route: `/karigars/${pattern.entity_id}`,
            },
            supportingData: {
              avgUnits: data.avgUnitsPerDay,
              trend: data.trend,
              rejectionRate: data.rejectionRate,
            },
          })
        }

        // Best day assignment recommendation
        if (data.bestDayOfWeek && pattern.confidence_score >= 0.6) {
          const dayNames = [
            'Sunday', 'Monday', 'Tuesday',
            'Wednesday', 'Thursday',
            'Friday', 'Saturday',
          ]
          predictions.push({
            id: `karigar_schedule_${pattern.entity_id}`,
            type: 'scheduling_recommendation',
            title: `Schedule ${pattern.entity_label}'s complex work on ${dayNames[data.bestDayOfWeek]}`,
            detail: `Based on ${data.totalLogsAnalyzed} production logs, ${pattern.entity_label} produces the most units on ${dayNames[data.bestDayOfWeek]}. Scheduling high-priority or complex work on this day will improve output quality and quantity.`,
            predictedDate: null,
            confidence: pattern.confidence_score,
            impact: 'low',
            entityLabel: pattern.entity_label,
            draftAction: null,
            supportingData: {
              bestDay: dayNames[data.bestDayOfWeek],
              worstDay: dayNames[data.worstDayOfWeek || 0],
            },
          })
        }
        break
      }

      // ── PREDICTION: Revenue seasonality ──
      case 'revenue_seasonality': {
        const nextMonth = (now.getMonth() + 1) % 12

        if (data.weakMonths?.includes(nextMonth) && pattern.confidence_score >= 0.5) {
          predictions.push({
            id: `seasonal_revenue_${nextMonth}`,
            type: 'seasonal_revenue_warning',
            title: `${MONTH_NAMES[nextMonth]} is historically your weakest sales month`,
            detail: `Based on ${data.dataPointsUsed || pattern.data_points_used} months of history, ${MONTH_NAMES[nextMonth]} consistently shows below-average revenue. Plan your cash flow accordingly — defer non-essential purchases and consider building receivables buffer now.`,
            predictedDate: new Date(
              now.getFullYear(),
              nextMonth, 1
            ).toISOString().split('T')[0],
            confidence: pattern.confidence_score,
            impact: 'medium',
            entityLabel: 'Revenue Forecast',
            draftAction: {
              label: 'View Cash Flow',
              route: '/reports',
            },
            supportingData: {
              weakMonths: data.weakMonths,
              strongMonths: data.strongMonths,
            },
          })
        }

        if (data.strongMonths?.includes(nextMonth) && pattern.confidence_score >= 0.5) {
          predictions.push({
            id: `seasonal_strong_${nextMonth}`,
            type: 'seasonal_opportunity',
            title: `${MONTH_NAMES[nextMonth]} is your strongest sales month — prepare now`,
            detail: `${MONTH_NAMES[nextMonth]} has historically been above-average for your business. Ensure stock levels are high, karigars are fully staffed, and any pending purchase orders are placed now so material arrives in time.`,
            predictedDate: new Date(
              now.getFullYear(),
              nextMonth, 1
            ).toISOString().split('T')[0],
            confidence: pattern.confidence_score,
            impact: 'high',
            entityLabel: 'Revenue Opportunity',
            draftAction: {
              label: 'Check Stock Levels',
              route: '/inventory',
            },
            supportingData: {
              strongMonths: data.strongMonths,
            },
          })
        }
        break
      }
    }
  }

  // Save predictions to database
  const supabaseClient = createClient()
  if (predictions.length > 0) {
    await supabaseClient
      .from('foresight_predictions')
      .delete()
      .eq('business_id', businessId)
      .eq('status', 'active')
      .lt('expires_at', now.toISOString())

    await supabaseClient
      .from('foresight_predictions')
      .upsert(
        predictions.map(p => ({
          id: p.id,
          business_id: businessId,
          prediction_type: p.type,
          title: p.title,
          detail: p.detail,
          predicted_date: p.predictedDate,
          confidence: p.confidence,
          impact: p.impact,
          entity_label: p.entityLabel,
          supporting_data: p.supportingData,
          draft_action: p.draftAction,
          status: 'active',
          expires_at: new Date(now.getTime() + 7 * 86400000).toISOString(),
        })),
        { onConflict: 'id' }
      )
  }

  return predictions
}
