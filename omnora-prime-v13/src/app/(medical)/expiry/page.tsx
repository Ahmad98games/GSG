"use client";
import { useMemo, useState, useEffect } from 'react';
import React from 'react';
// src/app/(medical)/expiry/page.tsx
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable 
} from "@tanstack/react-table";
import { useMedicalBatches, useRecallMutation } from "@/hooks/useMedicalQueries";
import { usePersona } from "@/hooks/usePersona";
import { useSidebarState } from "@/hooks/useSidebarState";

import { cn } from "@/lib/utils";
import { 
  Search, ShieldAlert, 
  AlertTriangle, Thermometer
} from "lucide-react";
import { motion } from "framer-motion";

interface MedicalBatch {
  id: string;
  batch_number: string;
  sku: {
    name: string;
    unit: string;
  };
  expiry_date: string;
  quantity_remain: number;
  storage_temp_min: number;
  storage_temp_max: number;
  recall_status: 'clear' | 'under_review' | 'recalled';
}

const columnHelper = createColumnHelper<MedicalBatch>();

export default function ExpiryMonitorPage() {
  const { t, fmtDate } = usePersona();
  const { isCollapsed } = useSidebarState();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("expiring_soon");

  // Synchronize statusFilter with query parameter on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get('status');
      if (statusParam && ['all', 'expiring_soon', 'expired', 'recalled'].includes(statusParam)) {
        setStatusFilter(statusParam);
      }
    }
  }, []);
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useMedicalBatches({ search: searchTerm, status: statusFilter });

  const recallMutation = useRecallMutation();

  const flatData =  useMemo (() => data?.pages.flatMap(page => page.data) || [], [data]);

  const columns =  useMemo (() => [
    columnHelper.accessor("batch_number", {
      header: t('label_batch_no'),
      cell: (info) => <span className="font-mono text-electric-blue">{info.getValue()}</span>,
    }),
    columnHelper.accessor("sku.name", {
      header: t('label_product_name'),
      cell: (info) => <span className="font-medium text-white">{info.getValue()}</span>,
    }),
    columnHelper.accessor("expiry_date", {
      header: t('label_expiry_date'),
      cell: (info) => {
        const date = info.getValue();
        const daysLeft = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return (
          <div className="flex flex-col">
            <span className="text-white">{fmtDate(date)}</span>
            <span className={cn(
              "text-[9px] uppercase font-bold",
              daysLeft < 0 ? "text-critical-red" : daysLeft < 30 ? "text-critical-red" : daysLeft < 90 ? "text-sandstone-gold" : "text-emerald"
            )}>
              {daysLeft < 0 ? "EXPIRED" : `${daysLeft} Days Left`}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("quantity_remain", {
      header: t('label_qty_remaining'),
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-mono text-white">{Number(info.getValue()).toLocaleString()}</span>
          <span className="text-[9px] text-gray-500 uppercase">{info.row.original.sku.unit}</span>
        </div>
      ),
    }),
    columnHelper.accessor("storage_temp_min", {
      header: t('label_storage_temp'),
      cell: (info) => (
        <div className="flex items-center space-x-1 text-gray-400">
          <Thermometer size={12} />
          <span className="text-[10px] font-mono">
            {info.row.original.storage_temp_min}°C - {info.row.original.storage_temp_max}°C
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("recall_status", {
      header: t('label_status'),
      cell: (info) => {
        const status = info.getValue();
        return (
          <div className={cn(
            "px-2 py-1 text-[9px] uppercase font-bold inline-flex items-center space-x-1",
            status === 'clear' ? "text-emerald bg-emerald/10" : 
            status === 'under_review' ? "text-sandstone-gold bg-sandstone-gold/10" : 
            "text-critical-red bg-critical-red/10"
          )}>
            {status === 'recalled' && <ShieldAlert size={10} />}
            <span>{status}</span>
          </div>
        );
      }
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <button 
          onClick={() => {
            const reason = window.prompt("Reason for recall/review:");
            if (reason) recallMutation.mutate({ batchId: info.row.original.id, status: 'recalled', reason });
          }}
          className="p-1.5 hover:bg-white/5 text-gray-500 hover:text-critical-red transition-colors"
        >
          <AlertTriangle size={14} />
        </button>
      )
    })
  ], [t, fmtDate, recallMutation]);

  const tableOptions =  useMemo (() => ({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  }), [flatData, columns]);

  const table = useReactTable(tableOptions);

  

  return (
    <div className="min-h-screen bg-onyx text-slate-200">
      
      <main className={cn( "transition-all duration-300")}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <span>NOXIS Medical</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-electric-blue">{t('nav_compliance')}</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">Expiry Monitor</span>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="relative w-full md:w-96">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder={t('placeholder_search_batches')}
                className="w-full bg-surface border border-white/5 pl-10 pr-4 py-2 text-sm text-white focus:border-electric-blue outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 bg-surface border border-white/5 p-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'expiring_soon', label: 'Expiring Soon' },
                { id: 'expired', label: 'Expired' },
                { id: 'recalled', label: 'Under Recall' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all",
                    statusFilter === f.id ? "bg-electric-blue text-onyx" : "text-gray-500 hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-onyx/50 border-b border-white/5">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => {
                    const data = row.original;
                    const date = data.expiry_date;
                    const daysLeft = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    const isRecalled = data.recall_status === 'recalled';
                    
                    return (
                      <motion.tr 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={row.id} 
                        className={cn(
                          "border-b border-white/5 hover:bg-white/[0.02] transition-colors",
                          isRecalled ? "opacity-50 grayscale line-through bg-gray-900/50" : 
                          daysLeft < 30 ? "bg-critical-red/5" : 
                          daysLeft < 90 ? "bg-sandstone-gold/5" : ""
                        )}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-6 py-4 text-xs">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {hasNextPage && (
              <div className="p-4 border-t border-white/5 flex justify-center">
                <button 
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-2 bg-onyx border border-white/10 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-white"
                >
                  Load More Batches
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

