import { createClient } from '@/lib/supabase/client'

export type AuditAction =
  | 'invoice.created'
  | 'invoice.posted'
  | 'invoice.deleted'
  | 'invoice.payment_recorded'
  | 'invoice.whatsapp_sent'
  | 'karigar.created'
  | 'karigar.peshgi_given'
  | 'karigar.attendance_marked'
  | 'karigar.production_logged'
  | 'party.created'
  | 'party.portal_generated'
  | 'inventory.adjusted'
  | 'payroll.run_created'
  | 'user.login'
  | 'user.logout'
  | 'user.added'
  | 'user.removed'
  | 'license.activated'
  | 'settings.changed'

export async function logAction(
  action: AuditAction,
  params: {
    entityType: string
    entityId?: string
    entityLabel?: string
    oldValues?: Record<string, any>
    newValues?: Record<string, any>
    businessId: string
    userName?: string
    userRole?: string
    branchId?: string
    sessionId?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  try {
    const supabase = createClient()
    
    // Resolve session_id
    let resolvedSessionId = params.sessionId || null
    let resolvedUserId = null
    if (!resolvedSessionId) {
      const { data: { session } } = await supabase.auth.getSession()
      resolvedSessionId = session?.access_token || null
      resolvedUserId = session?.user?.id || null
    }

    // Resolve branch_id from zustand store if client-side
    let resolvedBranchId = params.branchId || null
    if (!resolvedBranchId && typeof window !== 'undefined') {
      try {
        const { useBranchStore } = require('@/stores/branchStore')
        resolvedBranchId = useBranchStore.getState().currentBranchId || null
      } catch {}
    }

    await supabase.from('audit_logs').insert({
      business_id: params.businessId,
      user_id: resolvedUserId,
      user_name: params.userName || 'System',
      user_role: params.userRole || 'owner',
      action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      entity_label: params.entityLabel || null,
      old_values: params.oldValues || null,
      new_values: params.newValues || null,
      session_id: resolvedSessionId,
      branch_id: resolvedBranchId,
      metadata: params.metadata || {},
    })
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Audit] Log write failed:', err.message)
    }
  }
}

export const audit = {
  invoicePosted: (businessId: string, invoice: any, previous?: any) => 
    logAction('invoice.posted', {
      businessId,
      entityType: 'invoice',
      entityId: invoice.id,
      entityLabel: invoice.invoice_no,
      oldValues: previous,
      newValues: invoice,
    }),
  paymentRecorded: (businessId: string, payment: any) =>
    logAction('invoice.payment_recorded', {
      businessId,
      entityType: 'payment',
      entityId: payment.id,
      entityLabel: `Payment of ${payment.amount}`,
      newValues: payment,
    }),
  karigarCreated: (businessId: string, karigar: any) =>
    logAction('karigar.created', {
      businessId,
      entityType: 'karigar',
      entityId: karigar.id,
      entityLabel: karigar.name,
      newValues: karigar,
    }),
  stockAdjusted: (businessId: string, sku: any, previousQty: number, newQty: number) =>
    logAction('inventory.adjusted', {
      businessId,
      entityType: 'sku',
      entityId: sku.id,
      entityLabel: sku.name,
      oldValues: { qty_on_hand: previousQty },
      newValues: { qty_on_hand: newQty },
    }),
  settingsChanged: (businessId: string, settings: any, previous: any) =>
    logAction('settings.changed', {
      businessId,
      entityType: 'settings',
      oldValues: previous,
      newValues: settings,
    }),
}
