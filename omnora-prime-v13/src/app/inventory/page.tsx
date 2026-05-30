"use client";

import React, { useMemo, useState, useRef, useEffect } from 'react';
import Link from "next/link";
import { useQuery, useQueryClient, QueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { usePersona } from "@/hooks/usePersona";
import { 
  Plus, Search, Download, Upload, 
  MoreVertical, Edit, Trash2, ArrowUpDown,
  AlertCircle, CheckCircle2, X, Package,
  History, MapPin, Layers, Info, Briefcase, Barcode,
  Calendar, Zap, TrendingDown, Eye, MessageCircle
} from "lucide-react";
import { sendWhatsAppAlert, ALERT_TEMPLATES } from "@/lib/whatsapp/alertEngine";
import { useBarcodeScan } from "@/hooks/useBarcodeScan";
import { useVirtualizer } from '@tanstack/react-virtual';
import ForecastBadge from "@/components/intelligence/ForecastBadge";
import { useFloorVoice } from "@/hooks/useFloorVoice";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/useToast";
import { emitSkuPriceSignal } from "@/lib/network/signalCollector";

import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/ui/EmptyState"; // Keep if needed for subcomponents, but we'll import from StateViews
import { ErrorState, EmptyState as NewEmptyState, FieldError } from "@/components/ui/StateViews";
import DataFreshness from "@/components/ui/DataFreshness";
import { useDebounce } from "@/hooks/useDebounce";
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  Row,
  Cell
} from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import FinancialAmount from "@/components/ui/FinancialAmount";
import { useRowHighlight } from "@/hooks/useRowHighlight";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

// --- Types ---

interface SKU {
  id: string;
  sku_code: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  current_location: 'karkhana' | 'warehouse' | 'retail_shop' | 'in_transit' | 'disposed';
  qty_on_hand: number;
  qty_reserved: number;
  reorder_level: number;
  cost_price: number | null;
  sale_price: number | null;
  barcode: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
}

const columnHelper = createColumnHelper<SKU>();

// --- Validation Schemas ---

const skuSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200, "Name must be under 200 characters"),
  sku_code: z.string().min(1, "SKU code is required"),
  category: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  cost_price: z.coerce.number().min(0, "Cost price cannot be negative"),
  sale_price: z.coerce.number().min(0, "Sale price cannot be negative"),
  reorder_level: z.coerce.number().min(0, "Reorder point cannot be negative"),
  current_location: z.enum(['karkhana', 'warehouse', 'retail_shop', 'in_transit', 'disposed']),
  description: z.string().max(500, "Description too long").optional(),
  barcode: z.string().optional(),
});

type SKUFormValues = z.infer<typeof skuSchema>;

const adjustStockSchema = z.object({
  type: z.enum(['add', 'remove', 'set']),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  reason: z.enum(['Purchase Received', 'Sale Return', 'Damaged', 'Theft', 'Count Correction', 'Other']),
  notes: z.string().optional(),
});

type AdjustStockValues = z.infer<typeof adjustStockSchema>;



