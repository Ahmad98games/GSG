/**
 * Noxis Hub WhatsApp Integration Engine
 * Supports 3 delivery methods based on tier and device
 */

export type WhatsAppParams = {
  phone: string; // format: 923001234567
  message: string;
};

export class WhatsAppSender {
  /**
   * METHOD 1: wa.me link (Universal, No API required)
   */
  static sendViaWaLink({ phone, message }: WhatsAppParams) {
    // Clean phone number (remove +, spaces, dashes)
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
  }

  /**
   * METHOD 2: WhatsApp Business API (Elite Tier)
   * Calls Supabase Edge Function
   */
  static async sendViaApi({ phone, message }: WhatsAppParams, supabase: any) {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: { phone, message }
    });
    if (error) throw error;
    return data;
  }

  /**
   * METHOD 3: Native Share (Mobile PWA)
   */
  static async shareViaNative({ phone, message }: WhatsAppParams) {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Noxis Hub Document',
          text: message,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        // Fallback to wa.me
        this.sendViaWaLink({ phone, message });
      }
    } else {
      this.sendViaWaLink({ phone, message });
    }
  }

  /**
   * Intelligent Dispatcher
   */
  static async send(params: WhatsAppParams, tier: string = 'starter', supabase?: any) {
    if (tier === 'elite' && supabase) {
      return this.sendViaApi(params, supabase);
    }
    
    // Check if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && typeof navigator.share === 'function') {
      return this.shareViaNative(params);
    }
    
    return this.sendViaWaLink(params);
  }
}

/**
 * Message Generators
 */
export const WhatsAppTemplates = {
  invoice: (businessName: string, invNumber: string, amount: string, dueDate: string, phone: string) => `
Invoice #${invNumber} from ${businessName}
Amount: PKR ${amount}
Due: ${dueDate}
View: [Link Protected by Noxis]

${businessName} | ${phone}`.trim(),

  payslip: (businessName: string, karigarName: string, month: string, gross: string, deductions: string, net: string) => `
Salary Slip — ${karigarName}
Period: ${month}
Gross: PKR ${gross}
Deductions: PKR ${deductions}  
Net Payable: PKR ${net}

${businessName}`.trim(),

  peshgi: (businessName: string, karigarName: string, amount: string, balance: string) => `
Peshgi Receipt — ${karigarName}
Amount Received: PKR ${amount}
Remaining Balance: PKR ${balance}

${businessName}`.trim(),

  lowStock: (items: { name: string, qty: number }[]) => `
⚠️ LOW STOCK ALERT
${items.map(i => `- ${i.name}: ${i.qty} remaining`).join('\n')}

Please review purchase requirements.`.trim(),

  overdueReminder: (businessName: string, amount: string, days: number) => `
Payment Reminder from ${businessName}
Your invoice of PKR ${amount} is ${days} days overdue.
Please clear the balance at your earliest convenience.

Thank you.`.trim(),

  dailySummary: (date: string, sales: string, collections: string) => `
Daily Business Summary — ${date}
Total Sales: PKR ${sales}
Total Collections: PKR ${collections}

Generated via Noxis Hub Intelligence`.trim()
};
