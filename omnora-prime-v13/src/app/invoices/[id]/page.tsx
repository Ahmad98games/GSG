"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { 
  Download, MessageCircle, 
  Trash2, Copy, Printer, CheckCircle2,
  AlertTriangle, History,
  ArrowLeft, ChevronRight
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";

import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { WhatsAppSender, WhatsAppTemplates } from "@/lib/whatsapp/WhatsAppSender";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { humanizeError } from '@/lib/utils/errors';
import { buildInvoiceMessage, buildPaymentReminderMessage, openWhatsApp } from '@/lib/whatsapp/buildMessage';
import { logAction } from '@/lib/audit/logAction';
import { useCurrentUser } from '@/hooks/useCurrentUser';

// --- Types ---

interface BusinessProfile {
  id: string;
  business_name: string | null;
  address: string | null;
  phone: string | null;
  tier?: string;
  currency?: string;
  country_code?: string;
}

interface Party {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface Invoice {
  id: string;
  business_id: string;
  invoice_no: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_pct: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  paid_amount: number;
  balance_due: number;
  status: 'paid' | 'overdue' | 'amber' | 'draft' | 'voided' | 'posted';
  party_id: string;
  party?: Party;
}

interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  line_total: number;
  sku?: {
    name: string;
    sku_code: string;
  };
}

interface Payment {
  id: string;
  payment_date: string;
  amount: number;
  total_amount: number;
  payment_method: string;
  notes: string | null;
}

interface LedgerEntry {
  id: string;
  amount: number;
  entry_type: 'debit' | 'credit';
  status: string;
  account?: {
    name: string;
    account_code: string;
  };
}

// --- Components ---

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'emerald' | 'amber' | 'red' | 'blue' | 'gold';
}

const Badge = ({ children, variant = "default" }: BadgeProps) => {
  const styles: Record<string, string> = {
    default: "bg-white/5 text-gray-400 border border-white/10",
    emerald: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border border-red-500/20",
    blue: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    gold: "bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20"
  };
  return (
    <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px]", styles[variant])}>
      {children}
    </span>
  );
};

