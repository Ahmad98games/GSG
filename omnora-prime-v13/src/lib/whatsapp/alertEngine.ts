const WHATSAPP_FOOTER = `

─────────────────
🔒 Securely logged by Noxis Hub
Powered by Omnora Labs | noxishub.app`;

export const ALERT_TEMPLATES = {
  daily_summary: (data: {
    date: string,
    revenue: string,
    units: string,
    topKarigar: string,
    lowStockCount: number,
  }) => `
📊 *Noxis Daily Summary*
📅 ${data.date}

💰 Today's Revenue: *${data.revenue}*
🏭 Units Produced: *${data.units}*
⭐ Top Performer: *${data.topKarigar}*
${data.lowStockCount > 0 ?
  `⚠️ Low Stock: *${data.lowStockCount} items*` : ''}

_Powered by Noxis — Omnora Labs_${WHATSAPP_FOOTER}
  `.trim(),
  
  low_stock: (sku: {
    name: string, qty: string, unit: string,
    reorderLevel: string
  }) => `
⚠️ *Low Stock Alert*

📦 *${sku.name}*
Remaining: *${sku.qty} ${sku.unit}*
Reorder Level: ${sku.reorderLevel} ${sku.unit}

Tap to reorder: [link]

_Noxis Inventory Alert_${WHATSAPP_FOOTER}
  `.trim(),
  
  advance_request: (k: {
    name: string, amount: string, reason: string
  }) => `
💰 *Advance Request*

👷 *${k.name}* has requested an advance
Amount: *${k.amount}*
Reason: ${k.reason}

Please approve or reject in Noxis.${WHATSAPP_FOOTER}
  `.trim(),
  
  invoice_reminder: (inv: {
    partyName: string, amount: string,
    dueDate: string, invoiceNo: string
  }) => `
🔔 *Payment Reminder*

Dear ${inv.partyName},

Invoice *${inv.invoiceNo}*
Amount Due: *${inv.amount}*
Due Date: *${inv.dueDate}*

Please arrange payment at your earliest.

Thank you.${WHATSAPP_FOOTER}
  `.trim(),
  
  production_target: (data: {
    target: number, achieved: number,
    percentage: number, shift: string
  }) => `
🏭 *Production Update — ${data.shift} Shift*

Target: *${data.target} units*
Achieved: *${data.achieved} units*
Progress: *${data.percentage}%*

${data.percentage >= 100 ? '✅ Target achieved!' :
  data.percentage >= 80 ? '⚡ Almost there!' :
  '⚠️ Behind target — check production floor'}

_Noxis Production Alert_${WHATSAPP_FOOTER}
  `.trim(),
};

async function sendViaApi(phone: string, message: string) {
  // Mock API call to WhatsApp Business API
  console.log(`Sending WhatsApp API message to ${phone}: ${message}`);
  const res = await fetch('/api/whatsapp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message })
  });
  return res.ok;
}

export function sendWhatsAppAlert(
  phone: string,
  message: string,
  tier: string = 'lite'
) {
  if (tier === 'elite' && typeof window === 'undefined') {
    // Server-side (Elite tier)
    return sendViaApi(phone, message);
  } else {
    // Client-side or Non-Elite
    const encoded = encodeURIComponent(message);
    const clean = phone.replace(/[^0-9]/g, '');
    const waPhone = clean.startsWith('0')
      ? '92' + clean.slice(1)  // Pakistan specific normalization
      : clean.startsWith('92') ? clean : '92' + clean;
      
    if (typeof window !== 'undefined') {
      window.open(
        `https://wa.me/${waPhone}?text=${encoded}`,
        '_blank'
      );
    }
  }
}
