import React from 'react';
import { createClient } from '@/lib/supabase/server';
import PortalManagementClient from './PortalManagementClient';

export default async function PortalPage() {
  const supabase = await createClient();
  
  // 1. Get current business context
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('business_id')
    .eq('id', user?.id)
    .single();

  if (!profile?.business_id) return null;

  // 2. Fetch Portals with Party info
  const { data: portals } = await supabase
    .from('client_portals')
    .select(`
      id,
      display_name,
      email,
      status,
      invite_sent_at,
      last_login_at,
      party:parties(name)
    `)
    .eq('business_id', profile.business_id);

  // 3. Fetch Parties (for invite select)
  const { data: parties } = await supabase
    .from('parties')
    .select('id, name, email')
    .eq('business_id', profile.business_id)
    .eq('type', 'customer');

  const transformedPortals = portals?.map(p => ({
    ...p,
    party_name: (p.party as unknown as { name: string })?.name || 'Unknown'
  })) || [];

  return (
    <PortalManagementClient 
      initialPortals={transformedPortals} 
      parties={parties || []}
      businessId={profile.business_id}
    />
  );
}

