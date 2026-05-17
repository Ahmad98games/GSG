import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useMedicalBatches(filters: { status?: string; search?: string } = {}) {
  const supabase = createClient();

  return useInfiniteQuery({
    queryKey: ['medical-batches', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('product_batches_medical')
        .select(`
          *,
          sku:skus(name, unit)
        `)
        .order('expiry_date', { ascending: true })
        .range(pageParam, pageParam + 19);

      if (filters.status === 'expiring_soon') {
        const ninetyDays = new Date();
        ninetyDays.setDate(ninetyDays.getDate() + 90);
        query = query.lte('expiry_date', ninetyDays.toISOString().split('T')[0]).eq('recall_status', 'clear');
      } else if (filters.status === 'expired') {
        query = query.lt('expiry_date', new Date().toISOString().split('T')[0]);
      } else if (filters.status === 'recalled') {
        query = query.eq('recall_status', 'recalled');
      }

      if (filters.search) {
        query = query.ilike('batch_number', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, nextCursor: data.length === 20 ? pageParam + 20 : null };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });
}

export function useRecallMutation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchId, status, reason }: { batchId: string; status: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('product_batches_medical')
        .update({ recall_status: status })
        .eq('id', batchId)
        .select()
        .single();

      if (error) throw error;

      // Log to security_audit
      await supabase.from('security_audit').insert({
        business_id: data.business_id,
        node_id: '00000000-0000-0000-0000-000000000000', // System node
        alert_type: 'BATCH_RECALL',
        operator_notes: `Batch ${data.batch_number} marked as ${status}. Reason: ${reason || 'N/A'}`,
        severity: 'critical'
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-batches'] });
    }
  });
}

