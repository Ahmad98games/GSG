// src/hooks/usePurchaseQueries.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useSuppliers() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      // 1. Try local SQLite API first
      try {
        const res = await fetch('/api/parties');
        if (res.ok) {
          const json = await res.json();
          const allParties = json.data || [];
          const suppliers = allParties.filter((p: any) => 
            p.party_type === 'supplier' || p.party_type === 'both' || p.party_type === 'vendor'
          );
          if (suppliers.length > 0) return suppliers;
          // If no specific suppliers categorized yet, return all parties so dropdown isn't blocked
          if (allParties.length > 0) return allParties;
        }
      } catch (e) {
        console.warn('[useSuppliers] Local API fallback error:', e);
      }

      // 2. Supabase fallback
      try {
        const { data, error } = await supabase
          .from('parties')
          .select('*')
          .in('party_type', ['supplier', 'both'])
          .order('name');
        if (!error && data && data.length > 0) return data;
      } catch {}

      return [];
    }
  });
}

export function useSupplierScorecards() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['supplier-scorecards'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('supplier_scorecards')
          .select('*');
        if (!error && data) return data;
      } catch {}
      return [];
    }
  });
}

export function useReorderSuggestions() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['reorder-suggestions'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('reorder_suggestions')
          .select('*');
        if (!error && data) return data;
      } catch {}
      return [];
    }
  });
}

export function usePurchaseOrders(status?: string) {
  return useQuery({
    queryKey: ['purchase-orders', status],
    queryFn: async () => {
      // 1. Local SQLite API
      try {
        const url = `/api/purchase${status && status !== 'all' ? `?status=${status}` : ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            if (typeof window !== 'undefined') {
              try { localStorage.setItem('noxis_cached_purchase_orders', JSON.stringify(json.data)); } catch {}
            }
            return json.data;
          }
        }
      } catch (err) {
        console.warn('[Purchase] Local API fetch failed:', err);
      }

      // 2. Local storage cache fallback
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('noxis_cached_purchase_orders');
          if (raw) return JSON.parse(raw);
        } catch {}
      }

      return [];
    }
  });
}

export function usePurchaseRegistryStats() {
  return useQuery({
    queryKey: ['purchase-stats'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/purchase');
        if (res.ok) {
          const json = await res.json();
          return json.stats || { totalOrders: 0, openOrders: 0, pendingReceipt: 0, monthlyValue: 0 };
        }
      } catch {}
      return { totalOrders: 0, openOrders: 0, pendingReceipt: 0, monthlyValue: 0 };
    }
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/purchase?id=${id}`);
        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
      } catch (e) {
        console.warn('[usePurchaseOrder] Error:', e);
      }
      return null;
    },
    enabled: !!id && id !== 'new'
  });
}

export function useCreatePO() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to create purchase order');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-stats'] });
      queryClient.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['skus'] });
    }
  });
}

export function useUpdatePOStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await fetch('/api/purchase', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update order status');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-stats'] });
      queryClient.invalidateQueries({ queryKey: ['skus'] });
    }
  });
}

export function useProcessGRN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      // Direct GRN processing via PO status update
      const res = await fetch('/api/purchase', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payload.po_id, status: 'received' })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to process goods receipt');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods_received_notes'] });
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-stats'] });
    }
  });
}
