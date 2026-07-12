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
  }
): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from('audit_logs').insert({
      business_id: params.businessId,
      user_name: params.userName || 'System',
      user_role: params.userRole || 'owner',
      action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      entity_label: params.entityLabel || null,
      old_values: params.oldValues || null,
      new_values: params.newValues || null,
    })
  } catch (err: any) {
    // Audit log failure is never fatal —
    // the actual action already completed
    // Just log to console in dev
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Audit] Log write failed:', err.message)
    }
  }
}
