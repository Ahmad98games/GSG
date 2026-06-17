// src/hooks/usePurchaseQueries.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useSuppliers() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .in('party_type', ['supplier', 'both'])
        .order('name');
      if (error) throw error;
      return data;
    }
  });
}

export function useSupplierScorecards() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['supplier-scorecards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_scorecards')
        .select('*');
      if (error) throw error;
      return data;
    }
  });
}

export function useReorderSuggestions() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['reorder-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reorder_suggestions')
        .select('*');
      if (error) throw error;
      return data;
    }
  });
}

export function usePurchaseOrders(status?: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['purchase-orders', status],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select('*, supplier:parties(name)');
      
      if (status) query = query.eq('status', status);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
}

export function usePurchaseOrder(id: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, supplier:parties(*), items:po_line_items(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && id !== 'new'
  });
}

export function useCreatePO() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: any) => {
      const { items, ...poData } = payload;
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert(poData)
        .select()
        .single();
      
      if (poError) throw poError;

      const lineItems = items.map((item: any) => ({
        ...item,
        po_id: po.id
      }));

      const { error: itemsError } = await supabase
        .from('po_line_items')
        .insert(lineItems);
      
      if (itemsError) throw itemsError;
      return po;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['reorder-suggestions'] });
    }
  });
}

export function useProcessGRN() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { items, ...grnData } = payload;
      const { data: grn, error: grnError } = await supabase
        .from('goods_received_notes')
        .insert(grnData)
        .select()
        .single();
      
      if (grnError) throw grnError;

      const lineItems = items.map((item: any) => ({
        ...item,
        grn_id: grn.id
      }));

      const { error: itemsError } = await supabase
        .from('grn_line_items')
        .insert(lineItems);
      
      if (itemsError) throw itemsError;

      // Acceptance trigger in DB will handle stock.
      // We update the GRN status to trigger it.
      const { data: updatedGrn, error: updateError } = await supabase
        .from('goods_received_notes')
        .update({ status: 'accepted' })
        .eq('id', grn.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return updatedGrn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods_received_notes'] });
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    }
  });
}

export function useUpdatePOStatus() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase_order', variables.id] });
    }
  });
}