// --- Page Component ---

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const router = useRouter();
  const { fmt, businessId } = usePersona();
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const toast = useToast();
  const queryClient = useQueryClient();

  // ── Payment modal state ──
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'cheque'>('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  const { mutate: updateInvoiceStatus } = useOptimisticMutation<any, any>({
    queryKey: ['invoice', invoiceId],
    optimisticUpdate: (current, variables) => {
      if (!current || !current.length) return current;
      return [{
        ...current[0],
        status: variables.status,
        voided_at: variables.status === 'voided' ? new Date().toISOString() : current[0].voided_at
      }];
    },
    mutationFn: async (variables) => {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: variables.status,
          voided_at: variables.status === 'voided' ? new Date().toISOString() : null,
        })
        .eq('id', invoiceId)
        .eq('business_id', profile?.id);
      if (error) throw error;
    },
    successMessage: 'Invoice updated',
    invalidateKeys: [
      ['invoices', profile?.id],
      ['dashboard'],
      ['reports'],
    ],
  });

  const { mutate: mutateRecordPayment } = useOptimisticMutation<any, any>({
    queryKey: ['invoice', invoiceId],
    optimisticUpdate: (current, variables) => {
      if (!current || !current.length) return current;
      const inv = current[0];
      const newPaidAmount = (inv.paid_amount || 0) + variables.amount;
      const newBalanceDue = Math.max(0, (inv.total || 0) - newPaidAmount);
      return [{
        ...inv,
        paid_amount: newPaidAmount,
        balance_due: newBalanceDue,
        status: newBalanceDue <= 0.01 ? 'paid' : 'posted',
      }];
    },
    mutationFn: async (variables) => {
      if (!profile) throw new Error('Business profile not loaded');
      const { error: payError } = await supabase
        .from('payments')
        .insert({
          business_id: profile.id,
          invoice_id: invoiceId,
          party_id: variables.partyId,
          amount: variables.amount,
          payment_method: variables.paymentMethod,
          payment_date: variables.paymentDate,
          notes: variables.notes || null,
          received_by: 'Hub',
        });
      if (payError) throw payError;

      const { error: invError } = await supabase
        .from('invoices')
        .update({
          paid_amount: variables.newPaidAmount,
          balance_due: variables.newBalanceDue,
          status: variables.isFullyPaid ? 'paid' : 'posted',
        })
        .eq('id', invoiceId);
      if (invError) throw invError;

      const { error: ledgerError } = await supabase
        .from('ledger_entries')
        .insert({
          business_id: profile.id,
          invoice_id: invoiceId,
          party_id: variables.partyId,
          entry_date: variables.paymentDate,
          debit_amount: 0,
          credit_amount: variables.amount,
          debit_account: null,
          credit_account: 'accounts_receivable',
          account_code: '1100',
          description: `Payment received — INV ${variables.invoiceNo}`,
          voucher_type: 'payment',
          posted_by: profile.id,
        });
      if (ledgerError) throw ledgerError;

      try {
        const { data: partyRow } = await supabase
          .from('parties')
          .select('current_balance')
          .eq('id', variables.partyId)
          .single();
        if (partyRow) {
          await supabase
            .from('parties')
            .update({ current_balance: (partyRow.current_balance || 0) - variables.amount })
            .eq('id', variables.partyId);
        }
      } catch (balanceErr) {
        console.warn('Party balance update failed — ledger is source of truth', balanceErr);
      }
    },
    successMessage: 'Payment recorded',
    invalidateKeys: [
      ['invoices', profile?.id],
      ['invoice_payments', invoiceId],
      ['parties', profile?.id],
      ['reports', profile?.id],
    ],
  });

  // ── Record Payment handler ──
  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    if (!invoice?.id || !profile?.id) return;

    const balanceDue = invoice.balance_due ?? 0;
    if (amount > balanceDue + 0.01) {
      toast.error(`Payment cannot exceed outstanding balance of ${fmt(balanceDue)}`);
      return;
    }

    setRecordingPayment(true);
    try {
      const newPaidAmount = (invoice.paid_amount || 0) + amount;
      const newBalanceDue = (invoice.total || 0) - newPaidAmount;
      const isFullyPaid = newBalanceDue <= 0.01;

      await mutateRecordPayment({
        table: 'payments',
        operation: 'insert',
        data: {
          business_id: profile?.id,
          invoice_id: invoice.id,
          party_id: invoice.party_id,
          amount,
          payment_method: paymentMethod,
          payment_date: paymentDate,
          notes: paymentNote || null,
          received_by: 'Hub'
        },
        amount,
        partyId: invoice.party_id,
        paymentMethod,
        paymentDate,
        notes: paymentNote,
        invoiceNo: invoice.invoice_no,
        newPaidAmount,
        newBalanceDue,
        isFullyPaid
      });

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNote('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      // Ignored or logged
    } finally {
      setRecordingPayment(false);
    }
  };

  // Queries
  const { data: invoice, isLoading: invoiceLoading } = useQuery<Invoice>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, party:parties(*)')
        .eq('id', invoiceId)
        .single();
      if (error) throw error;
      return data as Invoice;
    }
  });

  const { data: items } = useQuery<InvoiceItem[]>({
    queryKey: ['invoice_items', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*, sku:skus(sku_code, name)')
        .eq('invoice_id', invoiceId);
      if (error) throw error;
      return (data as InvoiceItem[]) || [];
    },
    enabled: !!invoice
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ['invoice_payments', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return (data as Payment[]) || [];
    },
    enabled: !!invoice
  });

  const { data: ledgerEntries } = useQuery<LedgerEntry[]>({
    queryKey: ['invoice_ledger', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('*, account:accounts(name, account_code)')
        .eq('invoice_id', invoiceId)
        .order('posted_at', { ascending: true });
      if (error) return [];
      return (data as LedgerEntry[]) || [];
    },
    enabled: !!invoice
  });

  const { data: business } = useQuery<BusinessProfile>({
    queryKey: ['business_profile', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', businessId)
        .single();
      if (error) throw error;
      return data as BusinessProfile;
    },
    enabled: !!businessId
  });

  const { currentUser } = useCurrentUser();

  // Generate portal URL for this party (or null if none exists yet)
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  // Load existing portal for this party on mount
  useEffect(() => {
    if (!invoice?.party_id) return;
    supabase
      .from('portal_sessions')
      .select('token')
      .eq('party_id', invoice.party_id)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }: any) => {
        if (data?.token) {
          setPortalUrl(
            `${window.location.origin}/portal/${data.token}`
          );
        }
      });
  }, [invoice?.party_id, supabase]);

  const handleSendWhatsApp = async () => {
    if (!invoice || !profile) return;

    // If no portal exists yet, offer to generate one automatically
    let finalPortalUrl = portalUrl;
    if (!finalPortalUrl && invoice.party_id) {
      const generate = window.confirm(
        `Generate a portal link for ${invoice.party?.name || 'this customer'} ` +
        `so they can view their account online? ` +
        `The link will be included in the WhatsApp message.`
      );
      if (generate) {
        try {
          // Generate a secure client-side nonce (32 hex characters)
          const array = new Uint8Array(16);
          window.crypto.getRandomValues(array);
          const nonce = Array.from(array, dec => dec.toString(16).padStart(2, '0')).join('');

          const res = await fetch(
            `${window.location.origin}/api/portal/generate`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                partyId: invoice.party_id,
                expiryDays: 30,
                nonce,
              }),
            }
          );
          const data = await res.json();
          if (data.success) {
            finalPortalUrl = data.url;
            setPortalUrl(data.url);
          }
        } catch {
          // Non-fatal — send without portal
        }
      }
    }

    const message = buildInvoiceMessage({
      businessName: business?.business_name || profile.business_name || 'Business',
      partyName: invoice.party?.name || '',
      partyPhone: invoice.party?.phone,
      invoiceNumber: invoice.invoice_no,
      invoiceDate: invoice.issue_date || new Date().toLocaleDateString('en-PK'),
      dueDate: invoice.due_date
        ? new Date(invoice.due_date).toLocaleDateString('en-PK')
        : null,
      subtotal: invoice.subtotal || 0,
      taxAmount: invoice.tax_amount || 0,
      totalAmount: invoice.total || 0,
      balanceDue: invoice.balance_due || 0,
      currency: business?.currency || profile.currency || 'PKR',
      portalUrl: finalPortalUrl,
      countryCode: business?.country_code || profile.country_code || 'PK',
    });

    const sent = openWhatsApp(
      invoice.party?.phone,
      message,
      business?.country_code || profile.country_code || 'PK'
    );

    if (!sent) {
      toast.error(
        'Missing Phone',
        'No phone number for this customer. Add their WhatsApp number in Parties first.'
      );
    } else {
      toast.success('WhatsApp Opened', 'WhatsApp opened with formatted invoice summary');
      // Log to audit
      logAction('invoice.whatsapp_sent', {
        entityType: 'invoice',
        entityId: invoice.id,
        entityLabel: invoice.invoice_no,
        businessId: profile.id,
        userName: currentUser?.name,
        userRole: currentUser?.role,
      });
    }
  };

  // Payment reminder button (separate action)
  const handleSendReminder = () => {
    if (!invoice || !profile) return;
    if (!invoice.balance_due || invoice.balance_due <= 0) {
      toast.info('Info', 'This invoice is fully paid');
      return;
    }

    const message = buildPaymentReminderMessage({
      businessName: business?.business_name || profile.business_name || 'Business',
      partyName: invoice.party?.name || '',
      invoiceNumber: invoice.invoice_no,
      balanceDue: invoice.balance_due,
      dueDate: invoice.due_date
        ? new Date(invoice.due_date).toLocaleDateString('en-PK')
        : 'ASAP',
      currency: business?.currency || profile.currency || 'PKR',
      portalUrl,
    });

    const sent = openWhatsApp(
      invoice.party?.phone,
      message,
      business?.country_code || profile.country_code || 'PK'
    );

    if (sent) {
      toast.success('Success', 'Reminder message loaded into WhatsApp');
      // Log to audit
      logAction('invoice.whatsapp_sent', {
        entityType: 'invoice',
        entityId: invoice.id,
        entityLabel: `Reminder: ${invoice.invoice_no}`,
        businessId: profile.id,
        userName: currentUser?.name,
        userRole: currentUser?.role,
      });
    } else {
      toast.error(
        'Missing Phone',
        'No phone number for this customer. Add their WhatsApp number in Parties first.'
      );
    }
  };

  if (invoiceLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Compiling Fiscal Statement...
    </div>
  );

  if (!invoice) return (
    <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center space-y-4">
      <AlertTriangle className="text-red-500" size={48} />
      <h1 className="text-white uppercase font-black tracking-widest">Invoice Not Found</h1>
      <button onClick={() => router.back()} className="text-[10px] text-gray-500 hover:text-white uppercase font-black tracking-widest border border-white/10 px-6 py-2 transition-all">Back to Invoices</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col print:pl-0">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40 print:hidden">
           <button onClick={() => router.back()} className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mr-8 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Sales Register</span>
           </button>
           <div className="h-4 w-px bg-white/10 mx-4" />
           <h1 className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-400">Statement of Account: {invoice.invoice_no}</h1>
           
           <div className="ml-auto flex items-center space-x-3">
              <button onClick={() => window.print()} className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 text-[10px] uppercase font-black tracking-widest border border-white/5 transition-all">
                 <Printer size={12} />
                 <span>Print</span>
              </button>
           </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row gap-8 print:p-0 print:max-w-none">
           {/* LEFT: INVOICE DOCUMENT (60%) */}
           <section className="flex-1 lg:max-w-[1000px] print:w-full">
              <div className="bg-white text-black min-h-[1100px] p-12 shadow-2xl shadow-black/50 flex flex-col print:shadow-none print:p-8">
                 {/* Header */}
                 <div className="flex justify-between items-start mb-16">
                    <div className="space-y-4">
                       <div className="w-16 h-16 bg-black flex items-center justify-center">
                          <span className="text-white font-black text-2xl">NX</span>
                       </div>
                       <div>
                          <h2 className="text-xl font-black uppercase tracking-tighter">{business?.business_name || 'Noxis Hub'}</h2>
                          <p className="text-[10px] text-gray-500 font-medium max-w-[200px] leading-tight mt-1">
                             {business?.address || 'Industrial Zone Phase II, Karachi, Pakistan'}
                          </p>
                       </div>
                    </div>
                    <div className="text-right">
                       <h1 className="text-5xl font-black uppercase tracking-tighter text-gray-200 mb-4">INVOICE</h1>
                       <div className="space-y-1">
                          <p className="text-[10px] uppercase font-black text-gray-400">Invoice Number</p>
                          <p className="text-lg font-mono font-black">{invoice.invoice_no}</p>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-12 mb-16">
                    <div className="space-y-4">
                       <p className="text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 pb-2">Bill To</p>
                       <div>
                          <h3 className="text-sm font-black uppercase">{invoice.party?.name}</h3>
                          <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                             {invoice.party?.address || 'No address provided'}
                          </p>
                          <p className="text-[11px] font-bold text-black mt-2">TEL: {invoice.party?.phone}</p>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <p className="text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 pb-2">Reference Details</p>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <p className="text-[9px] uppercase font-bold text-gray-400">Issue Date</p>
                             <p className="text-[11px] font-black">{invoice.issue_date}</p>
                          </div>
                          <div>
                             <p className="text-[9px] uppercase font-bold text-gray-400">Due Date</p>
                             <p className="text-[11px] font-black">{invoice.due_date || 'On Receipt'}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Line Items Table */}
                 <div className="flex-1">
                    <table className="w-full border-collapse">
                       <thead>
                          <tr className="border-y-2 border-black text-[9px] uppercase font-black tracking-widest text-left">
                             <th className="py-3 px-2">Description</th>
                             <th className="py-3 px-2 text-right">Qty</th>
                             <th className="py-3 px-2">Unit</th>
                             <th className="py-3 px-2 text-right">Rate</th>
                             <th className="py-3 px-2 text-right">Amount</th>
                          </tr>
                       </thead>
                       <tbody className="text-[11px]">
                          {items?.map((item: InvoiceItem) => (
                            <tr key={item.id} className="border-b border-gray-100 group">
                               <td className="py-4 px-2">
                                  <p className="font-bold uppercase">{item.sku?.name || item.description}</p>
                                  <p className="text-[9px] text-gray-400 mt-0.5 font-mono">{item.sku?.sku_code}</p>
                               </td>
                               <td className="py-4 px-2 text-right font-mono font-bold">{item.qty}</td>
                               <td className="py-4 px-2 font-medium uppercase text-gray-500">{item.unit}</td>
                               <td className="py-4 px-2 text-right font-mono">{fmt(item.unit_price)}</td>
                               <td className="py-4 px-2 text-right font-mono font-black">{fmt(item.line_total)}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 {/* Totals */}
                 <div className="mt-12 flex justify-end">
                    <div className="w-[300px] space-y-3">
                       <div className="flex justify-between text-[11px]">
                          <span className="uppercase font-bold text-gray-400 tracking-widest">Subtotal</span>
                          <span className="font-mono font-bold">{fmt(invoice.subtotal)}</span>
                       </div>
                       {invoice.tax_amount > 0 && (
                         <div className="flex justify-between text-[11px]">
                            <span className="uppercase font-bold text-gray-400 tracking-widest">Tax ({invoice.tax_pct}%)</span>
                            <span className="font-mono font-bold">{fmt(invoice.tax_amount)}</span>
                         </div>
                       )}
                       {invoice.discount_amount > 0 && (
                         <div className="flex justify-between text-[11px]">
                            <span className="uppercase font-bold text-gray-400 tracking-widest">Discount</span>
                            <span className="font-mono font-bold text-red-600">-{fmt(invoice.discount_amount)}</span>
                         </div>
                       )}
                       <div className="flex justify-between pt-3 border-t-2 border-black">
                          <span className="text-xs uppercase font-black tracking-widest">Total Payable</span>
                          <span className="text-lg font-mono font-black">{fmt(invoice.total)}</span>
                       </div>
                    </div>
                 </div>

                 <div className="mt-16 pt-8 border-t border-gray-100">
                    <p className="text-[9px] uppercase font-black text-gray-400 mb-2">Amount in Words</p>
                    <p className="text-[11px] font-bold italic uppercase">Zero point zero zero only</p>
                 </div>

                 <div className="mt-8">
                    <p className="text-[9px] uppercase font-black text-gray-400 mb-2">Terms &amp; Conditions</p>
                    <p className="text-[10px] text-gray-600 leading-relaxed max-w-[500px]">
                       1. Payments are due within the agreed credit period. <br/>
                       2. Late payments may incur interest charges of 2.5% per month. <br/>
                       3. Goods once sold are only returnable under quality manufacturing defects.
                    </p>
                 </div>

                 <div className="mt-auto pt-16 flex justify-between items-end border-t-2 border-black/5">
                    <div className="space-y-4">
                       <div className="h-px w-48 bg-black/10" />
                       <p className="text-[9px] uppercase font-black">Authorized Signatory</p>
                    </div>
                    <p className="text-[8px] font-mono text-gray-400">Generated via Noxis v13.0 Industrial Core</p>
                 </div>
              </div>
           </section>

           {/* RIGHT: MANAGEMENT PANEL (40%) */}
           <aside className="w-full lg:w-[450px] space-y-8 print:hidden">
              <div className="bg-[#1A1D21] border border-white/5 p-8 space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">Management Panel</h3>
                    <Badge variant={
                      invoice.status === 'paid' ? 'emerald' : 
                      invoice.status === 'overdue' ? 'red' : 'amber'
                    }>{invoice.status}</Badge>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm">
                       <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Invoice Total</p>
                       <h4 className="text-2xl font-mono font-black text-[#C5A059]">{fmt(invoice.total)}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-sm">
                          <p className="text-[9px] uppercase font-black text-emerald-500/50 tracking-widest mb-1">Total Paid</p>
                          <h4 className="text-lg font-mono font-black text-emerald-500">{fmt(invoice.paid_amount)}</h4>
                       </div>
                       <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-sm">
                          <p className="text-[9px] uppercase font-black text-red-500/50 tracking-widest mb-1">Outstanding</p>
                          <h4 className="text-lg font-mono font-black text-red-500">{fmt(invoice.balance_due)}</h4>
                       </div>
                    </div>
                    {invoice.balance_due > 0 && (
                      <div className="p-4 bg-[#C5A059]/5 border border-[#C5A059]/20 rounded-sm space-y-3 relative overflow-hidden group">
                         <div className="absolute top-0 left-0 w-1 h-full bg-[#C5A059]" />
                         <div className="flex items-center space-x-2 text-[#C5A059]">
                            <AlertTriangle size={14} className="animate-pulse" />
                            <span className="text-[9px] uppercase font-black tracking-widest">Verbal Payment Promise</span>
                         </div>
                         <p className="text-[11px] text-gray-400 leading-normal">
                            Has the customer verbally committed to a collection date? Log it in the promises registry.
                         </p>
                         <button 
                            onClick={() => router.push(`/promises?partyId=${invoice.party_id}`)}
                            className="w-full py-2 bg-[#C5A059] text-black text-[9px] font-black uppercase tracking-widest text-center hover:bg-[#C5A059]/90 transition-all rounded-[2px]"
                         >
                            Record Promise (PKR {invoice.balance_due})
                         </button>
                      </div>
                    )}
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Payment History</h4>
                       <button 
                          onClick={() => setShowPaymentModal(true)}
                          className="text-[9px] uppercase font-black text-[#C5A059] hover:underline transition-all"
                       >
                          Record New
                       </button>
                    </div>
                    {payments && payments.length > 0 ? (
                      <div className="space-y-2">
                         {payments.map((p: Payment) => (
                           <div key={p.id} className="p-4 bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                              <div className="flex items-center space-x-3">
                                 <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-sm">
                                    <CheckCircle2 size={12} />
                                 </div>
                                 <div>
                                    <p className="text-[11px] font-bold text-white">{p.payment_date}</p>
                                    <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wide">
                                      {p.payment_method || 'cash'}{p.notes ? ` · ${p.notes}` : ''}
                                    </p>
                                 </div>
                              </div>
                              <span className="text-sm font-mono font-black text-emerald-500">{fmt(p.amount ?? p.total_amount)}</span>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-sm">
                         <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest">No payments recorded</p>
                      </div>
                    )}
                 </div>

                  <div className="space-y-3 pt-8 border-t border-white/5">
                     <button
                       onClick={() => window.print()}
                       className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                     >
                        <div className="flex items-center space-x-3">
                           <Download size={14} className="text-gray-500" />
                           <span className="text-[10px] uppercase font-black tracking-widest">Download PDF Copy</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-700 group-hover:translate-x-1 transition-transform" />
                     </button>
                     <button 
                       onClick={handleSendWhatsApp}
                       className="w-full flex items-center justify-between p-4 bg-[#25D366]/5 hover:bg-[#25D366]/10 border border-[#25D366]/10 transition-all group text-[#25D366]"
                     >
                        <div className="flex items-center space-x-3">
                           <MessageCircle size={14} className="text-[#25D366]" />
                           <span className="text-[10px] uppercase font-black tracking-widest font-bold">Send Invoice via WhatsApp</span>
                        </div>
                        <ChevronRight size={14} className="text-[#25D366]/40 group-hover:translate-x-1 transition-transform" />
                     </button>
                     {invoice.balance_due > 0 && (
                       <button 
                         onClick={handleSendReminder}
                         className="w-full flex items-center justify-between p-4 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 transition-all group text-amber-400"
                       >
                          <div className="flex items-center space-x-3">
                             <MessageCircle size={14} className="text-amber-400" />
                             <span className="text-[10px] uppercase font-black tracking-widest font-bold">Send Payment Reminder</span>
                          </div>
                          <ChevronRight size={14} className="text-amber-400/40 group-hover:translate-x-1 transition-transform" />
                       </button>
                     )}
                     <button
                       onClick={async () => {
                         const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                         const newInvoiceNo = `${invoice.invoice_no}-DUP-${randomSuffix}`;
                         
                         const { data, error } = await supabase
                           .from('invoices')
                           .insert({
                             business_id: (invoice as any).business_id || businessId,
                             party_id: invoice.party_id,
                             invoice_no: newInvoiceNo,
                             status: 'draft',
                             issue_date: new Date().toISOString().split('T')[0],
                             due_date: invoice.due_date,
                             subtotal: invoice.subtotal,
                             discount_pct: (invoice as any).discount_pct || 0,
                             discount_amount: invoice.discount_amount,
                             tax_pct: invoice.tax_pct,
                             tax_amount: invoice.tax_amount,
                             total: invoice.total,
                             notes: (invoice as any).notes,
                           })
                           .select()
                           .single();

                         if (error) {
                           toast.error('Invoice duplication failed', humanizeError(error, 'duplicate invoice'));
                           return;
                         }

                         if (data && items && items.length > 0) {
                           const itemInserts = items.map(item => ({
                             invoice_id: data.id,
                             sku_id: (item as any).sku_id || null,
                             description: item.description,
                             qty: item.qty,
                             unit: item.unit,
                             unit_price: item.unit_price,
                           }));
                           
                           const { error: itemsError } = await supabase
                             .from('invoice_items')
                             .insert(itemInserts);

                           if (itemsError) {
                             toast.error('Partial duplicate failure', humanizeError(itemsError, 'copy invoice items'));
                             return;
                           }
                         }

                         if (data) {
                           toast.success('Invoice duplicated');
                           router.push(`/invoices/${data.id}`);
                         }
                       }}
                       className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                     >
                        <div className="flex items-center space-x-3">
                           <Copy size={14} className="text-gray-500" />
                           <span className="text-[10px] uppercase font-black tracking-widest">Duplicate Invoice</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-700 group-hover:translate-x-1 transition-transform" />
                     </button>
                     {invoice.status === 'draft' && (
                        <button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to permanently delete this draft invoice?')) return;
                            
                            try {
                              const backupInvoice = { ...invoice };
                              const backupItems = [...(items || [])];
                              
                              const { error } = await supabase
                                .from('invoices')
                                .delete()
                                .eq('id', invoice.id);
                                
                              if (!error) {
                                import('@/stores/undoStore').then(({ useUndoStore }) => {
                                  useUndoStore.getState().pushAction({
                                    description: `Deleted Invoice ${backupInvoice.invoice_no}`,
                                    undo: async () => {
                                      const supabaseClient = createClient();
                                      const { data: newInv, error: invErr } = await supabaseClient
                                        .from('invoices')
                                        .insert({
                                          id: backupInvoice.id,
                                          business_id: backupInvoice.business_id,
                                          party_id: backupInvoice.party_id,
                                          invoice_no: backupInvoice.invoice_no,
                                          status: backupInvoice.status,
                                          issue_date: backupInvoice.issue_date,
                                          due_date: backupInvoice.due_date,
                                          subtotal: backupInvoice.subtotal,
                                          discount_pct: (backupInvoice as any).discount_pct || 0,
                                          discount_amount: backupInvoice.discount_amount,
                                          tax_pct: backupInvoice.tax_pct,
                                          tax_amount: backupInvoice.tax_amount,
                                          total: backupInvoice.total,
                                          notes: (backupInvoice as any).notes || null,
                                        })
                                        .select()
                                        .single();
                                        
                                      if (!invErr && newInv && backupItems.length > 0) {
                                        await supabaseClient.from('invoice_items').insert(
                                          backupItems.map((item: any) => ({
                                            invoice_id: newInv.id,
                                            sku_id: item.sku_id || null,
                                            description: item.description,
                                            qty: item.qty,
                                            unit: item.unit,
                                            unit_price: item.unit_price,
                                          }))
                                        );
                                      }
                                    }
                                  });
                                });

                                toast.success('Invoice deleted', { message: 'Press Ctrl+Z to undo' });
                                router.push('/invoices');
                              } else {
                                toast.error('Delete invoice failed', humanizeError(error, 'delete invoice'));
                              }
                            } catch (err) {
                              toast.error('Delete invoice failed', humanizeError(err, 'delete invoice'));
                            }
                          }}
                          className="w-full flex items-center justify-between p-4 bg-red-950/20 hover:bg-red-950/30 border border-red-500/20 transition-all group"
                        >
                           <div className="flex items-center space-x-3">
                              <Trash2 size={14} className="text-red-400" />
                              <span className="text-[10px] uppercase font-black tracking-widest text-red-400">Delete Draft</span>
                           </div>
                           <ChevronRight size={14} className="text-red-500 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                     <button
                        onClick={async () => {
                          if (!confirm('Void this invoice? This cannot be undone.')) return;
                          
                          await updateInvoiceStatus({
                            table: 'invoices',
                            operation: 'update',
                            matchColumn: 'id',
                            matchValue: invoice.id,
                            data: {
                              status: 'voided',
                              voided_at: new Date().toISOString(),
                            },
                            status: 'voided'
                          });
                        }}
                       className="w-full flex items-center justify-between p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-all group"
                     >
                        <div className="flex items-center space-x-3">
                           <Trash2 size={14} className="text-red-500" />
                           <span className="text-[10px] uppercase font-black tracking-widest text-red-500">Void Invoice</span>
                        </div>
                        <span className="text-[8px] font-black text-red-500/50 uppercase tracking-widest group-hover:text-red-500 transition-colors">Confirm Void</span>
                     </button>
                  </div>

                 <div className="space-y-4 pt-8 border-t border-white/5">
                    <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest flex items-center space-x-2">
                       <History size={12} />
                       <span>Ledger Entries (Journal)</span>
                    </h4>
                    <div className="space-y-2">
                       {ledgerEntries && ledgerEntries.map((entry: LedgerEntry) => (
                         <div key={entry.id} className="p-3 bg-white/[0.01] border border-white/[0.03] flex items-center justify-between group hover:border-white/10 transition-all">
                            <div className="flex-1">
                               <p className="text-[10px] font-bold text-gray-300 uppercase">{entry.account?.name}</p>
                               <p className="text-[8px] text-gray-600 font-mono tracking-tighter uppercase">{entry.account?.account_code} • {entry.entry_type}</p>
                            </div>
                            <div className="text-right">
                               <p className={cn(
                                 "text-[11px] font-mono font-black",
                                 entry.entry_type === 'debit' ? "text-emerald-400" : "text-[#C5A059]"
                               )}>
                                 {entry.entry_type === 'debit' ? `DR ${fmt(entry.amount)}` : `CR ${fmt(entry.amount)}`}
                               </p>
                               <p className="text-[8px] text-gray-700 font-black uppercase tracking-tighter mt-0.5">{entry.status}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </aside>
        </div>
      </main>

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#0F1114] border border-white/10 rounded-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Record Payment</h2>
                <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                  {invoice?.invoice_no} · Outstanding: {fmt(invoice?.balance_due ?? 0)}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-600 hover:text-gray-200 text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Amount */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                  Amount Received *
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  min="0"
                  step="0.01"
                  className="w-full bg-[#161A1F] border border-white/8 text-white text-lg font-mono px-3 py-2.5 outline-none focus:border-[#60A5FA]/50 transition-colors"
                />
              </div>

              {/* Method */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'bank', 'cheque'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={cn(
                        'py-2 text-[10px] font-black uppercase tracking-widest border transition-all',
                        paymentMethod === m
                          ? 'border-[#60A5FA]/50 bg-[#60A5FA]/10 text-[#60A5FA]'
                          : 'border-white/8 text-gray-500 hover:border-white/20 hover:text-gray-300'
                      )}
                    >
                      {m === 'bank' ? 'Bank' : m === 'cheque' ? 'Cheque' : 'Cash'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full bg-[#161A1F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/50 transition-colors"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                  Note <span className="normal-case font-normal text-gray-700">(optional)</span>
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  placeholder="e.g. Cheque #12345"
                  className="w-full bg-[#161A1F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/50 transition-colors"
                />
              </div>

              {/* Balance preview */}
              {paymentAmount && parseFloat(paymentAmount) > 0 && (
                <div className="bg-white/[0.02] border border-white/5 px-4 py-3 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 uppercase font-bold tracking-widest">Applying</span>
                    <span className="font-mono text-white">{fmt(parseFloat(paymentAmount) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 uppercase font-bold tracking-widest">Remaining after</span>
                    <span className={cn(
                      'font-mono font-black',
                      (invoice?.balance_due ?? 0) - (parseFloat(paymentAmount) || 0) <= 0.01
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    )}>
                      {fmt(Math.max(0, (invoice?.balance_due ?? 0) - (parseFloat(paymentAmount) || 0)))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/8 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest border border-white/10 text-gray-500 hover:border-white/25 hover:text-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={recordingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest bg-[#60A5FA] text-black hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {recordingPayment ? 'Recording…' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
