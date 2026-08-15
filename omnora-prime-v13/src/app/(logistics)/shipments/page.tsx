"use client";
import { useMemo, useState } from 'react';
import React from 'react';
// src/app/(logistics)/shipments/page.tsx
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable 
} from "@tanstack/react-table";
import { useShipments, useUpdateShipmentStatus } from "@/hooks/useLogisticsQueries";
import { usePersona } from "@/hooks/usePersona";
import { useSidebarState } from "@/hooks/useSidebarState";

import { cn } from "@/lib/utils";
import { 
  Search, Filter, Package, Truck, 
  Clock, CheckCircle, AlertTriangle, 
  LayoutGrid, List, MapPin, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const columnHelper = createColumnHelper<any>();

const STATUS_COLUMNS = [
  { id: 'booked', label: 'Booked', color: 'text-gray-400' },
  { id: 'in_transit', label: 'In Transit', color: 'text-electric-blue' },
  { id: 'out_for_delivery', label: 'Out for Delivery', color: 'text-sandstone-gold' },
  { id: 'delivered', label: 'Delivered', color: 'text-emerald' },
  { id: 'exception', label: 'Exception', color: 'text-critical-red' }
];

export default function ShipmentsPage() {
  const { t, fmtDate } = usePersona();
  const { isCollapsed } = useSidebarState();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState("");
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useShipments({ search: searchTerm });

  const updateStatus = useUpdateShipmentStatus();

  const flatData =  useMemo (() => data?.pages.flatMap(page => page.data) || [], [data]);

  const columns =  useMemo (() => [
    columnHelper.accessor("shipment_ref", {
      header: "Reference",
      cell: (info) => <span className="font-mono text-electric-blue">{info.getValue()}</span>,
    }),
    columnHelper.accessor("client.name", {
      header: "Client",
      cell: (info) => <span className="font-medium text-white">{info.getValue()}</span>,
    }),
    columnHelper.accessor("origin", {
      header: "Route",
      cell: (info) => (
        <div className="flex items-center space-x-2 text-gray-400">
          <span>{info.getValue()}</span>
          <ArrowRight size={10} className="opacity-30" />
          <span>{info.row.original.destination}</span>
        </div>
      ),
    }),
    columnHelper.accessor("sla_due_at", {
      header: "SLA Due",
      cell: (info) => {
        const date = info.getValue();
        if (!date) return "-";
        const hoursLeft = (new Date(date).getTime() - new Date().getTime()) / (1000 * 3600);
        return (
          <div className="flex flex-col">
            <span className="text-white">{new Date(date).toLocaleTimeString()}</span>
            <span className={cn(
              "text-[9px] uppercase font-bold",
              hoursLeft < 2 ? "text-critical-red" : hoursLeft < 24 ? "text-sandstone-gold" : "text-gray-500"
            )}>
              {hoursLeft < 0 ? "SLA MISSED" : `${hoursLeft.toFixed(1)}h Remaining`}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <span className={cn(
          "px-2 py-0.5 text-[9px] uppercase font-bold border",
          info.getValue() === 'delivered' ? "border-emerald/30 text-emerald bg-emerald/5" :
          info.getValue() === 'exception' ? "border-critical-red/30 text-critical-red bg-critical-red/5" :
          "border-white/10 text-gray-400"
        )}>
          {info.getValue()}
        </span>
      )
    })
  ], []);

  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  

  return (
    <div className="min-h-screen bg-onyx text-slate-200">
      
      <main className={cn( "transition-all duration-300")}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <span>NOXIS Logistics</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-electric-blue">Operations</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">Shipment Board</span>
          </div>
          
          <div className="ml-auto flex items-center space-x-2">
            <div className="flex items-center bg-white/5 p-1">
              <button 
                onClick={() => setViewMode('kanban')}
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === 'kanban' ? "bg-electric-blue text-onyx" : "text-gray-500 hover:text-white"
                )}
              >
                <LayoutGrid size={14} />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === 'table' ? "bg-electric-blue text-onyx" : "text-gray-500 hover:text-white"
                )}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1800px] mx-auto">
          <div className="flex items-center justify-between mb-8">
             <div className="relative w-full md:w-96">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search shipments..."
                className="w-full bg-surface border border-white/5 pl-10 pr-4 py-2 text-sm text-white focus:border-electric-blue outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-5 gap-6 h-[calc(100vh-250px)] min-w-[1200px]">
              {STATUS_COLUMNS.map(col => (
                <div key={col.id} className="flex flex-col bg-onyx/30 border border-white/5">
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className={cn("text-[10px] uppercase tracking-[0.2em] font-bold", col.color)}>{col.label}</h3>
                    <span className="text-[10px] text-gray-600 font-mono">
                      {flatData.filter(s => s.status === col.id).length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {flatData.filter(s => s.status === col.id).map(shipment => (
                      <motion.div
                        layoutId={shipment.id}
                        key={shipment.id}
                        className="bg-surface border border-white/5 p-4 group hover:border-white/20 transition-all cursor-move"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-mono text-[10px] text-electric-blue">{shipment.shipment_ref}</span>
                          <Truck size={12} className="text-gray-700" />
                        </div>
                        <p className="text-xs font-bold text-white mb-1">{shipment.client?.name}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-gray-500 mb-4">
                          <MapPin size={10} />
                          <span>{shipment.destination}</span>
                        </div>
                        
                        {shipment.sla_due_at && (
                          <div className="flex items-center justify-between border-t border-white/5 pt-3">
                            <div className="flex items-center space-x-1 text-[9px] text-gray-500 uppercase">
                              <Clock size={10} />
                              <span>SLA</span>
                            </div>
                            <span className={cn(
                              "text-[9px] font-bold",
                              (new Date(shipment.sla_due_at).getTime() - new Date().getTime()) / (1000 * 3600) < 2 ? "text-critical-red" : "text-gray-400"
                            )}>
                              {new Date(shipment.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}

                        <div className="mt-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <select 
                            onChange={(e) => updateStatus.mutate({ id: shipment.id, status: e.target.value })}
                            className="w-full bg-onyx border border-white/10 text-[9px] uppercase p-1 outline-none text-gray-400"
                            value={shipment.status}
                          >
                            {STATUS_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-white/5">
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
                  {flatData.map((row, i) => (
                    <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      {table.getRowModel().rows[i].getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 text-xs">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ArrowRight({ className, size }: { className?: string, size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

