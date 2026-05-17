// src/services/WhatsAppBusinessService.ts
import { createClient } from "@/lib/supabase/client";

/**
 * NOXIS WhatsApp Intelligence (Elite Tier)
 * Handles automated messaging via BSP (WATI) with graceful fallback to wa.me links.
 */
export class WhatsAppBusinessService {
  private static supabase = createClient();

  /**
   * Send a message using the Elite API or return a fallback link
   */
  private static async send(to: string, templateName: string, params: string[]) {
    try {
      const { hasFeature } = (await import('@/stores/tierStore')).useTierStore.getState();
      if (!hasFeature('whatsappAutoAlerts')) {
        throw new Error("WhatsApp automation requires Pro tier.");
      }

      const { data, error } = await this.supabase.functions.invoke('whatsapp-send', {
        body: { to, templateName, params }
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error("WhatsApp Send Error:", err);
      // Construct fallback link for manual action if automation fails
      const message = `Template: ${templateName} | Params: ${params.join(', ')}`;
      return {
        success: false,
        fallback: `https://wa.me/${to.replace('+', '')}?text=${encodeURIComponent(message)}`
      };
    }
  }

  static async sendDailySalesReport(phone: string, data: { 
    date: string, sales: string, cash: string, credit: string, invoices: number 
  }) {
    return this.send(phone, 'daily_sales_report', [
      data.date, data.sales, data.cash, data.credit, data.invoices.toString()
    ]);
  }

  static async sendPaymentReminder(phone: string, partyName: string, amount: string, invoiceNo: string, dueDate: string, portalUrl: string) {
    return this.send(phone, 'payment_reminder', [
      partyName, amount, invoiceNo, dueDate, portalUrl
    ]);
  }

  static async sendCriticalAlert(phone: string, alertType: string, details: string, timestamp: string) {
    return this.send(phone, 'critical_alert', [
      alertType, details, timestamp
    ]);
  }

  static async sendPaySlip(phone: string, karigarName: string, gross: string, net: string, period: string) {
    return this.send(phone, 'payslip_ready', [
      karigarName, gross, net, period
    ]);
  }
}

