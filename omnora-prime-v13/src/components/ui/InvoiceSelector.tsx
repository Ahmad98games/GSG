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
    const load = async () => {
      setLoading(true);
      const invoiceMap = new Map<string, any>();

      // 1. Instant synchronous read from localStorage cache (0ms, 100% offline)
      if (typeof window !== 'undefined') {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('noxis_cached_invoices') || key.startsWith('noxis_invoices'))) {
              const raw = localStorage.getItem(key);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  parsed.forEach((inv: any) => {
                    if (inv?.id) {
                      invoiceMap.set(inv.id, {
                        ...inv,
                        invoice_no: inv.invoice_number || inv.invoice_no || inv.id,
                        total: inv.total_amount ?? inv.total ?? 0,
                        party_name: inv.party_name || inv.party?.name || 'Walk-in Customer',
                      });
                    }
                  });
                }
              }
            }
          }
        } catch {}
      }

      if (invoiceMap.size > 0) {
        setInvoices(Array.from(invoiceMap.values()));
      }

      // 2. Fetch from local SQLite WAL API (< 1ms, zero internet needed)
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 6000);
        const bId = businessId || 'local';
        const res = await fetch(`/api/invoices?business_id=${bId}&limit=200`, { signal: ctrl.signal });
        clearTimeout(tid);
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
          list.forEach((inv: any) => {
            if (inv?.id) {
              const existing = invoiceMap.get(inv.id) || {};
              invoiceMap.set(inv.id, {
                ...existing,
                ...inv,
                invoice_no: inv.invoice_number || inv.invoice_no || inv.id,
                total: inv.total_amount ?? inv.total ?? 0,
                party_name: inv.party_name || inv.party?.name || 'Walk-in Customer',
              });
            }
          });
          setInvoices(Array.from(invoiceMap.values()));
        }
      } catch (sqErr) {}

      // 3. Fallback to Supabase if online (non-blocking)
      const isExplicitlyOffline = (typeof navigator !== 'undefined' && !navigator.onLine) ||
        (typeof window !== 'undefined' && (window as any).__noxis_wan_online === false);

      if (!isExplicitlyOffline && businessId && businessId !== 'local') {
        try {
          const timeoutPromise = new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 1500));
          const cloudPromise = supabase
            .from('invoices')
            .select('id, invoice_no, total, party_id, party:parties(id, name)')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })
            .limit(100);

          const { data } = await Promise.race([cloudPromise, timeoutPromise]);
          if (data && Array.isArray(data)) {
            data.forEach((inv: any) => {
              if (inv?.id) {
                const existing = invoiceMap.get(inv.id) || {};
                invoiceMap.set(inv.id, {
                  ...existing,
                  ...inv,
                  invoice_no: inv.invoice_no || inv.id,
                  total: inv.total ?? 0,
                  party_name: inv.party?.name || existing.party_name || 'Customer',
                });
              }
            });
            setInvoices(Array.from(invoiceMap.values()));
          }
        } catch {}
      }

      setLoading(false);
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
      disabled={loading && invoices.length === 0}
      className="w-full bg-[#161A1F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40"
    >
      <option value="">-- Select Invoice --</option>
      {invoices.map((inv) => {
        const invNo = inv.invoice_no || inv.invoice_number || inv.id;
        const customer = inv.party_name || inv.party?.name || 'Customer';
        const totalNum = Number(inv.total ?? inv.total_amount ?? 0);
        return (
          <option key={inv.id} value={inv.id}>
            {invNo} ({customer}) - PKR {totalNum.toLocaleString()}
          </option>
        );
      })}
    </select>
  );
}
