import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface SaleEvent {
  invoiceId: string;
  partyName: string;
  total: number;
  currency: string;
  postedAt: string;
  businessId: string;
}

const salesChannel = supabase.channel('sales-feed', {
  config: { broadcast: { self: false } }
});

// After a sale is posted on Mobile POS:
export async function broadcastSaleEvent(event: SaleEvent) {
  try {
    await salesChannel.send({
      type: 'broadcast',
      event: 'SALE_POSTED',
      payload: event
    });
    console.log(`[Broadcast] Sale ${event.invoiceId} synchronized.`);
  } catch (err) {
    console.error("[Broadcast] Sync failed:", err);
  }
}

// On Factory Dashboard (PC) — subscribe:
export function subscribeSalesFeed(onSale: (event: SaleEvent) => void) {
  const sub = salesChannel
    .on('broadcast', { event: 'SALE_POSTED' }, ({ payload }: { payload: SaleEvent }) => {
      onSale(payload);
    })
    .subscribe((status: string) => {
      console.log(`[Broadcast] Feed Status: ${status}`);
    })

  return () => {
    supabase.removeChannel(sub);
  };
}

