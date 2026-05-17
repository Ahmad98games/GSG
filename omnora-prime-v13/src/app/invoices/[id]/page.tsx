"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Download, MessageCircle, 
  Trash2, Copy, Printer, CheckCircle2,
  AlertTriangle, History,
  ArrowLeft, ChevronRight
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { WhatsAppSender, WhatsAppTemplates } from "@/lib/whatsapp/WhatsAppSender";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";

// --- Types ---

interface BusinessProfile {
  id: string;
  business_name: string | null;
  address: string | null;
  phone: string | null;
  tier?: string;
}

interface Party {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface Invoice {
  id: string;
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
  status: 'paid' | 'overdue' | 'amber';
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
  total_amount: number;
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
  const router = useRouter();
  const { fmt, businessId } = usePersona();
  const { profile } = useBusinessProfile();
  const supabase = createClient();

  const handleWhatsAppSend = () => {
    if (!invoice || !invoice.party?.phone) return;
    
    const message = WhatsAppTemplates.invoice(
      business?.business_name || 'Business',
      invoice.invoice_no,
      fmt(invoice.total),
      invoice.due_date || 'On Receipt',
      business?.phone || ''
    );
    
    WhatsAppSender.send({ phone: invoice.party.phone, message }, profile?.tier || 'starter', supabase);
  };
  
  const invoiceId = params.id as string;

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
                    <p className="text-[9px] uppercase font-black text-gray-400 mb-2">Terms & Conditions</p>
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
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Payment History</h4>
                       <button className="text-[9px] uppercase font-black text-[#C5A059] hover:underline transition-all">Record New</button>
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
                                    <p className="text-[9px] text-gray-500 font-mono">ID: {p.id.substring(0, 8)}</p>
                                 </div>
                              </div>
                              <span className="text-sm font-mono font-black text-emerald-500">{fmt(p.total_amount)}</span>
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
                    <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                       <div className="flex items-center space-x-3">
                          <Download size={14} className="text-gray-500" />
                          <span className="text-[10px] uppercase font-black tracking-widest">Download PDF Copy</span>
                       </div>
                       <ChevronRight size={14} className="text-gray-700 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      onClick={handleWhatsAppSend}
                      disabled={!invoice.party?.phone}
                      className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 transition-all group disabled:opacity-30"
                    >
                       <div className="flex items-center space-x-3">
                          <MessageCircle size={14} className="text-[#25D366]" />
                          <span className="text-[10px] uppercase font-black tracking-widest">Send via WhatsApp</span>
                       </div>
                       {!invoice.party?.phone && <span className="text-[8px] font-bold text-red-500 uppercase">No Phone</span>}
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                       <div className="flex items-center space-x-3">
                          <Copy size={14} className="text-gray-500" />
                          <span className="text-[10px] uppercase font-black tracking-widest">Duplicate Invoice</span>
                       </div>
                       <ChevronRight size={14} className="text-gray-700 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-all group">
                       <div className="flex items-center space-x-3">
                          <Trash2 size={14} className="text-red-500" />
                          <span className="text-[10px] uppercase font-black tracking-widest text-red-500">Void Invoice</span>
                       </div>
                       <span className="text-[8px] font-black text-red-500/50 uppercase tracking-widest group-hover:text-red-500 transition-colors">Requires PIN</span>
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
    </div>
  );
}
