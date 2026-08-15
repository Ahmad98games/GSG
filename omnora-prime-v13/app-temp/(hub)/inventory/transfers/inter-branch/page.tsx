"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/hooks/useToast";
import { humanizeError } from '@/lib/utils/errors';
import { 
  ArrowRightLeft, Search, Package, ArrowRight, 
  CheckCircle2, XCircle, Clock, AlertCircle,
  Truck, ShieldCheck, Trash2, History
} from 'lucide-react';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  createColumnHelper 
} from '@tanstack/react-table';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Decimal } from 'decimal.js';
import { useBranchStore } from '@/stores/branchStore';
import { useLicense } from '@/hooks/useLicense';
import { usePersona } from '@/hooks/usePersona';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { 
  initiateInterBranchTransfer, 
  receiveInterBranchTransfer, 
  cancelInterBranchTransfer 
} from '@/lib/actions/interBranchTransfer';

// --- SCHEMAS ---

const transferSchema = z.object({
  fromBranchId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  skuId: z.string().uuid('Select a product'),
  qty: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Qty must be > 0"),
  notes: z.string().max(500, 'Max 500 chars').optional(),
}).refine(data => data.fromBranchId !== data.toBranchId, {
  message: "Origin and Destination must be different",
  path: ["toBranchId"],
});

type TransferFormValues = z.infer<typeof transferSchema>;

// --- TYPES ---

interface IBTRecord {
  id: string;
  from_branch_id: string;
  to_branch_id: string;
  sku_id: string;
  qty: string;
  status: 'in_transit' | 'received' | 'cancelled';
  initiated_at: string;
  notes: string;
  from_branch: { name: string; code: string };
  to_branch: { name: string; code: string };
  sku: { name: string; sku_code: string };
}

// --- MAIN COMPONENT ---

