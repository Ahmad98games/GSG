import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useGDPRRequests() {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['gdpr-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gdpr_export_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
}

export function useCreateGDPRRequest() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, isDeletion }: { email: string; isDeletion: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('gdpr_export_requests')
        .insert({
          subject_email: email,
          deletion_request: isDeletion,
          business_id: user?.user_metadata.business_id,
          requested_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger Edge Function
      const { data: efData, error: efError } = await supabase.functions.invoke('gdpr-export', {
        body: { 
          requestId: data.id, 
          businessId: data.business_id,
          subjectEmail: email,
          deletionRequest: isDeletion
        }
      });

      if (efError) console.error("EF Error:", efError);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gdpr-requests'] });
    }
  });
}

export function useComplianceChecks() {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['compliance-checks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_checks')
        .select('*')
        .order('signed_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
}

