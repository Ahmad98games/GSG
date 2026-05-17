import React from 'react';
import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/auth/portal';
import { createAdminClient } from '@/lib/supabase/admin';
import { PersonaEngine } from '@/lib/persona/PersonaEngine';
import InvoicesClient from './InvoicesClient';

export default async function PortalInvoicesPage() {
  const portal = await getPortalSession();
  if (!portal) redirect('/portal/auth');

  const admin = createAdminClient();

  // Fetch Full Statement via SQL RPC
  const { data: invoices, error } = await admin.rpc('get_client_statement', {
    p_portal_id: portal.id
  });

  const t = (key: string) => PersonaEngine.t(key);
  const fmt = (val: number) => PersonaEngine.formatCurrency(val);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wider">{t('portal.invoices.title')}</h1>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">
          Review your transaction history and outstanding balances.
        </p>
      </div>

      <InvoicesClient 
        initialInvoices={invoices || []} 
        t={t}
        fmt={fmt}
      />
    </div>
  );
}

