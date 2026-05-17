import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useShipments(filters: { status?: string; search?: string } = {}) {
  const supabase = createClient();

  return useInfiniteQuery({
    queryKey: ['shipments', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('shipments')
        .select(`
          *,
          client:parties(name)
        `)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + 19);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.ilike('shipment_ref', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, nextCursor: data.length === 20 ? pageParam + 20 : null };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });
}

export function useUpdateShipmentStatus() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const updateData: any = { status };
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    }
  });
}

