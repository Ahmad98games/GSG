import { createClient } from '@/lib/supabase/client'
import { queryClient } from '@/lib/queryClient'

// Track active subscriptions so we can clean up on unmount
const activeChannels: any[] = []

interface CDCConfig {
  businessId: string
  onAttendance?: (payload: any) => void
  onProduction?: (payload: any) => void
  onAdvance?: (payload: any) => void
  onInvoice?: (payload: any) => void
  onPayment?: (payload: any) => void
  onInventory?: (payload: any) => void
  onPurchaseOrder?: (payload: any) => void
  onAnyChange?: (table: string, payload: any) => void
}

export function startRealtimeCDC(config: CDCConfig): () => void {
  const supabase = createClient()
  const { businessId } = config

  console.log('[CDC] Starting Realtime subscriptions')

  // ── ATTENDANCE CHANNEL ──
  const attendanceChannel = supabase
    .channel(`attendance-${businessId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance_logs',
        filter: `business_id=eq.${businessId}`,
      },
      (payload: any) => {
        console.log('[CDC] New attendance:', payload.new)

        // Immediately invalidate attendance cache
        queryClient.invalidateQueries({
          queryKey: ['attendance', businessId],
        })
        queryClient.invalidateQueries({
          queryKey: ['dashboard', businessId],
        })

        config.onAttendance?.(payload.new)
        config.onAnyChange?.('attendance_logs', payload.new)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'attendance_logs',
        filter: `business_id=eq.${businessId}`,
      },
      (payload: any) => {
        queryClient.invalidateQueries({
          queryKey: ['attendance', businessId],
        })
        config.onAttendance?.(payload.new)
        config.onAnyChange?.('attendance_logs', payload.new)
      }
    )
    .subscribe((status: any) => {
      console.log(`[CDC] Attendance channel: ${status}`)
    })

  // ── PRODUCTION CHANNEL ──
  const productionChannel = supabase
    .channel(`production-${businessId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'karigar_production_logs',
        filter: `business_id=eq.${businessId}`,
      },
      (payload: any) => {
        console.log('[CDC] New production log:', payload.new)

        queryClient.invalidateQueries({
          queryKey: ['production', businessId],
        })
        queryClient.invalidateQueries({
          queryKey: ['dashboard', businessId],
        })

        config.onProduction?.(payload.new)
        config.onAnyChange?.('karigar_production_logs', payload.new)
      }
    )
    .subscribe()

  // ── PESHGI CHANNEL ──
  const peshgiChannel = supabase
    .channel(`peshgi-${businessId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'peshgi_transactions',
        filter: `business_id=eq.${businessId}`,
      },
      (payload: any) => {
        console.log('[CDC] New peshgi:', payload.new)

        queryClient.invalidateQueries({
          queryKey: ['karigars', businessId],
        })
        queryClient.invalidateQueries({
          queryKey: ['dashboard', businessId],
        })

        config.onAdvance?.(payload.new)
        config.onAnyChange?.('peshgi_transactions', payload.new)
      }
    )
    .subscribe()

  // ── INVOICES CHANNEL ──
  const invoiceChannel = supabase
    .channel(`invoices-${businessId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'invoices',
        filter: `business_id=eq.${businessId}`,
      },
      (payload: any) => {
        queryClient.invalidateQueries({
          queryKey: ['invoices', businessId],
        })
        queryClient.invalidateQueries({
          queryKey: ['dashboard', businessId],
        })

        config.onInvoice?.(payload.new)
        config.onAnyChange?.('invoices', payload.new)
      }
    )
    .subscribe()

  // ── PAYMENTS CHANNEL ──
  const paymentChannel = supabase
    .channel(`payments-${businessId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'payments',
        filter: `business_id=eq.${businessId}`,
      },
      (payload: any) => {
        queryClient.invalidateQueries({
          queryKey: ['payments', businessId],
        })
        queryClient.invalidateQueries({
          queryKey: ['parties', businessId],
        })
        queryClient.invalidateQueries({
          queryKey: ['dashboard', businessId],
        })

        config.onPayment?.(payload.new)
        config.onAnyChange?.('payments', payload.new)
      }
    )
    .subscribe()

  // ── INVENTORY CHANNEL ──
  const inventoryChannel = supabase
    .channel(`inventory-${businessId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'skus',
        filter: `business_id=eq.${businessId}`,
      },
      (payload: any) => {
        queryClient.invalidateQueries({
          queryKey: ['inventory', businessId],
        })
        queryClient.invalidateQueries({
          queryKey: ['skus', businessId],
        })
        config.onInventory?.(payload.new)
        config.onAnyChange?.('skus', payload.new)
      }
    )
    .subscribe()

  // ── PURCHASE ORDERS CHANNEL ──
  const purchaseChannel = supabase
    .channel(`purchase-${businessId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'purchase_orders',
        filter: `business_id=eq.${businessId}`,
      },
      (payload: any) => {
        queryClient.invalidateQueries({
          queryKey: ['purchase_orders', businessId],
        })
        queryClient.invalidateQueries({
          queryKey: ['dashboard', businessId],
        })
        config.onPurchaseOrder?.(payload.new)
        config.onAnyChange?.('purchase_orders', payload.new)
      }
    )
    .subscribe()

  // Track channels for cleanup
  const channels = [
    attendanceChannel,
    productionChannel,
    peshgiChannel,
    invoiceChannel,
    paymentChannel,
    inventoryChannel,
    purchaseChannel,
  ]

  activeChannels.push(...channels)

  // Return cleanup function
  return () => {
    console.log('[CDC] Stopping Realtime subscriptions')
    channels.forEach(ch => {
      supabase.removeChannel(ch)
    })
    // Remove from activeChannels array
    channels.forEach(ch => {
      const idx = activeChannels.indexOf(ch)
      if (idx > -1) activeChannels.splice(idx, 1)
    })
  }
}

// Stop all active channels (call on app unmount or logout)
export function stopAllRealtimeCDC(): void {
  const supabase = createClient()
  activeChannels.forEach(ch => {
    supabase.removeChannel(ch)
  })
  activeChannels.length = 0
  console.log('[CDC] All channels stopped')
}
