"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StaffRole } from '@/lib/auth/permissions';

export function useStaff(businessId?: string) {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRole() {
      if (!businessId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setRole(null);
          setIsLoading(false);
          return;
        }

        // 1. Check if user is the OWNER of the business
        const { data: ownerProfile } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('id', businessId)
          .eq('user_id', session.user.id)
          .single();

        if (ownerProfile) {
          setRole('owner');
          setIsLoading(false);
          return;
        }

        // 2. If not owner, check STAFF_USERS table
        const { data: staffUser } = await supabase
          .from('staff_users')
          .select('role')
          .eq('business_id', businessId)
          .eq('email', session.user.email)
          .single();

        if (staffUser) {
          setRole(staffUser.role as StaffRole);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error('Error fetching staff role:', err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, [businessId]);

  return { role, isLoading };
}