export default function InterBranchTransferPage() {
  const { t } = usePersona();
  const { activeBranchId, branches } = useBranchStore();
  const { profile } = useBusinessProfile();
  const { tier, isLoading: isLicenseLoading } = useLicense();
  const supabase = createClient();
  const toast = useToast();

  const [history, setHistory] = useState<IBTRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'in_transit' | 'received' | 'cancelled'>('all');
  const [skus, setSkus] = useState<any[]>([]);
  const [skuSearch, setSkuSearch] = useState('');
  const [selectedSku, setSelectedSku] = useState<any | null>(null);
  const [isReceiving, setIsReceiving] = useState<string | null>(null);

  // Form setup
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, control } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromBranchId: activeBranchId || '',
      qty: '0'
    }
  });

  const watchedFromBranchId = useWatch({ control, name: 'fromBranchId' });

  // Fetch History
  const fetchHistory =  useCallback (async () => {
    if (!profile?.id) return;
    let query = supabase
      .from('inter_branch_transfers')
      .select('*, from_branch:branches!from_branch_id(name, code), to_branch:branches!to_branch_id(name, code), sku:skus(name, sku_code)')
      .eq('business_id', profile.id)
      .order('initiated_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    if (data) setHistory(data as any);
  }, [profile?.id, filter, supabase]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Debounced SKU Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (skuSearch.length < 2) {
        setSkus([]);
        return;
      }
      const { data } = await supabase
        .from('skus')
        .select('*')
        .eq('branch_id', watchedFromBranchId)
        .or(`name.ilike.%${skuSearch}%,sku_code.ilike.%${skuSearch}%`)
        .limit(5);
      if (data) setSkus(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [skuSearch, watchedFromBranchId, supabase]);

  const onInitiate = async (data: TransferFormValues) => {
    try {
      await initiateInterBranchTransfer({
        ...data,
        businessId: profile!.id,
        userId: (await supabase.auth.getUser()).data.user!.id
      });
      reset();
      setSelectedSku(null);
      setSkuSearch('');
      fetchHistory();
      toast.success('Transfer initiated successfully');
    } catch (err: any) {
      toast.error(humanizeError(err, 'initiate transfer'));
    }
  };

  const handleReceive = async (transferId: string) => {
    try {
      await receiveInterBranchTransfer(transferId, (await supabase.auth.getUser()).data.user!.id);
      setIsReceiving(null);
      fetchHistory();
      toast.success('Transfer received and stock updated');
    } catch (err: any) {
      toast.error(humanizeError(err, 'receive transfer'));
    }
  };

  // Table Columns
  const columnHelper = createColumnHelper<IBTRecord>();
  const columns = useMemo(() => [
    columnHelper.accessor('id', {
      header: () => <span className="text-[10px] uppercase tracking-widest text-gray-500">Ref</span>,
      cell: info => <span className="font-mono text-sandstone-gold font-bold text-[10px]">{info.getValue().substring(0, 8)}</span>,
    }),
    columnHelper.accessor('sku', {
      header: () => <span className="text-[10px] uppercase tracking-widest text-gray-500">Product</span>,
      cell: info => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white uppercase tracking-tight">{info.getValue().name}</span>
          <span className="text-[9px] text-gray-500 font-mono">{info.getValue().sku_code}</span>
        </div>
      ),
    }),
    columnHelper.accessor('qty', {
      header: () => <span className="text-[10px] uppercase tracking-widest text-gray-500 text-right">Qty</span>,
      cell: info => <span className="font-mono text-white text-right block">{info.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: () => <span className="text-[10px] uppercase tracking-widest text-gray-500">State</span>,
      cell: info => {
        const status = info.getValue();
        return (
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-sm inline-block border",
            status === 'in_transit' && "text-electric-blue bg-electric-blue/10 border-electric-blue/20",
            status === 'received' && "text-emerald bg-emerald/10 border-emerald/20",
            status === 'cancelled' && "text-gray-500 bg-white/5 border-white/5 italic"
          )}>
            {status.replace('_', ' ')}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      cell: info => {
        const record = info.row.original;
        if (record.status === 'in_transit') {
          return (
            <button 
              onClick={() => setIsReceiving(record.id)}
              className="text-[9px] font-black uppercase tracking-widest bg-emerald/10 text-emerald border border-emerald/20 px-3 py-1 hover:bg-emerald hover:text-onyx transition-all"
            >
              Receive
            </button>
          );
        }
        return null;
      }
    })
  ], [columnHelper]);

  const table = useReactTable({
    data: history,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-8 h-[calc(100vh-64px)] overflow-hidden flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-electric-blue/10 text-electric-blue rounded-sm">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-[0.2em]">Inter-Branch Logistics</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Cross-Site Asset Orchestration v13.0</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* LEFT PANEL: Initiation */}
        <div className="col-span-12 lg:col-span-4 flex flex-col space-y-6 bg-surface border border-white/5 p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center space-x-2 text-electric-blue">
            <Package size={16} />
            <h2 className="text-xs font-black uppercase tracking-widest">Initiate Transfer</h2>
          </div>

          <form onSubmit={handleSubmit(onInitiate)} className="space-y-5">
            {/* Origin Branch */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Origin Site</label>
              <select 
                {...register('fromBranchId')}
                className="w-full bg-onyx border border-white/5 px-4 py-3 text-xs text-white outline-none focus:border-electric-blue transition-colors appearance-none"
              >
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
            </div>

            {/* Destination Branch */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Destination Site</label>
              <select 
                {...register('toBranchId')}
                className="w-full bg-onyx border border-white/5 px-4 py-3 text-xs text-white outline-none focus:border-electric-blue transition-colors appearance-none"
              >
                <option value="">Select Destination</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
              {errors.toBranchId && <p className="text-[9px] text-critical-red uppercase font-bold">{errors.toBranchId.message}</p>}
            </div>

            {/* SKU Search */}
            <div className="space-y-2 relative">
              <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Select Item</label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-gray-600" size={14} />
                <input 
                  type="text"
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  className="w-full bg-onyx border border-white/5 pl-12 pr-4 py-3 text-xs text-white outline-none focus:border-electric-blue transition-colors"
                  placeholder="Search SKU or Name..."
                />
              </div>
              
              {/* SKU Results */}
              {skus.length > 0 && !selectedSku && (
                <div className="absolute top-full left-0 w-full bg-surface border border-white/10 shadow-2xl z-20 mt-1">
                  {skus.map(sku => (
                    <button
                      key={sku.id}
                      type="button"
                      onClick={() => {
                        setSelectedSku(sku);
                        setValue('skuId', sku.id);
                        setSkuSearch(sku.name);
                        setSkus([]);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 text-left group"
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white uppercase">{sku.name}</span>
                        <span className="text-[8px] font-mono text-gray-500">{sku.sku_code}</span>
                      </div>
                      <span className="text-[9px] font-mono text-sandstone-gold font-bold">{sku.qty_on_hand} {sku.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Qty */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Quantity to Transfer</label>
                {selectedSku && (
                  <span className="text-[9px] font-mono text-sandstone-gold uppercase font-bold">
                    Available: {selectedSku.qty_on_hand} {selectedSku.unit}
                  </span>
                )}
              </div>
              <input 
                {...register('qty')}
                type="number" step="any"
                className="w-full bg-onyx border border-white/5 px-4 py-3 text-sm text-white outline-none focus:border-electric-blue transition-colors font-mono"
              />
              {errors.qty && <p className="text-[9px] text-critical-red uppercase font-bold">{errors.qty.message}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Logistics Notes</label>
              <textarea 
                {...register('notes')}
                rows={2}
                className="w-full bg-onyx border border-white/5 px-4 py-3 text-xs text-white outline-none focus:border-electric-blue transition-colors resize-none"
                placeholder="Driver details, vehicle number, etc."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-electric-blue transition-all duration-500 shadow-lg shadow-electric-blue/10 disabled:opacity-30"
            >
              {isSubmitting ? 'Processing Network...' : 'Commence Transfer'}
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: History */}
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-4 bg-surface border border-white/5 min-h-0">
          <div className="flex items-center justify-between p-6 pb-2 shrink-0">
            <div className="flex items-center space-x-2 text-sandstone-gold">
              <History size={16} />
              <h2 className="text-xs font-black uppercase tracking-widest">Logistic Audit Trail</h2>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-onyx p-1 border border-white/5">
              {['all', 'in_transit', 'received', 'cancelled'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={cn(
                    "px-3 py-1.5 text-[8px] font-black uppercase tracking-widest transition-all",
                    filter === f ? "bg-white text-onyx" : "text-gray-500 hover:text-white"
                  )}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30 space-y-4 grayscale">
                <Truck size={48} />
                <span className="text-[10px] font-black uppercase tracking-widest">No Logistical Activity</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface z-10">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="border-b border-white/5 bg-white/[0.02]">
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="px-6 py-4 font-normal">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Receive Confirmation Dialog */}
      <AnimatePresence>
        {isReceiving && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReceiving(null)} className="absolute inset-0 bg-onyx/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-surface border border-emerald/20 p-8 shadow-2xl">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 bg-emerald/10 text-emerald rounded-full">
                  <ShieldCheck size={40} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-widest">Logistics Acknowledgement</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Confirming receipt of industrial assets at destination site.</p>
                </div>
                
                {(() => {
                  const transfer = history.find(h => h.id === isReceiving);
                  if (!transfer) return null;
                  return (
                    <div className="w-full bg-onyx/50 border border-white/5 p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase tracking-widest text-gray-600">Product</span>
                        <span className="text-[10px] font-bold text-white uppercase">{transfer.sku.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase tracking-widest text-gray-600">Quantity</span>
                        <span className="text-[10px] font-mono text-sandstone-gold font-bold">{transfer.qty}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase tracking-widest text-gray-600">Origin</span>
                        <span className="text-[10px] font-bold text-white uppercase">{transfer.from_branch.name}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex w-full space-x-3">
                  <button onClick={() => setIsReceiving(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white border border-white/5 transition-all">Cancel</button>
                  <button onClick={() => handleReceive(isReceiving)} className="flex-1 py-4 bg-emerald text-onyx text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Acknowledge Receipt</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

