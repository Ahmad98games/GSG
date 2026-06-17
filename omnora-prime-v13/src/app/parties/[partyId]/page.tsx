"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Phone, Mail, MapPin, 
  TrendingUp, History as HistoryIcon,
  FileText, ShoppingCart, Award,
  ArrowLeft, Edit3, Plus,
  AlertTriangle, ExternalLink, ArrowUpRight, ArrowDownLeft,
  DollarSign, Activity, Link2, MessageCircle, Copy,
  CheckCircle2, Banknote, CreditCard
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { sendWhatsAppAlert } from "@/lib/whatsapp/alertEngine";
import { formatCurrency } from "@/lib/currency/currencyEngine";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";

import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Decimal from "decimal.js";
import { FeatureGate } from "@/components/ui/FeatureGate";

// --- Types ---

interface Party {
  id: string;
  name: string;
  party_type: 'customer' | 'supplier' | 'both';
  phone: string | null;
  email: string | null;
  address: string | null;
  current_balance: number;
  credit_limit: number;
  credit_days: number;
}

interface Invoice {
  id: string;
  invoice_no: string;
  issue_date: string;
  total: number;
  balance_due: number;
  status: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  order_date: string;
  total: number;
  status: string;
  expected_by: string | null;
}

interface Payment {
  id: string;
  payment_date: string;
  total_amount: number;
}

interface Reliability {
  score: number;
  status: string;
  notes: string;
}

interface HistoryItem {
  date: string;
  type: string;
  ref: string;
  amount: number;
  status: string;
  id: string;
  color: 'blue' | 'purple' | 'emerald' | 'default';
  balanceAfter?: number;
}

// --- Components ---

interface InfoRowProps {
  label: string;
  value: string | null;
  icon: React.ComponentType<{ size?: number | string }>;
}

const InfoRow = ({ label, value, icon: Icon }: InfoRowProps) => (
  <div className="flex items-start space-x-3 py-3 border-b border-white/[0.03]">
    <div className="mt-0.5 text-gray-500">
      <Icon size={14} />
    </div>
    <div className="flex-1">
      <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest">{label}</p>
      <p className="text-xs font-semibold text-white mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'gold';
}

const Badge = ({ children, variant = "default" }: BadgeProps) => {
  const styles: Record<string, string> = {
    default: "bg-white/5 text-gray-400 border border-white/10",
    emerald: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border border-red-500/20",
    blue: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
    gold: "bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20"
  };
  return (
    <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px]", styles[variant])}>
      {children}
    </span>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number | string }>;
  label: string;
}

const TabButton = ({ active, onClick, icon: Icon, label }: TabButtonProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center space-x-2 px-6 py-4 border-b-2 transition-all text-[10px] uppercase font-black tracking-widest whitespace-nowrap",
      active 
        ? "border-[#C5A059] text-white bg-white/5" 
        : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
    )}
  >
    <Icon size={14} />
    <span>{label}</span>
  </button>
);

// --- Page Component ---

