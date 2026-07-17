"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, X, Factory, UserCheck, FileText, 
  Banknote, Package, Wallet, ShoppingCart, 
  BookOpen, ChevronLeft, Search, Check 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { usePersona } from "@/hooks/usePersona";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import Decimal from "decimal.js";

type ActionType = 
  | 'grid' 
  | 'log_production' 
  | 'mark_attendance' 
  | 'record_payment' 
  | 'adjust_stock' 
  | 'give_advance';

export default function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionType>('grid');
  const [search, setSearch] = useState("");
  const { businessId, t } = usePersona();
  const { success, error } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Space (if not in input) to open, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable;
      
      if (e.code === 'Space' && !isInput && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
        setActiveAction('grid');
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setActiveAction('grid');
  };

  const closePalette = () => {
    setIsOpen(false);
    setTimeout(() => setActiveAction('grid'), 300);
  };

  const actions = [
    { id: 'log_production', label: "Log Production", icon: Factory, color: "text-blue-400", bg: "bg-blue-400/10" },
    { id: 'mark_attendance', label: "Mark Attendance", icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { id: 'new_invoice', label: "New Invoice", icon: FileText, color: "text-amber-400", bg: "bg-amber-400/10" },
    { id: 'record_payment', label: "Record Payment", icon: Banknote, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { id: 'adjust_stock', label: "Adjust Stock", icon: Package, color: "text-amber-400", bg: "bg-amber-400/10" },
    { id: 'give_advance', label: "Give Advance", icon: Wallet, color: "text-red-400", bg: "bg-red-400/10" },
    { id: 'add_purchase', label: "Add Purchase", icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-400/10" },
    { id: 'journal_entry', label: "Journal Entry", icon: BookOpen, color: "text-gray-400", bg: "bg-gray-400/10" },
  ];

  const handleActionClick = (id: string) => {
    if (id === 'new_invoice') {
      router.push('/invoices/new');
      closePalette();
    } else if (id === 'add_purchase') {
      router.push('/purchase/new');
      closePalette();
    } else if (id === 'journal_entry') {
      router.push('/khata?tab=journal');
      closePalette();
    } else {
      setActiveAction(id as ActionType);
    }
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        data-tour="quick-add"
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 bg-[#09090b] border border-cyan-500/40 text-cyan-400 flex items-center justify-center transition-all duration-200 z-[150] rounded-[4px] shadow-[0_0_15px_rgba(34,211,238,0.15),_inset_0_0_8px_rgba(34,211,238,0.1)] hover:border-cyan-400 hover:text-white hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        )}
      >
        <Plus size={24} className={cn("transition-transform duration-300", isOpen ? "rotate-45 text-red-400" : "rotate-0")} />
      </motion.button>

      {/* Palette */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePalette}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[140]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-24 right-6 w-[320px] glass-panel shadow-2xl z-[150] overflow-hidden rounded-xl"
            >
              {activeAction === 'grid' ? (
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action.id)}
                        className="flex flex-col items-center justify-center p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                      >
                        <div className={cn("p-2 rounded-lg mb-2 transition-transform group-hover:scale-110", action.bg, action.color)}>
                          <action.icon size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors text-center">
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-white/10 flex items-center space-x-3">
                    <button 
                      onClick={() => setActiveAction('grid')}
                      className="p-1 text-gray-500 hover:text-white transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                      {actions.find(a => a.id === activeAction)?.label}
                    </h3>
                  </div>
                  <div className="p-4">
                    {activeAction === 'log_production' && <LogProductionForm onSuccess={closePalette} />}
                    {activeAction === 'mark_attendance' && <MarkAttendanceForm onSuccess={closePalette} />}
                    {activeAction === 'record_payment' && <RecordPaymentForm onSuccess={closePalette} />}
                    {activeAction === 'adjust_stock' && <AdjustStockForm onSuccess={closePalette} />}
                    {activeAction === 'give_advance' && <GiveAdvanceForm onSuccess={closePalette} />}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// --- Inline Form Components ---

function LogProductionForm({ onSuccess }: { onSuccess: () => void }) {
  const [karigarSearch, setKarigarSearch] = useState("");
  const [qty, setQty] = useState("");
  const [grade, setGrade] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { businessId } = usePersona();
  const { success: showSuccess, error: showError } = useToast();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: karigars = [] } = useQuery({
    queryKey: ['quick_karigars', karigarSearch],
    queryFn: async () => {
      let query = supabase
        .from('karigars')
        .select('id, name')
        .eq('business_id', businessId);
      
      if (karigarSearch.trim()) {
        query = query.ilike('name', `%${karigarSearch}%`);
      }
      
      const { data } = await query.limit(5);
      return data || [];
    }
  });

  const [selectedKarigar, setSelectedKarigar] = useState<{id: string, name: string} | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedKarigar || !qty || !grade) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('karigar_production_logs').insert({
        business_id: businessId,
        karigar_id: selectedKarigar.id,
        qty_produced: Number(qty),
        quality_grade: grade,
        posted_at: new Date().toISOString()
      });

      if (error) throw error;

      showSuccess(`${qty} units logged for ${selectedKarigar.name} ✓`);
      queryClient.invalidateQueries({ queryKey: ['dept_stats'] });
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      showError(`Error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Karigar</label>
        {!selectedKarigar ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
            <input 
              autoFocus
              value={karigarSearch}
              onChange={(e) => setKarigarSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 px-9 py-2 text-xs text-white outline-none focus:border-blue-500/50"
              placeholder="Search Karigar..."
            />
            {karigars.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-10">
                {karigars.map((k: any) => (
                  <button 
                    key={k.id}
                    onClick={() => setSelectedKarigar(k)}
                    className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-white"
                  >
                    {k.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded">
            <span className="text-xs text-blue-400 font-bold">{selectedKarigar.name}</span>
            <button onClick={() => setSelectedKarigar(null)} className="text-blue-400/50 hover:text-blue-400">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Quantity</label>
        <input 
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full bg-black/40 border border-white/10 px-4 py-3 text-2xl font-black text-center text-white outline-none focus:border-blue-500/50"
          placeholder="0"
          onKeyDown={(e) => e.key === 'Enter' && grade && handleSubmit()}
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Grade</label>
        <div className="grid grid-cols-4 gap-2">
          {['A', 'B', 'C', 'Rejected'].map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g.toLowerCase())}
              className={cn(
                "py-2 text-[10px] font-black uppercase border transition-all",
                grade === g.toLowerCase() 
                  ? "bg-white text-black border-white" 
                  : "bg-white/5 text-gray-500 border-white/10 hover:border-white/30"
              )}
            >
              {g === 'Rejected' ? 'REJ' : g}
            </button>
          ))}
        </div>
      </div>

      <button 
        type="submit"
        disabled={isSubmitting || !selectedKarigar || !qty || !grade}
        className="w-full py-3 bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50 hover:brightness-110"
      >
        {isSubmitting ? 'Logging...' : 'Submit [Enter]'}
      </button>
    </form>
  );
}

function MarkAttendanceForm({ onSuccess }: { onSuccess: () => void }) {
  const [karigarSearch, setKarigarSearch] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { businessId } = usePersona();
  const { success: showSuccess, error: showError } = useToast();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: karigars = [] } = useQuery({
    queryKey: ['quick_karigars_attendance', karigarSearch],
    queryFn: async () => {
      let query = supabase
        .from('karigars')
        .select('id, name')
        .eq('business_id', businessId);
      
      if (karigarSearch.trim()) {
        query = query.ilike('name', `%${karigarSearch}%`);
      }
      
      const { data } = await query.limit(5);
      return data || [];
    }
  });

  const [selectedKarigar, setSelectedKarigar] = useState<{id: string, name: string} | null>(null);

  const handleStatusSubmit = async (status: string) => {
    if (!selectedKarigar) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('attendance_logs').insert({
        business_id: businessId,
        karigar_id: selectedKarigar.id,
        log_date: date,
        status: status.toLowerCase().replace(' ', '_'),
        posted_at: new Date().toISOString()
      });

      if (error) throw error;

      showSuccess(`${selectedKarigar.name} marked ${status} ✓`);
      queryClient.invalidateQueries({ queryKey: ['attendance_today'] });
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      showError(`Error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Date</label>
        <input 
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-black/40 border border-white/10 px-4 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Karigar</label>
        {!selectedKarigar ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
            <input 
              autoFocus
              value={karigarSearch}
              onChange={(e) => setKarigarSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 px-9 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
              placeholder="Search Karigar..."
            />
            {karigars.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-10">
                {karigars.map((k: any) => (
                  <button 
                    key={k.id}
                    onClick={() => setSelectedKarigar(k)}
                    className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-white"
                  >
                    {k.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded">
            <span className="text-xs text-emerald-400 font-bold">{selectedKarigar.name}</span>
            <button onClick={() => setSelectedKarigar(null)} className="text-emerald-400/50 hover:text-emerald-400">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2 pt-2">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Select Status</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'present', label: 'Present', color: 'bg-emerald-500' },
            { id: 'absent', label: 'Absent', color: 'bg-red-500' },
            { id: 'half_day', label: 'Half Day', color: 'bg-amber-500' }
          ].map(s => (
            <button
              key={s.id}
              disabled={isSubmitting || !selectedKarigar}
              onClick={() => handleStatusSubmit(s.label)}
              className={cn(
                "w-full py-4 rounded font-black uppercase tracking-[0.2em] text-[10px] text-white transition-all hover:brightness-110 disabled:opacity-50",
                s.color
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecordPaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const [partySearch, setPartySearch] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { businessId } = usePersona();
  const { success: showSuccess, error: showError } = useToast();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: parties = [] } = useQuery({
    queryKey: ['quick_parties_payment', partySearch],
    queryFn: async () => {
      let query = supabase
        .from('parties')
        .select('id, name')
        .eq('business_id', businessId);
      
      if (partySearch.trim()) {
        query = query.ilike('name', `%${partySearch}%`);
      }
      
      const { data } = await query.limit(5);
      return data || [];
    }
  });

  const [selectedParty, setSelectedParty] = useState<{id: string, name: string} | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedParty || !amount || !method) return;

    setIsSubmitting(true);
    try {
      // 1. Fetch system accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, account_code')
        .eq('business_id', businessId)
        .in('account_code', ['1001', '1100']);

      if (accountsError) throw accountsError;
      
      const cashAccount = accounts?.find((a: any) => a.account_code === '1001');
      const arAccount = accounts?.find((a: any) => a.account_code === '1100');

      if (!cashAccount || !arAccount) {
        throw new Error("Core system accounts Cash (1001) and Accounts Receivable (1100) are missing in Chart of Accounts.");
      }

      // 2. Insert Payment
      const { data: payment, error: pError } = await supabase.from('payments').insert({
        business_id: businessId,
        party_id: selectedParty.id,
        amount: new Decimal(amount).toNumber(),
        payment_method: method.toLowerCase(),
        status: 'completed',
        posted_at: new Date().toISOString()
      }).select().single();

      if (pError) throw pError;

      // 3. Insert balanced double-entry
      const tx_ref = `PAY-${payment.id}`;
      const description = `Record Payment via Quick Action (${method})`;
      const ledgerRows = [
        {
          business_id: businessId,
          tx_ref,
          account_id: cashAccount.id,
          party_id: null,
          amount: new Decimal(amount).toNumber(),
          entry_type: 'debit',
          description,
          posted_at: new Date().toISOString(),
          status: 'posted'
        },
        {
          business_id: businessId,
          tx_ref,
          account_id: arAccount.id,
          party_id: selectedParty.id,
          amount: new Decimal(amount).toNumber(),
          entry_type: 'credit',
          description,
          posted_at: new Date().toISOString(),
          status: 'posted'
        }
      ];

      const { error: ledgerError } = await supabase
        .from('ledger_entries')
        .insert(ledgerRows);

      if (ledgerError) throw ledgerError;

      showSuccess(`PKR ${amount} from ${selectedParty.name} recorded ✓`);
      queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      showError(`Error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Party</label>
        {!selectedParty ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
            <input 
              autoFocus
              value={partySearch}
              onChange={(e) => setPartySearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 px-9 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
              placeholder="Search Party..."
            />
            {parties.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-10">
                {parties.map((p: any) => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedParty(p)}
                    className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-white"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded">
            <span className="text-xs text-emerald-400 font-bold">{selectedParty.name}</span>
            <button onClick={() => setSelectedParty(null)} className="text-emerald-400/50 hover:text-emerald-400">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Amount (PKR)</label>
        <input 
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-black/40 border border-white/10 px-4 py-3 text-2xl font-black text-center text-white outline-none focus:border-emerald-500/50"
          placeholder="0.00"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Method</label>
        <div className="grid grid-cols-2 gap-2">
          {['Cash', 'Bank', 'JazzCash', 'EasyPaisa'].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m.toLowerCase())}
              className={cn(
                "py-2 text-[10px] font-black uppercase border transition-all",
                method === m.toLowerCase() 
                  ? "bg-white text-black border-white" 
                  : "bg-white/5 text-gray-500 border-white/10 hover:border-white/30"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <button 
        type="submit"
        disabled={isSubmitting || !selectedParty || !amount || !method}
        className="w-full py-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50 hover:brightness-110"
      >
        {isSubmitting ? 'Recording...' : 'Record Payment'}
      </button>
    </form>
  );
}

function AdjustStockForm({ onSuccess }: { onSuccess: () => void }) {
  const [skuSearch, setSkuSearch] = useState("");
  const [type, setType] = useState<"add" | "remove" | "set">("add");
  const [qty, setQty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { businessId } = usePersona();
  const { success: showSuccess, error: showError } = useToast();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: skus = [] } = useQuery({
    queryKey: ['quick_skus_adjustment', skuSearch],
    queryFn: async () => {
      let query = supabase
        .from('skus')
        .select('id, name, qty_on_hand, sku_code')
        .eq('business_id', businessId);
      
      if (skuSearch.trim()) {
        query = query.or(`name.ilike.%${skuSearch}%,sku_code.ilike.%${skuSearch}%`);
      }
      
      const { data } = await query.limit(5);
      return data || [];
    }
  });

  const [selectedSku, setSelectedSku] = useState<any | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSku || !qty) return;

    setIsSubmitting(true);
    try {
      const currentQty = selectedSku.qty_on_hand || 0;
      let newQty = currentQty;
      const change = Number(qty);

      if (type === 'add') newQty += change;
      else if (type === 'remove') newQty -= change;
      else if (type === 'set') newQty = change;

      const { error } = await supabase.from('skus').update({
        qty_on_hand: newQty,
        updated_at: new Date().toISOString()
      }).eq('id', selectedSku.id);

      if (error) throw error;

      showSuccess(`${selectedSku.name} updated to ${newQty} units ✓`);
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      showError(`Error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">SKU / Barcode</label>
        {!selectedSku ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
            <input 
              autoFocus
              value={skuSearch}
              onChange={(e) => setSkuSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 px-9 py-2 text-xs text-white outline-none focus:border-amber-500/50"
              placeholder="Search SKU..."
            />
            {skus.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-10">
                {skus.map((s: any) => (
                  <button 
                    key={s.id}
                    onClick={() => setSelectedSku(s)}
                    className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-white"
                  >
                    <div className="font-bold">{s.name}</div>
                    <div className="text-[10px] opacity-50">{s.sku_code} • {s.qty_on_hand} in stock</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded">
            <div className="flex flex-col">
              <span className="text-xs text-amber-400 font-bold">{selectedSku.name}</span>
              <span className="text-[9px] text-amber-400/60 uppercase">Current: {selectedSku.qty_on_hand}</span>
            </div>
            <button onClick={() => setSelectedSku(null)} className="text-amber-400/50 hover:text-amber-400">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Adjustment Type</label>
        <div className="grid grid-cols-3 gap-2">
          {(['add', 'remove', 'set'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "py-2 text-[10px] font-black uppercase border transition-all",
                type === t 
                  ? "bg-white text-black border-white" 
                  : "bg-white/5 text-gray-500 border-white/10 hover:border-white/30"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Quantity</label>
        <input 
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full bg-black/40 border border-white/10 px-4 py-3 text-2xl font-black text-center text-white outline-none focus:border-amber-500/50"
          placeholder="0"
        />
      </div>

      <button 
        type="submit"
        disabled={isSubmitting || !selectedSku || !qty}
        className="w-full py-3 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50 hover:brightness-110"
      >
        {isSubmitting ? 'Updating...' : 'Apply Adjustment'}
      </button>
    </form>
  );
}

function GiveAdvanceForm({ onSuccess }: { onSuccess: () => void }) {
  const [karigarSearch, setKarigarSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { businessId } = usePersona();
  const { success: showSuccess, error: showError } = useToast();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: karigars = [] } = useQuery({
    queryKey: ['quick_karigars_advance', karigarSearch],
    queryFn: async () => {
      let query = supabase
        .from('karigars')
        .select('id, name')
        .eq('business_id', businessId);
      
      if (karigarSearch.trim()) {
        query = query.ilike('name', `%${karigarSearch}%`);
      }
      
      const { data } = await query.limit(5);
      return data || [];
    }
  });

  const [selectedKarigar, setSelectedKarigar] = useState<{id: string, name: string} | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedKarigar || !amount || !reason) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('karigar_advances').insert({
        business_id: businessId,
        karigar_id: selectedKarigar.id,
        amount: Number(amount),
        reason: reason,
        status: 'approved',
        approved_at: new Date().toISOString(),
        posted_at: new Date().toISOString()
      });

      if (error) throw error;

      showSuccess(`PKR ${amount} advance given to ${selectedKarigar.name} ✓`);
      queryClient.invalidateQueries({ queryKey: ['karigar_advances'] });
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      showError(`Error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Karigar</label>
        {!selectedKarigar ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
            <input 
              autoFocus
              value={karigarSearch}
              onChange={(e) => setKarigarSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 px-9 py-2 text-xs text-white outline-none focus:border-red-500/50"
              placeholder="Search Karigar..."
            />
            {karigars.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-10">
                {karigars.map((k: any) => (
                  <button 
                    key={k.id}
                    onClick={() => setSelectedKarigar(k)}
                    className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-white"
                  >
                    {k.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 px-3 py-2 rounded">
            <span className="text-xs text-red-400 font-bold">{selectedKarigar.name}</span>
            <button onClick={() => setSelectedKarigar(null)} className="text-red-400/50 hover:text-red-400">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Amount (PKR)</label>
        <input 
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-black/40 border border-white/10 px-4 py-3 text-2xl font-black text-center text-white outline-none focus:border-red-500/50"
          placeholder="0"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Reason</label>
        <div className="grid grid-cols-2 gap-2">
          {['Medical', 'Festival', 'Emergency', 'Other'].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={cn(
                "py-2 text-[10px] font-black uppercase border transition-all",
                reason === r 
                  ? "bg-white text-black border-white" 
                  : "bg-white/5 text-gray-500 border-white/10 hover:border-white/30"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <button 
        type="submit"
        disabled={isSubmitting || !selectedKarigar || !amount || !reason}
        className="w-full py-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50 hover:brightness-110"
      >
        {isSubmitting ? 'Authorizing...' : 'Give Advance'}
      </button>
    </form>
  );
}
