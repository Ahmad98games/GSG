"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface InvoiceSelectorProps {
  businessId?: string;
  onSelect: (invoice: any) => void;
}

export default function InvoiceSelector({ businessId, onSelect }: InvoiceSelectorProps) {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!businessId) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('invoices')
          .select('id, invoice_no, total, party_id, party:parties(id, name)')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });
        setInvoices(data || []);
      } catch (err) {
        console.error('[InvoiceSelector]', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [businessId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    const inv = invoices.find(i => i.id === id);
    onSelect(inv || null);
  };

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      disabled={loading}
      className="w-full bg-[#161A1F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40"
    >
      <option value="">-- Select Invoice --</option>
      {invoices.map((inv) => (
        <option key={inv.id} value={inv.id}>
          {inv.invoice_no} ({inv.party?.name || 'No customer'}) - {inv.total?.toLocaleString()}
        </option>
      ))}
    </select>
  );
}