export default function InventoryPage() {
  const { profile } = useBusinessProfile();
  const { t, fmt, term } = usePersona();
  const toast = useToast();

  const supabase = createClient();
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [prefilledBarcode, setPrefilledBarcode] = useState<string>("");
  const [adjustingSKU, setAdjustingSKU] = useState<SKU | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isScannerFlashing, setIsScannerFlashing] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  // Floor Voice Operations
  const { startListening, isListening: isVoiceListening, speak } = useFloorVoice([
    {
      command: 'Check Stock',
      triggers: ['check stock', 'how much', 'kitna maal hai', 'stock check'],
      action: (p) => {
        const found = skus.find(s => s.sku_code.toLowerCase().includes(p.raw.replace(/check stock|how much/g, '').trim()));
        if (found) speak(`${found.name} has ${found.qty_on_hand} ${found.unit} on hand.`);
        else speak("Product not found in current view.");
      }
    },
    {
      command: 'Log Production',
      triggers: ['log production', 'entry karo', 'add stock'],
      action: (p) => {
        if (p.quantity) speak(`Logging production of ${p.quantity} units. Please confirm SKU.`);
        else speak("Please specify the quantity to log.");
      }
    },
    {
        command: 'Status Report',
        triggers: ['status', 'report', 'halat'],
        action: () => speak(`Inventory Hub active. ${skus.length} SKUs synced. Total stock value ${fmt(skus.reduce((a, s) => a + (s.qty_on_hand * (s.cost_price || 0)), 0))}.`)
    }
  ]);

  // Barcode Scanner Integration
  useBarcodeScan((code) => {
    setIsScannerFlashing(true);
    setTimeout(() => setIsScannerFlashing(false), 500);

    const foundSKU = skus.find(s => s.barcode === code);
    if (foundSKU) {
      setAdjustingSKU(foundSKU);
    } else {
      setPrefilledBarcode(code);
      setIsAddModalOpen(true);
    }
  });

  // Data Fetching
  const { data: skus = [], isLoading: skusLoading, error: skusError, refetch: refetchSkus } = useQuery({
    queryKey: ['inventory', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skus')
        .select('*')
        .eq('business_id', profile?.id)
        .order('name', { ascending: true });
      if (error) throw error;
      setLastFetchedAt(new Date());
      return data as SKU[];
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Derived Categories
  const categories = useMemo(() => {
    const cats = new Set(skus.map(s => s.category).filter((c): c is string => !!c));
    return ["All", ...Array.from(cats)];
  }, [skus]);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return skus.filter(sku => {
      const matchesSearch = sku.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                            sku.sku_code.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = categoryFilter === "All" || sku.category === categoryFilter;
      
      let matchesStatus = true;
      if (statusFilter === "In Stock") matchesStatus = sku.qty_on_hand > sku.reorder_level;
      if (statusFilter === "Low Stock") matchesStatus = sku.qty_on_hand <= sku.reorder_level && sku.qty_on_hand > 0;
      if (statusFilter === "Out of Stock") matchesStatus = sku.qty_on_hand === 0;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [skus, debouncedSearch, categoryFilter, statusFilter]);

  // Table Config
  const columns = useMemo(() => [
    columnHelper.accessor("sku_code", {
      header: "SKU Code",
      cell: (info) => <span className="font-mono text-sandstone-gold text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor("name", {
      header: "Product Name",
      cell: (info) => <span className="text-white text-sm font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("category", {
      header: "Category",
      cell: (info) => (
        <span className="px-2 py-0.5 bg-white/5 text-[10px] uppercase font-bold text-gray-400 rounded-sm">
          {info.getValue() || "Uncategorized"}
        </span>
      ),
    }),
    columnHelper.accessor("qty_on_hand", {
      header: () => <div className="text-right">On Hand</div>,
      cell: (info) => {
        const qty = Number(info.getValue());
        return (
          <FinancialAmount 
            value={qty} 
            isQuantity 
            unit={info.row.original.unit} 
            useGold={false}
          />
        );
      },
    }),
    columnHelper.display({
      id: "status",
      header: "Status",
      cell: (info) => {
        const qty = info.row.original.qty_on_hand;
        const reorder = info.row.original.reorder_level;
        if (qty === 0) return <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-sm">OUT OF STOCK</span>;
        if (qty <= reorder) return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded-sm">LOW STOCK</span>;
        return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-sm">OK</span>;
      },
    }),
    columnHelper.accessor("unit", {
      header: "Unit",
      cell: (info) => <span className="text-gray-500 text-[10px] uppercase font-mono">{info.getValue()}</span>,
    }),
    columnHelper.accessor("cost_price", {
      header: () => <div className="text-right">Cost</div>,
      cell: (info) => <FinancialAmount value={info.getValue()} />,
    }),
    columnHelper.accessor("sale_price", {
      header: () => <div className="text-right">Sale</div>,
      cell: (info) => <FinancialAmount value={info.getValue()} />,
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => <TableActions sku={info.row.original} onAdjust={() => setAdjustingSKU(info.row.original)} />,
    }),
  ], [fmt, profile?.id]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 100000 } // Effectively disable pagination for virtualization
    }
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52, // Height of SKURow
    overscan: 10,
  });

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["SKU Code", "Name", "Category", "Qty", "Unit", "Cost Price", "Sale Price", "Location"];
    const rows = filteredData.map(s => [
      s.sku_code, s.name, s.category || "", s.qty_on_hand, s.unit, s.cost_price || 0, s.sale_price || 0, s.current_location
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `noxis-inventory-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (!skus || skus.length === 0) {
      toast.error('No data to export')
      return
    }
    
    const data = skus.map((sku: SKU) => ({
      'SKU Code': sku.sku_code,
      'Product Name': sku.name,
      'Category': sku.category || '',
      'Unit': sku.unit,
      'Qty on Hand': sku.qty_on_hand,
      'Cost Price': sku.cost_price,
      'Sale Price': sku.sale_price,
      'Reorder Level': sku.reorder_level || 0,
      'Status': sku.is_active ? 'Active' : 'Inactive',
    }))
    
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
    XLSX.writeFile(wb,
      `noxis_inventory_${new Date().toISOString().split('T')[0]}.xlsx`
    )
    
    toast.success('Inventory exported to Excel')
  }

  // Table Config

  if (skusLoading) return (
    <div className="p-6 bg-[#121417]">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <TableSkeleton rows={10} cols={6} />
    </div>
  );

  if (skusError) return (
    <div className="h-screen bg-[#121417] flex items-center justify-center p-8">
      <ErrorState
        message="Could not load inventory data"
        detail={(skusError as Error).message}
        onRetry={refetchSkus}
      />
    </div>
  );

  if (!skus || skus.length === 0) return (
    <div className="min-h-screen bg-[#121417] text-slate-200 p-6 flex flex-col justify-center">
      <NewEmptyState
        icon="📦"
        title="No products yet"
        description="Add your first product to start tracking inventory"
        action={{ label: 'Add product', onClick: () => setIsAddModalOpen(true) }}
      />
      <AnimatePresence>
        {isAddModalOpen && (
          <AddProductModal 
            initialBarcode={prefilledBarcode}
            onClose={() => { setIsAddModalOpen(false); setPrefilledBarcode(""); }} 
            onSuccess={(msg) => { setSuccessToast(msg); setIsAddModalOpen(false); setPrefilledBarcode(""); queryClient.invalidateQueries({ queryKey: ['inventory'] }); }}
          />
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121417] text-slate-200 p-6">
      <main className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              {term('inventory') || "Inventory Hub"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage your stock and products
            </p>
          </div>
             <div className="flex items-center gap-3">
                <button 
                  onClick={startListening}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm",
                    isVoiceListening ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-gray-500 hover:text-white"
                  )}
                >
                  <Eye size={14} />
                  <span>{isVoiceListening ? 'Listening...' : 'Voice Assist'}</span>
                </button>
                <DataFreshness 
                  lastFetchedAt={lastFetchedAt} 
                  onRefresh={() => queryClient.invalidateQueries({ queryKey: ['inventory'] })} 
                />
             </div>
        </div>
          {/* Filters & Actions Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center bg-surface border border-white/5 p-4">
             <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search SKU or Product Name..." 
                  className="w-full bg-onyx border border-white/5 pl-10 pr-4 py-2 text-xs text-white focus:border-electric-blue/50 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             
            <div className="flex items-center gap-3">
               <Link 
                 href="/inventory/import"
                 className="flex items-center space-x-2 px-4 py-2 border border-electric-blue/30 text-electric-blue text-[10px] uppercase tracking-widest font-bold hover:bg-electric-blue/5 transition-all"
               >
                   <Upload size={14} />
                   <span className="hidden sm:inline">Import</span>
               </Link>
             </div>

             <div className="flex items-center space-x-3 w-full md:w-auto">
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-electric-blue text-onyx text-[10px] uppercase tracking-widest font-bold hover:brightness-110 transition-all shadow-lg"
                >
                    <Plus size={14} />
                    <span>Add SKU</span>
                </button>

                <button 
                  onClick={() => setAdjustingSKU(skus[0])} // Just a shortcut for quick adjustment
                  className="flex items-center space-x-2 px-4 py-2 border border-white/10 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-all"
                >
                    <Zap size={14} />
                    <span>Quick Adjust</span>
                </button>

                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-onyx border border-white/5 px-4 py-2 text-[10px] uppercase font-bold text-gray-400 outline-none focus:border-electric-blue/50"
                >
                   {categories.map(cat => <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>)}
                </select>

                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-onyx border border-white/5 px-4 py-2 text-[10px] uppercase font-bold text-gray-400 outline-none focus:border-electric-blue/50"
                >
                   <option value="All">All Status</option>
                   <option value="In Stock">In Stock</option>
                   <option value="Low Stock">Low Stock</option>
                   <option value="Out of Stock">Out of Stock</option>
                </select>

                <button 
                  onClick={handleExportCSV}
                  className="p-2 border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                  title="Export CSV"
                >
                   <Download size={16} />
                </button>

                <button onClick={exportToExcel}
                  className="flex items-center gap-1.5
                    px-3 py-1.5 text-xs font-medium
                    border border-white/10 text-gray-400
                    hover:border-white/20 hover:text-white
                    transition-colors">
                  ↓ Export Excel
                </button>
             </div>
          </div>

          {/* Table Container */}
          <div className="bg-surface border border-white/5">
             {skusLoading ? (
               <div className="h-64 flex items-center justify-center space-x-3">
                  <div className="w-2 h-2 bg-electric-blue animate-bounce" />
                  <div className="w-2 h-2 bg-electric-blue animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-electric-blue animate-bounce delay-200" />
               </div>
             ) : skus.length === 0 ? (
                <EmptyState 
                  icon={Package}
                  page="inventory"
                  action={{
                    label: "Register First Product",
                    onClick: () => setIsAddModalOpen(true)
                  }}
                />
             ) : (
               <div className="overflow-x-auto max-h-[700px] relative scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/5" ref={parentRef}>
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-[#0F1114]">
                        {table.getHeaderGroups().map(headerGroup => (
                          <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                              <th 
                                key={header.id} 
                                className="px-4 py-3 text-left text-xxs font-semibold tracking-wide-md uppercase text-gray-500 border-b border-white/8 cursor-pointer hover:text-white transition-colors"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <div className="flex items-center space-x-2">
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  {header.column.getCanSort() && <ArrowUpDown size={10} />}
                                </div>
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                     <tbody 
                       style={{ 
                         height: `${rowVirtualizer.getTotalSize()}px`,
                         position: 'relative'
                       }}
                     >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                          const row = rows[virtualRow.index];
                          return (
                            <SKURow 
                              key={row.id} 
                              row={row} 
                              i={virtualRow.index} 
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`
                              }}
                            />
                          );
                        })}
                     </tbody>
                  </table>
                  
                  {/* Pagination */}
                  <div className="p-4 border-t border-white/5 flex items-center justify-between text-[10px] uppercase font-bold text-gray-600">
                     <div className="flex items-center space-x-2">
                        <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
                     </div>
                     <div className="flex items-center space-x-1">
                        <button 
                          disabled={!table.getCanPreviousPage()}
                          onClick={() => table.previousPage()}
                          className="px-3 py-1 bg-onyx border border-white/5 hover:bg-white/5 disabled:opacity-30"
                        >Prev</button>
                        <button 
                          disabled={!table.getCanNextPage()}
                          onClick={() => table.nextPage()}
                          className="px-3 py-1 bg-onyx border border-white/5 hover:bg-white/5 disabled:opacity-30"
                        >Next</button>
                     </div>
                  </div>
               </div>
             )}
          </div>
      </main>
      
      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddProductModal 
            initialBarcode={prefilledBarcode}
            onClose={() => { setIsAddModalOpen(false); setPrefilledBarcode(""); }} 
            onSuccess={(msg) => { setSuccessToast(msg); setIsAddModalOpen(false); setPrefilledBarcode(""); queryClient.invalidateQueries({ queryKey: ['inventory'] }); }}
          />
        )}
        {adjustingSKU && (
          <AdjustStockModal 
            sku={adjustingSKU} 
            onClose={() => setAdjustingSKU(null)} 
            onSuccess={(msg) => { setSuccessToast(msg); setAdjustingSKU(null); queryClient.invalidateQueries({ queryKey: ['inventory'] }); }}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
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

const SKURow = React.memo(function SKURow({ row, i, style }: { row: Row<SKU>, i: number, style?: React.CSSProperties }) {
  const controls = useRowHighlight(row.original.qty_on_hand);
  
  return (
    <motion.tr 
      initial={{ opacity: 0, y: 5 }}
      animate={controls}
      custom={controls}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.01 }}
      style={style}
      className="border-b border-white/4 hover:bg-white/[0.02] transition-colors cursor-pointer"
    >
      {row.getVisibleCells().map((cell: Cell<SKU, any>) => (
        <td key={cell.id} className="px-4 py-2.5 text-sm text-gray-200 border-b border-white/[0.04]">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </motion.tr>
  );
});


// --- Sub-Components ---

function TableActions({ sku, onAdjust }: { sku: SKU, onAdjust: () => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { profile } = useBusinessProfile();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleDelete = async () => {
    if (!confirm(`Permanently delete ${sku.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from('skus').delete().eq('id', sku.id);
    if (!error) queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  return (
    <div className="relative flex justify-end" ref={containerRef}>
       <button 
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-600 hover:text-white transition-colors"
       >
          <MoreVertical size={16} />
       </button>

       {open && (
         <div className="absolute right-0 top-10 w-48 bg-surface border border-white/10 shadow-2xl z-50 py-1">
            {sku.qty_on_hand <= sku.reorder_level && (
              <button 
                onClick={() => {
                  const msg = ALERT_TEMPLATES.low_stock({ name: sku.name, qty: String(sku.qty_on_hand), unit: sku.unit, reorderLevel: String(sku.reorder_level) });
                  sendWhatsAppAlert(profile?.phone || '', msg);
                }}
                className="w-full px-4 py-2.5 text-left text-[10px] uppercase font-black text-[#25D366] hover:bg-[#25D366]/5 flex items-center space-x-3"
              >
                 <MessageCircle size={14} />
                 <span>Send Low Stock Alert</span>
              </button>
            )}
            <button onClick={onAdjust} className="w-full px-4 py-2.5 text-left text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:bg-white/5 flex items-center space-x-3">
               <History size={14} />
               <span>Adjust Stock</span>
            </button>
            <button className="w-full px-4 py-2.5 text-left text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:bg-white/5 flex items-center space-x-3">
               <Edit size={14} />
               <span>Edit Details</span>
            </button>
            <div className="h-px bg-white/5 my-1" />
            <button onClick={handleDelete} className="w-full px-4 py-2.5 text-left text-[10px] uppercase font-bold text-critical-red hover:bg-critical-red/10 flex items-center space-x-3">
               <Trash2 size={14} />
               <span>Delete SKU</span>
            </button>
         </div>
       )}
    </div>
  );
}

function AddProductModal({ onClose, onSuccess, initialBarcode }: { onClose: () => void, onSuccess: (msg: string) => void, initialBarcode?: string }) {
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SKUFormValues>({
    resolver: zodResolver(skuSchema),
    mode: "onChange",
    defaultValues: {
      unit: "pcs",
      current_location: "warehouse",
      cost_price: 0,
      sale_price: 0,
      reorder_level: 10,
      barcode: initialBarcode || ""
    }
  });

  const watchCostPrice = watch("cost_price") || 0;
  const watchSalePrice = watch("sale_price") || 0;
  const showPriceWarning = watchSalePrice > 0 && watchCostPrice > 0 && watchSalePrice < watchCostPrice;

  useEffect(() => {
    if (initialBarcode) {
      setValue("barcode", initialBarcode);
    }
  }, [initialBarcode, setValue]);

  const productName = watch("name");

  // Auto-generate SKU Code
  useEffect(() => {
    if (productName && productName.length >= 3) {
      const prefix = productName.substring(0, 3).toUpperCase();
      const random = Math.floor(1000 + Math.random() * 9000);
      setValue("sku_code", `${prefix}-${random}`);
    }
  }, [productName, setValue]);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Image must be under 2MB");
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values: SKUFormValues) => {
    setIsSubmitting(true);
    try {
      // 0. Security & Context Check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("AUTHENTICATION_REQUIRED: Your session has expired. Please sign in again.");
      }

      if (!profile?.id) {
        throw new Error("BUSINESS_CONTEXT_MISSING: We couldn't detect your business profile. Please refresh the page.");
      }

      // 1. Insert SKU
      const { data: sku, error: insertError } = await supabase
        .from('skus')
        .insert({
          ...values,
          business_id: profile.id,
          qty_on_hand: 0, 
          qty_reserved: 0,
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error("Supabase SKU Insert Error:", insertError);
        throw new Error(`DATABASE_REJECT: ${insertError.message} (Code: ${insertError.code})`);
      }

      // Telemetry — Emit anonymous SKU price signal silently
      if (profile?.industry_key && profile?.city && values.cost_price) {
        emitSkuPriceSignal(
          profile.industry_key,
          profile.city,
          profile.country_code || 'PK',
          values.category || 'general',
          values.cost_price,
          values.unit
        ).catch(() => {});
      }

      // 2. Upload Image if provided
      if (selectedFile && sku) {
        const ext = selectedFile.name.split('.').pop();
        const path = `${profile.id}/${sku.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('sku-images')
          .upload(path, selectedFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('sku-images').getPublicUrl(path);
          await supabase.from('skus').update({ thumbnail_url: publicUrl }).eq('id', sku.id);
        }
      }

      onSuccess(`Successfully committed ${values.name} to the registry.`);
    } catch (err: unknown) {
      const error = err as Error;
      alert(`SKU REGISTRATION FAILED\n\n${error.message}`);
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
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-xl bg-surface border-l border-white/5 h-full flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.5)]"
       >
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center space-x-3">
                <div className="p-3 bg-electric-blue/10 text-electric-blue rounded-sm">
                   <Package size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Onboard New SKU</h2>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Inventory Management System v9.0</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
             {/* Basic Info */}
             <div className="space-y-6">
                <SectionHeader icon={Info} label="General Specification" />
                
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2 col-span-2">
                      <Label>Product Name</Label>
                      <Input {...register("name")} placeholder="e.g. Industrial Drill Bits" />
                      <FieldError message={errors.name?.message} />
                   </div>
                   <div className="space-y-2">
                      <Label>SKU Code</Label>
                      <Input {...register("sku_code")} placeholder="GEN-1234" />
                      <FieldError message={errors.sku_code?.message} />
                   </div>
                   <div className="space-y-2">
                      <Label>Category</Label>
                      <Input {...register("category")} placeholder="e.g. Tools" list="cats-list" />
                   </div>
                   <div className="space-y-2">
                      <Label>Barcode (EAN/UPC)</Label>
                      <Input {...register("barcode")} placeholder="Scan or type barcode..." />
                   </div>
                </div>
             </div>

             {/* Logistics */}
             <div className="space-y-6">
                <SectionHeader icon={MapPin} label="Logistics & Storage" />
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label>Primary Unit</Label>
                      <select {...register("unit")} className="w-full bg-onyx border border-white/10 p-3 text-xs text-white outline-none focus:border-electric-blue transition-all">
                         <option value="pcs">Pieces (PCS)</option>
                         <option value="kg">Kilograms (KG)</option>
                         <option value="meters">Meters (M)</option>
                         <option value="liters">Liters (L)</option>
                         <option value="box">Box</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <Label>Default Location</Label>
                      <select {...register("current_location")} className="w-full bg-onyx border border-white/10 p-3 text-xs text-white outline-none focus:border-electric-blue transition-all">
                         <option value="warehouse">Warehouse</option>
                         <option value="karkhana">Karkhana</option>
                         <option value="retail_shop">Retail Shop</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <Label>Reorder Threshold</Label>
                      <Input type="number" {...register("reorder_level")} />
                   </div>
                </div>
             </div>

             {/* Pricing */}
             <div className="space-y-6">
                <SectionHeader icon={Layers} label="Financial Ledger" />
                <div className="grid grid-cols-2 gap-6 p-6 bg-onyx/50 border border-white/5">
                   <div className="space-y-2">
                      <Label>Cost Price (Per Unit)</Label>
                      <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sandstone-gold font-mono text-[10px]">{profile?.currency || 'PKR'}</span>
                         <input type="number" step="0.01" {...register("cost_price")} className="w-full bg-onyx border border-white/10 pl-10 pr-4 py-3 font-mono text-sm text-sandstone-gold focus:border-sandstone-gold outline-none transition-all" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label>Retail Sale Price</Label>
                      <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sandstone-gold font-mono text-[10px]">{profile?.currency || 'PKR'}</span>
                         <input type="number" step="0.01" {...register("sale_price")} className="w-full bg-onyx border border-white/10 pl-10 pr-4 py-3 font-mono text-sm text-sandstone-gold focus:border-sandstone-gold outline-none transition-all" />
                      </div>
                      <FieldError message={errors.sale_price?.message} />
                      {showPriceWarning && (
                        <p className="text-xs text-amber-500 mt-1 flex items-center gap-1 font-medium font-sans">
                          <span>⚠</span> Warning: Sale price is below cost price
                        </p>
                      )}
                   </div>
                </div>
             </div>

             {/* Image Upload */}
             <div className="space-y-6">
                <SectionHeader icon={Upload} label="Digital Asset" />
                <div className="flex items-center space-x-6">
                   <div className="w-32 h-32 bg-onyx border border-dashed border-white/10 flex items-center justify-center relative overflow-hidden rounded-sm group">
                      {imagePreview ? (
                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      ) : (
                        <Upload size={24} className="text-gray-700 group-hover:text-electric-blue transition-colors" />
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={onImageChange} />
                   </div>
                   <div className="flex-1 space-y-2">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Recommended resolution: 800x800px</p>
                      <p className="text-[9px] text-gray-600 font-mono">Format: PNG, JPG, WEBP • Max: 2MB</p>
                   </div>
                </div>
             </div>
          </form>

          <div className="p-8 bg-onyx border-t border-white/5 flex items-center space-x-4">
             <button onClick={onClose} className="flex-1 py-4 text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors">Discard Draft</button>
             <button 
              onClick={handleSubmit(onSubmit)} 
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
             >
                {isSubmitting ? "Syncing Mesh..." : "Commit SKU to Registry"}
             </button>
          </div>
       </motion.div>
    </div>
  );
}

function AdjustStockModal({ sku, onClose, onSuccess }: { sku: SKU, onClose: () => void, onSuccess: (msg: string) => void }) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<AdjustStockValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      type: 'add',
      reason: 'Purchase Received'
    }
  });

  const onSubmit = async (values: AdjustStockValues) => {
    setIsSubmitting(true);
    try {
      let newQty = sku.qty_on_hand;
      if (values.type === 'add') newQty += values.quantity;
      if (values.type === 'remove') newQty = Math.max(0, newQty - values.quantity);
      if (values.type === 'set') newQty = values.quantity;

      const { error } = await supabase
        .from('skus')
        .update({ qty_on_hand: newQty })
        .eq('id', sku.id);

      if (error) throw error;

      onSuccess(`Updated ${sku.name} quantity to ${newQty}`);
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Failed to adjust stock: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
       <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-w-md w-full bg-surface border border-white/10 shadow-2xl overflow-hidden"
       >
          <div className="p-6 bg-onyx border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center space-x-3">
                <History className="text-electric-blue" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Inventory Correction</h3>
             </div>
             <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
             <div className="space-y-4">
                <div className="flex space-x-2">
                   {['add', 'remove', 'set'].map((t) => (
                     <label key={t} className="flex-1">
                        <input type="radio" {...register("type")} value={t} className="hidden peer" />
                        <div className="py-2 text-[10px] uppercase font-bold text-center border border-white/5 text-gray-500 peer-checked:bg-electric-blue peer-checked:text-onyx peer-checked:border-electric-blue cursor-pointer transition-all">
                           {t}
                        </div>
                     </label>
                   ))}
                </div>

                <div className="space-y-2">
                   <Label>Quantity to Adjust</Label>
                   <input type="number" {...register("quantity")} className="w-full bg-onyx border border-white/10 p-4 text-2xl font-mono text-center text-white focus:border-electric-blue outline-none transition-all" placeholder="0.00" />
                   {errors.quantity && <ErrorMsg>{errors.quantity.message}</ErrorMsg>}
                </div>

                <div className="space-y-2">
                   <Label>Reason Code</Label>
                   <select {...register("reason")} className="w-full bg-onyx border border-white/10 p-3 text-xs text-white outline-none">
                      <option>Purchase Received</option>
                      <option>Sale Return</option>
                      <option>Damaged</option>
                      <option>Theft</option>
                      <option>Count Correction</option>
                      <option>Other</option>
                   </select>
                </div>
             </div>

             <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 bg-sandstone-gold text-onyx text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all disabled:opacity-50"
             >
                {isSubmitting ? "Recalculating..." : "Finalize Correction"}
             </button>
          </form>
       </motion.div>
    </div>
  );
}

// --- Helpers ---

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType, label: string }) {
  return (
    <div className="flex items-center space-x-3 border-b border-white/5 pb-3">
       <Icon size={14} className="text-gray-500" />
       <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{label}</span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] uppercase font-bold text-gray-600 tracking-widest">{children}</label>;
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input ref={ref} {...props} className="w-full bg-onyx border border-white/10 p-3 text-sm text-white focus:border-electric-blue outline-none transition-all placeholder:text-gray-800" />
));
Input.displayName = "Input";

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] text-critical-red uppercase font-bold mt-1 flex items-center space-x-1">
    <AlertCircle size={10} />
    <span>{children}</span>
  </div>;
}

