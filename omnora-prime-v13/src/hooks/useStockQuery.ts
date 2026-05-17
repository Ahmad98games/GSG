import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfileStore } from '@/store/BusinessProfileStore';

export interface StockFilters {
  search?: string;
  location?: string;
  category?: string;
  industryMetadata?: Record<string, any>;
}

export const useStockQuery = (filters: StockFilters) => {
  const supabase = createClient();
  const { profile } = useBusinessProfileStore();

  return useInfiniteQuery({
    queryKey: ['stock', profile?.id, filters],
    queryFn: async ({ pageParam = null }) => {
      if (!profile?.id) return { data: [], nextCursor: null };

      let query = supabase
        .from('skus')
        .select('*')
        .eq('business_id', profile.id)
        .order('id', { ascending: true })
        .limit(20);

      // Cursor-based pagination
      if (pageParam) {
        query = query.gt('id', pageParam);
      }

      // Filtering
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku_code.ilike.%${filters.search}%`);
      }
      if (filters.location) {
        query = query.eq('current_location', filters.location);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        data: data || [],
        nextCursor: data.length === 20 ? data[data.length - 1].id : null,
      };
    },
    getNextPageParam: (lastPage: { nextCursor: string | null }) => lastPage.nextCursor,
    initialPageParam: null,
    enabled: !!profile?.id,
    staleTime: 30000, // 30 seconds
  });
};