export default function PartyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { fmt, businessId } = usePersona();
  const supabase = createClient();
  const { profile } = useBusinessProfile();
  const queryClient = useQueryClient();

  const handleWhatsAppReminder = (party: Party) => {
    const phone = formatPhoneForWhatsApp(party.phone || "")
    
    const balance = party.current_balance
    const isOwed = balance > 0 // They owe us
    
    let message = ''
    if (isOwed) {
      message = `Assalam o Alaikum ${party.name},\n\nThis is a friendly reminder that you have an outstanding balance of ${formatCurrency(balance, (profile?.currency || 'PKR') as any)} with ${profile?.business_name}.\n\nPlease arrange payment at your earliest convenience. Thank you.\n\n🔒 Sent via Noxis Hub | Omnora Labs`
    } else {
      message = `Assalam o Alaikum ${party.name},\n\nPlease contact us regarding your account with ${profile?.business_name}.\n\nThank you.\n\n🔒 Noxis Hub | Omnora Labs`
    }
    
    const encoded = encodeURIComponent(message)
    const url = `https://wa.me/${phone}?text=${encoded}`
    window.open(url, '_blank')
  }

  function formatPhoneForWhatsApp(phone: string): string {
    const digits = (phone || '').replace(/[^0-9]/g, '')
    if (digits.startsWith('03') &&
        digits.length === 11) {
      return '92' + digits.slice(1)
    }
    if (digits.startsWith('0') &&
        digits.length === 11) {
      return '92' + digits.slice(1)
    }
    return digits
  }
  
  const partyId = params.partyId as string;
  const [activeTab, setActiveTab] = useState("history");
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Queries
  const { data: party, isLoading: partyLoading } = useQuery<Party>({
    queryKey: ['party', partyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('id', partyId)
        .single();
      if (error) throw error;
      return data as Party;
    }
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ['party_invoices', partyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('party_id', partyId)
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return (data as Invoice[]) || [];
    },
    enabled: !!party
  });

  const { data: purchaseOrders } = useQuery<PurchaseOrder[]>({
    queryKey: ['party_pos', partyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', partyId)
        .order('order_date', { ascending: false });
      if (error) throw error;
      return (data as PurchaseOrder[]) || [];
    },
    enabled: !!party
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ['party_payments', partyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('party_id', partyId)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return (data as Payment[]) || [];
    },
    enabled: !!party
  });

  const { data: reliability } = useQuery<Reliability>({
    queryKey: ['party_reliability', partyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_party_reliability', { p_party_id: partyId });
      if (error) return { score: 85, status: 'Reliable', notes: 'Based on historical transaction data.' }; // Fallback
      return data as Reliability;
    },
    enabled: !!party
  });

  const { data: supplierPaymentsData } = useQuery({
    queryKey: ['party_supplier_payments', partyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_payments')
        .select('*, po:purchase_orders(po_number)')
        .eq('party_id', partyId)
        .order('payment_date', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!party && (party.party_type === 'supplier' || party.party_type === 'both')
  });

  const { data: commitments = [] } = useQuery<any[]>({
    queryKey: ['party_commitments', partyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_promises')
        .select('*')
        .eq('party_id', partyId)
        .order('promise_date', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!party
  });

  // Portal link generation
  const generatePortalLink = async () => {
    if (!businessId) return;
    setPortalLoading(true);
    try {
      const res = await fetch('/api/portal/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partyId, businessId }),
      });
      const data = await res.json();
      if (data.url) setPortalLink(data.url);
      else alert('Failed to generate link');
    } catch { alert('Failed to generate portal link'); }
    finally { setPortalLoading(false); }
  };

  const copyLink = () => {
    if (portalLink) {
      navigator.clipboard.writeText(portalLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    if (!portalLink || !party) return;
    const msg = `Hello ${party.name},\n\nYou can view your account statement and invoices here:\n${portalLink}\n\nThis link is valid for 90 days.`;
    sendWhatsAppAlert(party.phone || '', msg);
  };

  // Logic
  const creditUtilization = useMemo(() => {
    if (!party?.credit_limit || party.credit_limit === 0) return 0;
    const balance = new Decimal(party.current_balance || 0);
    const limit = new Decimal(party.credit_limit);
    return Math.min(balance.dividedBy(limit).times(100).toNumber(), 100);
  }, [party]);

  const combinedHistory = useMemo(() => {
    const history: HistoryItem[] = [];
    
    invoices?.forEach((inv: Invoice) => history.push({
      date: inv.issue_date,
      type: 'Invoice',
      ref: inv.invoice_no,
      amount: inv.total,
      status: inv.status,
      id: inv.id,
      color: 'blue'
    }));

    purchaseOrders?.forEach((po: PurchaseOrder) => history.push({
      date: po.order_date,
      type: 'Purchase Order',
      ref: po.po_number,
      amount: -po.total,
      status: po.status,
      id: po.id,
      color: 'purple'
    }));

    payments?.forEach((pay: Payment) => history.push({
      date: pay.payment_date,
      type: 'Payment',
      ref: `PAY-${pay.id.substring(0, 8)}`,
      amount: pay.total_amount,
      status: 'Posted',
      id: pay.id,
      color: 'emerald'
    }));

    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let running = new Decimal(0);
    const historyWithBalance = history.map(item => {
      running = running.plus(item.amount);
      return { ...item, balanceAfter: running.toNumber() };
    });

    return historyWithBalance.reverse();
  }, [invoices, purchaseOrders, payments]);

  if (partyLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Retrieving Financial Identity...
    </div>
  );

  if (!party) return (
    <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center space-y-4">
      <Building2 className="text-red-500" size={48} />
      <h1 className="text-white uppercase font-black tracking-widest">Party Not Found</h1>
      <button onClick={() => router.back()} className="text-[10px] text-gray-500 hover:text-white uppercase font-black tracking-widest border border-white/10 px-6 py-2 transition-all">Return to Ledger</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <button onClick={() => router.back()} className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mr-8 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Accounts Ledger</span>
           </button>
           <div className="h-4 w-px bg-white/10 mx-4" />
           <h1 className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-400">Party Identity: {party.name}</h1>
           
           {party.phone && (
              <div className="ml-auto flex items-center gap-2">
                 <a
                    href={`tel:${party.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                 >
                    <Phone size={12} />
                    Call
                 </a>
                 <button
                    onClick={() => handleWhatsAppReminder(party)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                 >
                    <MessageCircle size={12} />
                    WhatsApp Reminder
                 </button>
              </div>
           )}
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row gap-8">
           {/* LEFT PANEL (1/3) */}
           <aside className="w-full lg:w-[400px] space-y-8">
              <div className="bg-[#1A1D21] border border-white/5 p-8 flex flex-col">
                 <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                       <Building2 size={24} />
                    </div>
                    <Badge variant="gold">{party.party_type}</Badge>
                 </div>

                 <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{party.name}</h2>
                 
                 <div className="w-full mt-8 space-y-1">
                    <InfoRow label="Phone" value={party.phone} icon={Phone} />
                    <InfoRow label="Email" value={party.email || 'no-email@noxis.io'} icon={Mail} />
                    <InfoRow label="Address" value={party.address} icon={MapPin} />
                 </div>

                 <div className="w-full mt-8 p-6 bg-white/[0.02] border border-white/5 rounded-sm flex flex-col items-center text-center">
                    <p className="text-[9px] uppercase font-black text-gray-500 tracking-[0.2em] mb-3">Current Net Balance</p>
                    <h3 className={cn(
                      "text-3xl font-mono font-black",
                      new Decimal(party.current_balance || 0).gte(0) ? "text-emerald-500" : "text-red-500"
                    )}>
                      {fmt(party.current_balance || 0)}
                    </h3>
                    <p className="text-[9px] uppercase font-bold text-gray-600 mt-2">
                       {new Decimal(party.current_balance || 0).gte(0) ? "RECEIVABLE FROM PARTY" : "PAYABLE TO PARTY"}
                    </p>
                 </div>

                 {(party.party_type === 'customer' || party.party_type === 'both') && (
                   <div className="w-full mt-8 space-y-4">
                      <div className="flex justify-between items-center">
                         <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Credit Utilization</p>
                         <span className="text-[10px] font-mono font-bold text-white">{creditUtilization.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${creditUtilization}%` }}
                           className={cn(
                             "h-full transition-all duration-1000",
                             creditUtilization > 90 ? "bg-red-500" : creditUtilization > 70 ? "bg-amber-500" : "bg-[#C5A059]"
                           )}
                         />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-gray-700 uppercase">
                         <span>Limit: {fmt(party.credit_limit)}</span>
                         <span>Days: {party.credit_days}</span>
                      </div>
                   </div>
                 )}

                 <div className="w-full mt-10 grid grid-cols-2 gap-3">
                    {(party.party_type === 'customer' || party.party_type === 'both') && (
                      <button
                        onClick={() => router.push(`/invoices/new?customerId=${party.id}&customerName=${encodeURIComponent(party.name)}`)}
                        className="flex items-center justify-center space-x-2 bg-[#0070F3] hover:brightness-110 p-3 text-[10px] uppercase font-black tracking-widest text-white transition-all shadow-lg shadow-blue-500/10">
                         <Plus size={12} />
                         <span>New Invoice</span>
                      </button>
                    )}
                    {(party.party_type === 'supplier' || party.party_type === 'both') && (
                      <button
                        onClick={() => router.push(`/purchase/new?supplier=${party.id}&supplierName=${encodeURIComponent(party.name)}`)}
                        className="flex items-center justify-center space-x-2 bg-purple-600 hover:brightness-110 p-3 text-[10px] uppercase font-black tracking-widest text-white transition-all shadow-lg shadow-purple-500/10">
                         <ShoppingCart size={12} />
                         <span>New PO</span>
                      </button>
                    )}
                    <button
                      onClick={() => setPaymentModal(true)}
                      className="flex items-center justify-center space-x-2 bg-emerald-500 hover:brightness-110 p-3 text-[10px] uppercase font-black tracking-widest text-black transition-all shadow-lg shadow-emerald-500/10 col-span-2">
                       <DollarSign size={12} />
                       <span>Record Payment</span>
                    </button>
                    
                    {/* Portal Link Generation */}
                    {(party.party_type === 'customer' || party.party_type === 'both') && (
                      <FeatureGate feature="customerPortal">
                        <button
                          onClick={generatePortalLink}
                          disabled={portalLoading}
                          className="flex items-center justify-center space-x-2 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/20 p-3 text-[10px] uppercase font-black tracking-widest text-[#C5A059] transition-all col-span-2"
                        >
                          <Link2 size={12} />
                          <span>{portalLoading ? 'Generating...' : 'Generate Portal Link'}</span>
                        </button>
                      </FeatureGate>
                    )}
                    {(party.party_type === 'customer' || party.party_type === 'both') && portalLink && (
                      <div className="col-span-2 space-y-2 mt-2">
                        <div className="bg-white/5 border border-white/10 p-3 rounded-sm">
                          <p className="text-[9px] text-gray-400 font-mono break-all">{portalLink}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={copyLink} className="flex items-center justify-center space-x-2 p-2 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] uppercase font-black tracking-widest transition-all">
                            {linkCopied ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Copy size={10} />}
                            <span>{linkCopied ? 'Copied!' : 'Copy Link'}</span>
                          </button>
                          <button onClick={shareViaWhatsApp} className="flex items-center justify-center space-x-2 p-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 text-[9px] uppercase font-black tracking-widest transition-all">
                            <MessageCircle size={10} />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <button onClick={() => router.push(`/parties/${party.id}/edit`)} className="flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 p-3 text-[10px] uppercase font-black tracking-widest border border-white/5 transition-all col-span-2">
                       <Edit3 size={12} />
                       <span>Edit Party Identity</span>
                    </button>
                 </div>
              </div>
           </aside>

           {/* RIGHT PANEL (2/3) */}
           <div className="flex-1 min-w-0">
              <div className="bg-[#1A1D21] border border-white/5 flex flex-col min-h-[800px]">
                 <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
                    <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={HistoryIcon} label="Transaction History" />
                    {(party.party_type === 'customer' || party.party_type === 'both') && (
                      <TabButton active={activeTab === "invoices"} onClick={() => setActiveTab("invoices")} icon={FileText} label="Invoices" />
                    )}
                    {(party.party_type === 'supplier' || party.party_type === 'both') && (
                      <TabButton active={activeTab === "pos"} onClick={() => setActiveTab("pos")} icon={ShoppingCart} label="Purchase Orders" />
                    )}
                    <TabButton active={activeTab === "commitments"} onClick={() => setActiveTab("commitments")} icon={Award} label="Commitments" />
                 </div>

                 <div className="flex-1 p-8">
                    <AnimatePresence mode="wait">
                       {activeTab === "history" && (
                         <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                               <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Combined Ledger Stream</h3>
                               <div className="flex items-center space-x-4">
                                  <Badge variant="blue">Invoices</Badge>
                                  <Badge variant="purple">PO</Badge>
                                  <Badge variant="emerald">Payment</Badge>
                               </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                               <table className="w-full text-left border-collapse">
                                  <thead>
                                     <tr className="text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Reference</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Balance After</th>
                                     </tr>
                                  </thead>
                                  <tbody className="text-[11px]">
                                     {combinedHistory.length > 0 ? combinedHistory.map((item) => (
                                       <tr key={`${item.type}-${item.id}`} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                                          <td className="p-4 text-gray-400 font-mono">{item.date}</td>
                                          <td className="p-4">
                                             <div className="flex items-center space-x-2">
                                                {item.amount > 0 ? <ArrowDownLeft size={10} className="text-emerald-500" /> : <ArrowUpRight size={10} className="text-red-500" />}
                                                <Badge variant={item.color}>{item.type}</Badge>
                                             </div>
                                          </td>
                                          <td className="p-4 font-mono font-bold text-white hover:text-[#C5A059] cursor-pointer transition-colors flex items-center space-x-1">
                                             <span>{item.ref}</span>
                                             <ExternalLink size={10} className="opacity-0 group-hover:opacity-100" />
                                          </td>
                                          <td className={cn(
                                            "p-4 text-right font-mono font-bold",
                                            item.amount > 0 ? "text-emerald-500" : "text-red-500"
                                          )}>
                                            {fmt(item.amount)}
                                          </td>
                                          <td className="p-4"><Badge>{item.status}</Badge></td>
                                          <td className="p-4 text-right font-mono font-bold text-white">{fmt(item.balanceAfter)}</td>
                                       </tr>
                                     )) : (
                                       <tr>
                                          <td colSpan={6} className="py-20 text-center text-gray-600 italic">No transactions found for this party identity.</td>
                                       </tr>
                                     )}
                                  </tbody>
                               </table>
                            </div>
                         </motion.div>
                       )}

                       {activeTab === "invoices" && (
                         <motion.div key="invoices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                               {invoices?.map((inv: any) => (
                                 <div key={inv.id} className="bg-white/[0.02] border border-white/5 p-6 hover:border-[#0070F3]/30 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                       <div className="p-2 bg-blue-500/10 text-blue-500 rounded-sm">
                                          <FileText size={16} />
                                       </div>
                                       <Badge variant={inv.status === 'paid' ? 'emerald' : inv.status === 'overdue' ? 'red' : 'amber'}>
                                          {inv.status}
                                       </Badge>
                                    </div>
                                    <h4 className="text-sm font-bold text-white mb-1">{inv.invoice_no}</h4>
                                    <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest mb-6">Issued: {inv.issue_date}</p>
                                    
                                    <div className="space-y-3 border-t border-white/[0.03] pt-4">
                                       <div className="flex justify-between items-center">
                                          <span className="text-[9px] uppercase font-black text-gray-500">Total</span>
                                          <span className="text-sm font-mono font-black text-white">{fmt(inv.total)}</span>
                                       </div>
                                       <div className="flex justify-between items-center">
                                          <span className="text-[9px] uppercase font-black text-gray-500">Balance Due</span>
                                          <span className="text-sm font-mono font-black text-red-500">{fmt(inv.balance_due)}</span>
                                       </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mt-6">
                                       <button 
                                         onClick={() => router.push(`/invoices/${inv.id}`)}
                                         className="flex-1 p-2 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest transition-all"
                                       >
                                         View
                                       </button>
                                       <button 
                                         onClick={() => {
                                           setPaymentAmount(inv.balance_due.toString());
                                           setPaymentNote(`Payment for Invoice ${inv.invoice_no}`);
                                           setPaymentModal(true);
                                         }}
                                         className="p-2 bg-white/5 hover:bg-emerald-500 hover:text-black transition-all rounded-sm"
                                       >
                                          <DollarSign size={14} />
                                       </button>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </motion.div>
                       )}

                       {activeTab === "pos" && (
                         <motion.div key="pos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                               {purchaseOrders?.map((po: any) => (
                                 <div key={po.id} className="bg-white/[0.02] border border-white/5 p-6 hover:border-purple-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                       <div className="p-2 bg-purple-500/10 text-purple-500 rounded-sm">
                                          <ShoppingCart size={16} />
                                       </div>
                                       <Badge variant={po.status === 'received' ? 'emerald' : 'amber'}>
                                          {po.status}
                                       </Badge>
                                    </div>
                                    <h4 className="text-sm font-bold text-white mb-1">{po.po_number}</h4>
                                    <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest mb-6">Ordered: {po.order_date}</p>
                                    
                                    <div className="space-y-3 border-t border-white/[0.03] pt-4">
                                       <div className="flex justify-between items-center">
                                          <span className="text-[9px] uppercase font-black text-gray-500">Total Value</span>
                                          <span className="text-sm font-mono font-black text-white">{fmt(po.total)}</span>
                                       </div>
                                       <div className="flex justify-between items-center">
                                          <span className="text-[9px] uppercase font-black text-gray-500">Expected By</span>
                                          <span className="text-[10px] font-bold text-gray-400 uppercase">{po.expected_by || '—'}</span>
                                       </div>
                                    </div>
                                    
                                    <button 
                                      onClick={() => router.push(`/purchase/${po.id}`)}
                                      className="w-full mt-6 p-2 bg-white/5 hover:bg-purple-600 text-[9px] font-black uppercase tracking-widest transition-all"
                                    >
                                      Manage Order
                                    </button>
                                 </div>
                               ))}
                            </div>
                         </motion.div>
                       )}

                       {activeTab === "commitments" && (
                         <motion.div key="commit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <div className="bg-[#C5A059]/5 border border-[#C5A059]/10 p-6 flex flex-col items-center text-center">
                                  <div className="w-12 h-12 bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059] rounded-full mb-4">
                                     <Award size={24} />
                                  </div>
                                  <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Reliability Score</p>
                                  <h3 className="text-3xl font-black text-white font-mono">{reliability?.score || 85}</h3>
                                  <p className="text-[9px] uppercase font-black text-[#C5A059] mt-2 tracking-[0.2em]">{reliability?.status || 'Reliable'}</p>
                               </div>
                               
                               <div className="bg-white/[0.02] border border-white/5 p-6 md:col-span-2">
                                  <div className="flex items-center space-x-3 mb-4">
                                     <Activity size={18} className="text-gray-500" />
                                     <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Commitment Analysis</h3>
                                  </div>
                                  <p className="text-xs text-gray-400 leading-relaxed italic">
                                     {reliability?.notes || "Historical data indicates consistent payment cycles and high fulfillment accuracy. Recommended for increased credit ceiling."}
                                  </p>
                                  <div className="mt-6 flex gap-4">
                                     <div className="flex-1 bg-white/5 p-3 flex flex-col items-center">
                                        <span className="text-[8px] font-black uppercase text-gray-600">On-Time Pct</span>
                                        <span className="text-sm font-bold text-emerald-500">92%</span>
                                     </div>
                                     <div className="flex-1 bg-white/5 p-3 flex flex-col items-center">
                                        <span className="text-[8px] font-black uppercase text-gray-600">Return Rate</span>
                                        <span className="text-sm font-bold text-blue-500">1.2%</span>
                                     </div>
                                     <div className="flex-1 bg-white/5 p-3 flex flex-col items-center">
                                        <span className="text-[8px] font-black uppercase text-gray-600">Avg Delay</span>
                                        <span className="text-sm font-bold text-amber-500">2.4 Days</span>
                                     </div>
                                  </div>
                               </div>
                            </div>

                             <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                   <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Commitment Log</h3>
                                   <button 
                                      onClick={() => router.push(`/promises?partyId=${party.id}`)}
                                      className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 text-[10px] uppercase font-black tracking-widest border border-white/5 transition-all text-[#60A5FA]"
                                   >
                                      <Plus size={12} />
                                      <span>Record Promise</span>
                                   </button>
                                </div>
                                {commitments && commitments.length > 0 ? (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {commitments.map((c: any) => (
                                         <div key={c.id} className="bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between hover:border-white/10 transition-colors">
                                            <div className="flex justify-between items-start">
                                               <span className="text-[11px] font-mono font-bold text-[#C5A059]">{fmt(c.promised_amount)}</span>
                                               <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-[2px] ${
                                                  c.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                  c.status === 'broken' ? 'bg-white/5 text-gray-400 border border-white/10' :
                                                  'bg-amber-500/10 text-[#C5A059] border border-[#C5A059]/20'
                                               }`}>
                                                  {c.status}
                                               </span>
                                            </div>
                                            <div className="mt-3 flex justify-between text-[10px] text-gray-500">
                                               <span>Promise Date:</span>
                                               <span className="font-mono text-white">{c.promise_date}</span>
                                            </div>
                                            {c.notes && (
                                               <p className="text-[10px] text-gray-400 italic mt-2 border-t border-white/[0.03] pt-2">
                                                  "{c.notes}"
                                               </p>
                                            )}
                                         </div>
                                      ))}
                                   </div>
                                ) : (
                                   <div className="border border-white/5 p-8 text-center text-gray-600 italic text-xs uppercase tracking-widest bg-white/[0.01]">
                                      No specific commitments logged for this identity node.
                                   </div>
                                )}
                             </div>
                         </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
              </div>
           </div>
        </div>
      </main>

      {/* Record Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F1114] border border-white/10 rounded-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div>
                <p className="text-sm font-semibold text-white">Record Payment</p>
                <p className="text-xs text-gray-500 mt-0.5">{party.name}</p>
              </div>
              <button
                onClick={() => setPaymentModal(false)}
                className="text-gray-600 hover:text-gray-300 transition-colors text-lg leading-none">
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 block mb-1.5">
                  Amount ({profile?.currency || 'PKR'}) *
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="50000"
                  autoFocus
                  className="w-full bg-[#161A1F] border border-white/8 text-white text-sm font-mono px-3 py-2.5 outline-none focus:border-[#60A5FA]/40"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 block mb-1.5">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  placeholder="Bank transfer, cash, etc."
                  className="w-full bg-[#161A1F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40 placeholder:text-gray-700"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setPaymentModal(false)}
                  className="flex-1 py-2.5 text-sm border border-white/10 text-gray-400 hover:border-white/20 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
                    setSavingPayment(true);
                    try {
                      const amount = parseFloat(paymentAmount);

                      // Record in ledger
                      const { error: ledgerErr } = await supabase
                        .from('ledger_entries')
                        .insert({
                          business_id: profile?.id,
                          entry_type: 'payment_received',
                          party_id: party.id,
                          amount,
                          description: paymentNote || `Payment from ${party.name}`,
                          debit_account: 'cash',
                          credit_account: 'accounts_receivable',
                          voucher_type: 'receipt',
                          entry_date: new Date().toISOString(),
                        });

                      if (ledgerErr) throw ledgerErr;

                      // Update party balance
                      const { error: partyErr } = await supabase
                        .from('parties')
                        .update({ current_balance: (party.current_balance || 0) - amount })
                        .eq('id', party.id);

                      if (partyErr) throw partyErr;

                      // Refresh party data
                      queryClient.invalidateQueries({ queryKey: ['party', partyId] });

                      setPaymentModal(false);
                      setPaymentAmount('');
                      setPaymentNote('');
                    } catch (err: any) {
                      alert('Failed to record payment: ' + (err.message || 'Unknown error'));
                    } finally {
                      setSavingPayment(false);
                    }
                  }}
                  disabled={savingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="flex-1 py-2.5 text-sm font-bold bg-[#10B981] text-black hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {savingPayment ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
