"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Can } from "@/components/rbac/Can";
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Users, UserPlus, Search,
  Phone, MapPin,
  ChevronRight, X, CheckCircle2, MoreVertical,
  ArrowUpRight, ArrowDownLeft, Ban, ShieldAlert, MessageCircle
} from "lucide-react";
import DataFreshness from "@/components/ui/DataFreshness";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Skeleton, KpiCardSkeleton, CardGridSkeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState, FieldError } from "@/components/ui/StateViews";
import { useDebounce } from "@/hooks/useDebounce";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/useToast";
import { SharePortalButton } from "@/components/parties/SharePortalButton";

interface Party {
  id: string;
  business_id: string;
  name: string;
  party_type: 'customer' | 'supplier' | 'both';
  phone?: string;
  address?: string;
  credit_limit: number;
  credit_days: number;
  current_balance: number;
  is_blocked: boolean;
  notes?: string;
  created_at?: string;
}

interface Stats {
  receivable: number;
  payable: number;
  blocked: number;
}

const partySchema = z.object({
  name: z.string().min(2, "Name too short"),
  party_type: z.enum(['customer', 'supplier', 'both']),
  phone: z.string().optional().refine(val => {
    if (!val) return true;
    const digits = val.replace(/[^0-9]/g, '');
    return digits.length >= 10;
  }, "Enter a valid phone number"),
  email: z.string().optional().refine(val => {
    if (!val) return true;
    return val.includes('@');
  }, "Enter a valid email address"),
  address: z.string().optional(),
  credit_limit: z.coerce.number().min(0).default(0),
  credit_days: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

type PartyFormValues = z.infer<typeof partySchema>;

export default function PartiesPage() {
  const { businessId, fmt, term } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const toast = useToast();
  

  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier'>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleToggleBlock = async (party: Party) => {
    try {
      const { error } = await supabase
        .from('parties')
        .update({ 
          is_blocked: !party.is_blocked,
          blocked_at: !party.is_blocked ? new Date().toISOString() : null
        })
        .eq('id', party.id);
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['parties_registry'] });
      setSuccessToast(`${party.name} is now ${!party.is_blocked ? 'blocked' : 'unblocked'}`);
    } catch (err: any) {
      alert(`Failed to update party status: ${err.message}`);
    }
  };

  // Queries
  const { data: parties = [], isLoading, error: partiesError, refetch: refetchParties } = useQuery({
    queryKey: ['parties_registry', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('business_id', businessId)
        .order('name');
      if (error) throw error;
      setLastFetchedAt(new Date());
      return data;
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000,
  });

  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredParties = useMemo(() => {
    return parties.filter((p: Party) => {
      const matchesSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                           p.phone?.includes(debouncedSearch);
      const matchesType = filterType === 'all' || p.party_type === filterType || p.party_type === 'both';
      return matchesSearch && matchesType;
    });
  }, [parties, debouncedSearch, filterType]);

  const stats = useMemo<Stats>(() => {
    const totalReceivable = parties
      .filter((p: Party) => p.current_balance > 0)
      .reduce((acc: number, p: Party) => acc + Number(p.current_balance), 0);
    const totalPayable = parties
      .filter((p: Party) => p.current_balance < 0)
      .reduce((acc: number, p: Party) => acc + Math.abs(Number(p.current_balance)), 0);
    return {
      receivable: totalReceivable,
      payable: totalPayable,
      blocked: parties.filter((p: Party) => p.is_blocked).length
    };
  }, [parties]);

  const parentRef = useRef<HTMLDivElement>(null);
  const items = filteredParties || [];

  const chunk = <T,>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );

  const chunkedRows = useMemo(() => chunk(items, 3) as Party[][], [items]);

  const rowVirtualizer = useVirtualizer({
    count: chunkedRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 240,
    overscan: 5,
  });

  const exportToExcel = () => {
    if (!parties || parties.length === 0) {
      toast.error('No data to export')
      return
    }
    
    const data = parties.map((party: Party) => ({
      'Party Name': party.name,
      'Classification': party.party_type,
      'Phone': party.phone || '',
      'Address': party.address || '',
      'Credit Limit': party.credit_limit || 0,
      'Credit Days': party.credit_days || 0,
      'Current Balance': party.current_balance || 0,
      'Status': party.is_blocked ? 'Blocked' : 'Active',
    }))
    
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Parties')
    XLSX.writeFile(wb,
      `noxis_parties_${new Date().toISOString().split('T')[0]}.xlsx`
    )
    
    toast.success('Parties registry exported to Excel')
  }

  if (isLoading) return (
    <div className="p-6 bg-[#0F1113]">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );

  if (partiesError) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center p-8">
      <ErrorState
        message="Could not load parties registry"
        detail={(partiesError as Error).message}
        onRetry={refetchParties}
      />
    </div>
  );

  if (!parties || parties.length === 0) return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6 flex flex-col justify-center">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <EmptyState
        icon="🤝"
        title="No customers or suppliers"
        description="Add your first business contact"
        action={{ label: 'Add party', onClick: () => setIsModalOpen(true) }}
      />
      <AnimatePresence>
        {isModalOpen && <AddPartyModal onClose={() => setIsModalOpen(false)} onSuccess={(msg: string) => { setSuccessToast(msg); queryClient.invalidateQueries({ queryKey: ['parties_registry'] }); setIsModalOpen(false); }} />}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200">
      
      
      <main className="transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white uppercase italic">
              {term('parties')} Registry
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Global Identity & Credit Management
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex bg-[#0F1113] border border-white/10 p-1">
                {['all', 'customer', 'supplier'].map((type) => (
                  <button
                   key={type}
                   onClick={() => setFilterType(type as any)}
                   className={cn(
                     "px-4 py-1.5 text-[9px] uppercase font-black tracking-widest transition-all",
                     filterType === type ? "bg-[#0070F3] text-white" : "text-gray-500 hover:text-gray-300"
                   )}
                  >
                     {type}
                  </button>
                ))}
             </div>
             <button 
               onClick={() => setIsModalOpen(true)}
               className="flex items-center space-x-2 px-4 py-2 bg-electric-blue text-onyx text-sm font-semibold rounded-sm hover:brightness-110 shadow-lg"
             >
                <UserPlus size={14} />
                <span>Add New Party</span>
             </button>
             <Link
               href="/parties/reminders"
               className="flex items-center gap-2 px-3 py-2 border border-[#25D366]/25 text-[#25D366] text-xs font-semibold hover:bg-[#25D366]/10 transition-colors rounded-sm"
             >
               <MessageCircle size={13} />
               Send Reminders
             </Link>
          </div>
        </div>

        <div className="px-8 pt-4 flex justify-end">
           <DataFreshness 
             lastFetchedAt={lastFetchedAt} 
             onRefresh={() => queryClient.invalidateQueries({ queryKey: ['parties_registry'] })} 
           />
        </div>

        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <SummaryCard label="Total Receivables" value={stats.receivable} sub="Owed to us" icon={ArrowUpRight} color="text-emerald-500" />
               <SummaryCard label="Total Payables" value={stats.payable} sub="Owed to others" icon={ArrowDownLeft} color="text-red-500" />
               <SummaryCard label="Blocked Accounts" value={stats.blocked} isCurrency={false} sub="Credit limit breaches" icon={ShieldAlert} color="text-amber-500" />
            </div>

           {/* Table Controls */}
           <div className="bg-[#1A1D21] border border-white/5 p-4 flex items-center justify-between">
              <div className="relative w-96">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input 
                   type="text" 
                   placeholder="Search parties by name or phone..." 
                   className="w-full bg-[#0F1113] border border-white/5 pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-[#0070F3]/50"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>

              <button onClick={exportToExcel}
                className="flex items-center gap-1.5
                  px-3 py-1.5 text-xs font-medium
                  border border-white/10 text-gray-400
                  hover:border-white/20 hover:text-white
                  transition-colors">
                ↓ Export Excel
              </button>
           </div>

            {/* Parties List */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-white/[0.02] animate-pulse border border-white/5" />)}
              </div>
            ) : filteredParties.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center opacity-30 italic">
                 <Users size={60} strokeWidth={0.5} />
                 <p className="mt-4 uppercase tracking-[0.2em] text-[10px]">No parties matched criteria</p>
              </div>
            ) : (
              <div
                ref={parentRef}
                className="overflow-y-auto max-h-[calc(100vh-280px)] pr-2"
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {chunkedRows[virtualRow.index].map((party: Party) => (
                          <PartyCard 
                            key={party.id} 
                            party={party} 
                            fmt={fmt} 
                            onView={() => router.push(`/parties/${party.id}`)}
                            openMenu={openMenu}
                            setOpenMenu={setOpenMenu}
                            onToggleBlock={() => handleToggleBlock(party)}
                            onEdit={() => router.push(`/parties/${party.id}/edit`)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && <AddPartyModal onClose={() => setIsModalOpen(false)} onSuccess={(msg: string) => { setSuccessToast(msg); queryClient.invalidateQueries({ queryKey: ['parties_registry'] }); setIsModalOpen(false); }} />}
      </AnimatePresence>

      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 right-8 z-[100] bg-emerald text-onyx px-6 py-3 flex items-center space-x-3 shadow-2xl rounded-sm font-bold uppercase text-xs tracking-widest"
          >
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
            <button onClick={() => setSuccessToast(null)} className="ml-4 opacity-50 hover:opacity-100"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


const PartyCard = React.memo(function PartyCard({ 
  party, 
  fmt, 
  onView,
  openMenu,
  setOpenMenu,
  onToggleBlock,
  onEdit
}: { 
  party: Party, 
  fmt: (n: number) => string, 
  onView: () => void,
  openMenu: string | null,
  setOpenMenu: (id: string | null) => void,
  onToggleBlock: () => void,
  onEdit: () => void
}) {
  const balance = Number(party.current_balance);
  const isOwed = balance > 0;
  const isPayable = balance < 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-sm bg-[#111418] border border-white/[0.06] p-5 hover:border-white/[0.1] transition-colors relative overflow-hidden group"
    >
       <div className="absolute top-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-[#60A5FA] to-transparent opacity-60" />
       {party.is_blocked && (
         <div className="absolute top-0 right-0 p-2 bg-amber-500/10 text-amber-500">
            <Ban size={12} />
         </div>
       )}

       <div className="space-y-6">
          <div className="flex items-start justify-between">
             <div className="space-y-1">
                 <div className="flex items-center gap-2">
                   <h3 className="text-sm font-black uppercase text-white group-hover:text-[#0070F3] transition-colors">{party.name}</h3>
                   {party.is_blocked && (
                     <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                       Blocked
                     </span>
                   )}
                 </div>
                <div className="flex items-center space-x-2 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                   <span className={cn("px-1.5 py-0.5 rounded-sm", party.party_type === 'customer' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-400")}>
                      {party.party_type}
                   </span>
                   {party.credit_limit > 0 && <span>Limit: {fmt(party.credit_limit)}</span>}
                </div>
             </div>
             <div className="relative">
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   setOpenMenu(openMenu === party.id ? null : party.id);
                 }}
                 className="text-gray-700 hover:text-white transition-colors p-1"
               >
                 <MoreVertical size={16} />
               </button>
               {openMenu === party.id && (
                 <div className="absolute right-0 mt-2 w-48 bg-[#1A1D21] border border-white/10 rounded-sm shadow-2xl z-50 text-left py-1 text-xs">
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       onView();
                       setOpenMenu(null);
                     }}
                     className="w-full text-left px-4 py-2 hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
                   >
                     View Details
                   </button>
                   {party.phone && (
                     <a 
                       href={`https://wa.me/${party.phone.replace(/[^0-9]/g, '')}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       onClick={(e) => {
                         e.stopPropagation();
                         setOpenMenu(null);
                       }}
                       className="block w-full text-left px-4 py-2 hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
                     >
                       Send WhatsApp
                     </a>
                   )}
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       onEdit();
                       setOpenMenu(null);
                     }}
                     className="w-full text-left px-4 py-2 hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
                   >
                     Edit Party
                   </button>
                   <button 
                     type="button"
                     onClick={(e) => {
                       e.stopPropagation();
                       onToggleBlock();
                       setOpenMenu(null);
                     }}
                     className="w-full text-left px-4 py-2 hover:bg-white/5 text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors font-bold"
                   >
                     {party.is_blocked ? "Unblock Account" : "Block Account"}
                   </button>
                 </div>
               )}
             </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center space-x-3 text-xs text-gray-500">
                <Phone size={12} className="text-gray-700" />
                <span className="font-mono">{party.phone || "No phone registered"}</span>
             </div>
             <div className="flex items-start space-x-3 text-xs text-gray-500">
                <MapPin size={12} className="text-gray-700 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{party.address || "No address provided"}</span>
             </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-end justify-between">
             <div className="space-y-1">
                <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest">Outstanding Balance</p>
                <p className={cn(
                  "text-lg font-black font-mono tracking-tighter",
                  isOwed ? "text-emerald-500" : isPayable ? "text-red-500" : "text-gray-400"
                )}>
                   <Can permission="view:party_balances" fallback={<span className="text-gray-600 text-xs">Restricted</span>}>
                     {isPayable ? `(${fmt(Math.abs(balance))})` : fmt(balance)}
                   </Can>
                </p>
             </div>
             <div className="flex items-center space-x-2">
                <SharePortalButton
                  partyId={party.id}
                  partyName={party.name}
                  partyPhone={party.phone}
                />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onView();
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10 hover:border-white/30"
                >
                   <ChevronRight size={18} />
                </button>
             </div>
          </div>
       </div>
    </motion.div>
  );
});

function AddPartyModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: (m: string) => void }) {
  const { businessId } = usePersona();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const { register, handleSubmit, formState: { errors } } = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    mode: "onChange",
    defaultValues: { party_type: 'customer', credit_limit: 0, credit_days: 0 }
  });

  const onSubmit = async (values: PartyFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('parties')
        .insert({
          ...values,
          business_id: businessId,
          current_balance: 0,
          is_blocked: false
        });
      
      if (error) throw error;
      onSuccess(`Party ${values.name} successfully onboarded.`);
    } catch (err: any) {
      alert(`Onboarding failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
       <motion.div 
         initial={{ x: "100%" }} 
         animate={{ x: 0 }} 
         exit={{ x: "100%" }}
         className="w-full max-w-xl bg-[#1A1D21] border-l border-white/5 h-full flex flex-col shadow-2xl"
       >
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#0070F3]/10 text-[#0070F3]">
                   <UserPlus size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-black text-white uppercase tracking-tighter">Onboard New Party</h2>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global Identity Registry v1.0</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 space-y-8">
             <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                   <label className="text-[10px] uppercase font-black text-gray-600">Legal Name</label>
                    <input {...register("name")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-sm text-white focus:border-[#0070F3] outline-none" placeholder="e.g. Acme Industrial Ltd" />
                    <FieldError message={errors.name?.message} />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-black text-gray-600">Party Classification</label>
                   <select {...register("party_type")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-sm text-white outline-none">
                      <option value="customer">Customer</option>
                      <option value="supplier">Supplier</option>
                      <option value="both">Both (Multi-Entity)</option>
                   </select>
                </div>

                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-600">Contact Number</label>
                    <input {...register("phone")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-sm text-white outline-none" placeholder="+92 300 0000000" />
                    <FieldError message={errors.phone?.message} />
                 </div>

                 <div className="space-y-2 col-span-2">
                    <label className="text-[10px] uppercase font-black text-gray-600">Email Address</label>
                    <input {...register("email")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-sm text-white outline-none" placeholder="e.g. billing@acme.com" />
                    <FieldError message={errors.email?.message} />
                 </div>

                <div className="col-span-2 space-y-2">
                   <label className="text-[10px] uppercase font-black text-gray-600">Physical Address</label>
                   <textarea {...register("address")} rows={2} className="w-full bg-[#0F1113] border border-white/10 p-4 text-sm text-white outline-none" placeholder="Primary operational facility address..." />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-black text-gray-600">Credit Limit (PKR)</label>
                   <input type="number" {...register("credit_limit")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-sm text-white font-mono outline-none" placeholder="0.00" />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-black text-gray-600">Credit Terms (Days)</label>
                   <input type="number" {...register("credit_days")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-sm text-white font-mono outline-none" placeholder="30" />
                </div>
             </div>

             <div className="p-6 bg-amber-500/5 border border-amber-500/10 space-y-3">
                <div className="flex items-center space-x-2 text-amber-500">
                   <ShieldAlert size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">System Protocol</span>
                </div>
                <p className="text-[9px] text-gray-500 leading-relaxed uppercase">
                   Onboarding a party automatically creates a sub-ledger context. Credit limit breaches will trigger automatic transactional blocking for this entity.
                </p>
             </div>
          </form>

          <div className="p-8 bg-[#0F1113] border-t border-white/5 flex items-center space-x-4">
             <button onClick={onClose} className="flex-1 py-4 text-[10px] uppercase font-black text-gray-500 hover:text-white transition-colors">Discard Draft</button>
             <button 
               onClick={handleSubmit(onSubmit)} 
               disabled={isSubmitting}
               className="flex-[2] py-4 bg-[#0070F3] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:brightness-110 disabled:opacity-50"
             >
                {isSubmitting ? "Syncing..." : "Onboard Party to Registry"}
             </button>
          </div>
       </motion.div>
    </div>
  );
}
