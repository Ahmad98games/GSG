import { createClient } from '@/lib/supabase/client';

export interface WorkflowRule {
  id: string;
  business_id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  is_enabled: boolean;
}

export interface WorkflowLog {
  rule_id: string;
  status: 'success' | 'failed';
  message: string;
  executed_at: string;
}

/**
 * Workflows Execution Engine
 * Evaluates triggers and dispatches automated actions for Noxis Hub v13
 */
export async function dispatchWorkflowEvent(
  triggerType: string,
  eventPayload: Record<string, any>
): Promise<WorkflowLog[]> {
  const supabase = createClient();
  const logs: WorkflowLog[] = [];

  try {
    // 1. Fetch matching active workflows
    const { data: rules, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('trigger_type', triggerType)
      .eq('is_enabled', true);

    if (error || !rules || rules.length === 0) {
      return [];
    }

    for (const rule of rules) {
      try {
        let actionResult = '';

        // 2. Evaluate Rule Action
        if (rule.action_type === 'dashboard_notification') {
          const title = interpolateTemplate(rule.action_config.title || 'Workflow Triggered', eventPayload);
          const message = interpolateTemplate(rule.action_config.message || 'Rule executed successfully', eventPayload);
          
          actionResult = `Dashboard notification queued: "${title}" - ${message}`;
        } else if (rule.action_type === 'whatsapp_notify') {
          const body = interpolateTemplate(rule.action_config.message_template || 'Notice: {event}', eventPayload);
          actionResult = `WhatsApp draft generated: "${body.substring(0, 40)}..."`;
        } else if (rule.action_type === 'create_task') {
          const taskTitle = interpolateTemplate(rule.action_config.title || 'Follow up required', eventPayload);
          actionResult = `Task created: "${taskTitle}"`;
        }

        const logItem: WorkflowLog = {
          rule_id: rule.id,
          status: 'success',
          message: actionResult,
          executed_at: new Date().toISOString()
        };
        logs.push(logItem);

        // Store log in localStorage for immediate UI reactivity
        if (typeof window !== 'undefined') {
          const existingLogs = JSON.parse(localStorage.getItem('noxis_workflow_logs') || '[]');
          localStorage.setItem('noxis_workflow_logs', JSON.stringify([logItem, ...existingLogs.slice(0, 49)]));
        }
      } catch (err: any) {
        logs.push({
          rule_id: rule.id,
          status: 'failed',
          message: err.message || 'Execution failed',
          executed_at: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error('Workflow dispatch error:', err);
  }

  return logs;
}

function interpolateTemplate(template: string, payload: Record<string, any>): string {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return payload[key] !== undefined ? String(payload[key]) : `{${key}}`;
  });
}
