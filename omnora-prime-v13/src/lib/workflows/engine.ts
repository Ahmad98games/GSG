import { createClient } from '@/lib/supabase/client'
import { openWhatsApp, buildPaymentReminderMessage } from '@/lib/whatsapp/buildMessage'
import { notify } from '@/stores/notificationStore'

export interface WorkflowTriggerEvent {
  type: string
  data: Record<string, any>
  businessId: string
}

export async function evaluateWorkflows(
  event: WorkflowTriggerEvent
): Promise<void> {
  const supabase = createClient()

  // Fetch active workflows matching this trigger
  const { data: workflows } = await supabase
    .from('workflows')
    .select('*')
    .eq('business_id', event.businessId)
    .eq('is_active', true)
    .eq('trigger_type', event.type)

  if (!workflows?.length) return

  for (const workflow of workflows) {
    try {
      // Check conditions
      if (!evaluateCondition(
        workflow.condition_config,
        event.data
      )) continue

      // Execute all actions
      const actionsResult = []
      for (const action of (workflow.actions || [])) {
        const result = await executeAction(
          action,
          event.data,
          event.businessId
        )
        actionsResult.push(result)
      }

      // Log the run
      await supabase
        .from('workflow_runs')
        .insert({
          workflow_id: workflow.id,
          business_id: event.businessId,
          trigger_data: event.data,
          actions_executed: actionsResult,
          status: 'completed',
        })

      // Update trigger count
      await supabase
        .from('workflows')
        .update({
          last_triggered_at: new Date().toISOString(),
          trigger_count: (workflow.trigger_count || 0) + 1,
        })
        .eq('id', workflow.id)

    } catch (err: any) {
      // Log failed run
      await supabase
        .from('workflow_runs')
        .insert({
          workflow_id: workflow.id,
          business_id: event.businessId,
          trigger_data: event.data,
          status: 'failed',
          error: err.message,
        })
    }
  }
}

function evaluateCondition(
  config: Record<string, any>,
  data: Record<string, any>
): boolean {
  if (!config || Object.keys(config).length === 0) {
    return true // No condition = always pass
  }

  for (const [key, value] of Object.entries(config)) {
    if (key === 'amount_gt' && data.amount <= value) return false
    if (key === 'amount_lt' && data.amount >= value) return false
    if (key === 'qty_below' && data.qty >= value) return false
    if (key === 'party_type' && data.party_type !== value) return false
  }

  return true
}

async function executeAction(
  action: Record<string, any>,
  data: Record<string, any>,
  businessId: string
): Promise<Record<string, any>> {
  const template = (str: string) =>
    str.replace(/\{(\w+)\}/g, (_, key) =>
      String(data[key] || `{${key}}`)
    )

  switch (action.type) {
    case 'dashboard_notification': {
      notify[action.severity as 'warning' | 'info' | 'error' | 'success'](
        template(action.title),
        template(action.message),
        action.route || undefined
      )
      return { type: action.type, status: 'sent' }
    }

    case 'whatsapp_notify': {
      if (!data.phone) {
        return {
          type: action.type,
          status: 'skipped',
          reason: 'no phone number',
        }
      }
      const message = template(
        action.message_template || 'Automated alert from Noxis Hub'
      )
      openWhatsApp(
        data.phone,
        message,
        data.country_code || 'PK'
      )
      return { type: action.type, status: 'opened' }
    }

    case 'create_task': {
      const supabase = createClient()
      await supabase.from('tasks').insert({
        business_id: businessId,
        title: template(action.title),
        description: template(action.description || ''),
        due_date: action.due_in_days
          ? new Date(
              Date.now() + action.due_in_days * 86400000
            ).toISOString().split('T')[0]
          : null,
        source: 'workflow',
        workflow_id: action.workflow_id || null,
      })
      return { type: action.type, status: 'created' }
    }

    default:
      return {
        type: action.type,
        status: 'unknown_action',
      }
  }
}

// Call this from throughout the app wherever important events happen:
export const trigger = {
  invoicePosted: (data: {
    businessId: string
    invoiceId: string
    invoiceNumber: string
    totalAmount: number
    partyId: string
    partyName: string
    phone?: string
  }) => evaluateWorkflows({
    type: 'invoice.posted',
    data,
    businessId: data.businessId,
  }),

  stockBelowThreshold: (data: {
    businessId: string
    skuId: string
    skuName: string
    currentQty: number
    reorderLevel: number
    unit: string
  }) => evaluateWorkflows({
    type: 'stock.below_threshold',
    data,
    businessId: data.businessId,
  }),

  peshgiExceeds: (data: {
    businessId: string
    karigarId: string
    karigarName: string
    peshgiBalance: number
    phone?: string
  }) => evaluateWorkflows({
    type: 'karigar.peshgi_exceeds',
    data,
    businessId: data.businessId,
  }),

  invoiceOverdue: (data: {
    businessId: string
    invoiceId: string
    invoiceNumber: string
    partyName: string
    balanceDue: number
    daysOverdue: number
    phone?: string
  }) => evaluateWorkflows({
    type: 'invoice.overdue',
    data,
    businessId: data.businessId,
  }),
}
