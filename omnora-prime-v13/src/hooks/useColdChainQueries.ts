import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useColdChainLatest() {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['cold-chain-latest'],
    queryFn: async () => {
      // Get latest log for each location
      const { data, error } = await supabase.rpc('get_latest_cold_chain_logs');
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });
}

export function useLogTemperature() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ location, temp }: { location: string; temp: number }) => {
      const { data, error } = await supabase
        .from('cold_chain_logs')
        .insert({
          location_label: location,
          temp_celsius: temp,
          business_id: (await supabase.auth.getUser()).data.user?.user_metadata.business_id 
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cold-chain-latest'] });
    }
  });
}