// Bulk CSV Import Helper
async function handleCSVImport(
  e: React.ChangeEvent<HTMLInputElement>, 
  businessId: string | undefined, 
  supabase: SupabaseClient, 
  queryClient: QueryClient, 
  setSuccess: (msg: string | null) => void
) {
  const file = e.target.files?.[0];
  if (!file || !businessId) return;

  const reader = new FileReader();
  reader.onload = async ({ target }) => {
    const csv = target?.result as string;
    const lines = csv.split('\n').filter(Boolean);
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const dataToInsert = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, string | number | boolean | null> = { business_id: businessId };
      headers.forEach((h, i) => {
        if (h.includes('code')) row.sku_code = values[i];
        if (h.includes('name')) row.name = values[i];
        if (h.includes('category')) row.category = values[i];
        if (h.includes('unit')) row.unit = values[i];
        if (h.includes('cost')) row.cost_price = Number(values[i]);
        if (h.includes('sale')) row.sale_price = Number(values[i]);
        if (h.includes('location')) row.current_location = values[i].toLowerCase().replace(' ', '_');
      });
      return row;
    });

    const { error } = await supabase.from('skus').insert(dataToInsert);
    if (!error) {
      setSuccess(`Imported ${dataToInsert.length} products successfully.`);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } else {
      alert(`Import failed: ${error.message}`);
    }
  };
  reader.readAsText(file);
}
