"use client";
import { useMemo, useState } from 'react';
import React from 'react';
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
} from "@tanstack/react-table";
import { useStockQuery } from "@/hooks/useStockQuery";

import { useSidebarState } from "@/hooks/useSidebarState";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import LowStockBanner from "@/components/notifications/LowStockBanner";
import { cn } from "@/lib/utils";
import { 
  Search, Filter, ArrowUpDown, 
  MoreHorizontal, Plus, Download, 
  Package, MapPin, Tag, Edit, 
  ArrowRightLeft, Archive, Image as ImageIcon, Layers
} from "lucide-react";
import { motion } from "framer-motion";
import TopBar from "@/components/layout/TopBar";
import Link from "next/link";

// Types
interface SKU {
  id: string;
  sku_code: string;
  name: string;
  current_location: string;
  qty_on_hand: number;
  reorder_level: number;
  unit: string;
  cost_price: number;
  sale_price: number;
  thumbnail_url?: string;
  is_active: boolean;
}

const columnHelper = createColumnHelper<SKU>();

export default function StockLedgerPage() {
  
  const { profile, currency = "PKR" } = useBusinessProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    status 
  } = useStockQuery({ 
    search: searchTerm, 
    location: locationFilter 
  });

  const flatData =  useMemo (() => data?.pages.flatMap(page => page.data) || [], [data]);

  const columns =  useMemo (() => [
    columnHelper.accessor("sku_code", {
      header: "SKU Code",
      cell: (info) => <span className="font-mono text-electric-blue">{info.getValue()}</span>,
    }),
    columnHelper.accessor("thumbnail_url", {
      header: "Visual",
      cell: (info) => (
        <div className="w-8 h-8 bg-onyx border border-white/5 flex items-center justify-center overflow-hidden">
          {info.getValue() ? (
            <img src={info.getValue()} alt="SKU" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={14} className="text-gray-700" />
          )}
        </div>
      ),
    }),
    columnHelper.accessor("name", {
      header: "Product Name",
      cell: (info) => <span className="font-medium text-white">{info.getValue()}</span>,
    }),
    columnHelper.accessor("current_location", {
      header: "Location",
      cell: (info) => (
        <div className="flex items-center space-x-2 text-gray-400">
          <MapPin size={12} />
          <span className="text-[10px] uppercase tracking-wider">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("qty_on_hand", {
      header: "On Hand",
      cell: (info) => {
        const qty = Number(info.getValue());
        const reorder = info.row.original.reorder_level;
        const color = qty <= reorder ? "text-critical-red" : qty <= reorder * 1.2 ? "text-sandstone-gold" : "text-emerald";
        return (
          <div className="flex flex-col">
            <span className={`font-mono font-bold ${color}`}>{qty.toLocaleString()}</span>
            <span className="text-[9px] text-gray-500 uppercase">{info.row.original.unit}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor("cost_price", {
      header: "Cost Price",
      cell: (info) => (
        <span className="financial text-right block">
          {currency} {Number(info.getValue()).toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor("sale_price", {
      header: "Sale Price",
      cell: (info) => (
        <span className="financial text-right block">
          {currency} {Number(info.getValue()).toLocaleString()}
        </span>
      ),
    }),
    columnHelper.display({
      id: "batch",
      header: "Batch",
      cell: (info) => {
        const row = info.row.original as any;
        if (!row.batch_tracking) return <span className="text-[9px] text-gray-700">—</span>;
        return (
          <Link href={`/stock/${row.id}/batches`} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold uppercase tracking-wider rounded-sm hover:bg-purple-500/20 transition-colors">
            <Layers size={10} />
            <span>Batch Tracked</span>
          </Link>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <div className="flex items-center justify-end space-x-2">
          {(info.row.original as any).batch_tracking && (
            <Link href={`/stock/${(info.row.original as any).id}/batches`} className="p-1.5 hover:bg-purple-500/10 text-gray-500 hover:text-purple-400 transition-colors rounded-sm" title="Manage Batches">
              <Layers size={14} />
            </Link>
          )}
          <button className="p-1.5 hover:bg-white/5 text-gray-500 hover:text-electric-blue transition-colors rounded-sm" title="Transfer">
            <ArrowRightLeft size={14} />
          </button>
          <button className="p-1.5 hover:bg-white/5 text-gray-500 hover:text-white transition-colors rounded-sm" title="Edit">
            <Edit size={14} />
          </button>
          <button className="p-1.5 hover:bg-white/5 text-gray-500 hover:text-white transition-colors rounded-sm">
            <MoreHorizontal size={14} />
          </button>
        </div>
      ),
    }),
  ], [currency]);

  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen bg-onyx text-slate-200">
      <main className={` transition-all duration-300`}>
        <LowStockBanner onFilter={() => setLocationFilter("reorder")} />

        <TopBar 
          breadcrumb={[
            { label: "Inventory" },
            { label: "Stock Ledger", active: true }
          ]}
          actions={
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-3 py-1.5 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-colors">
                <Download size={12} />
                <span>Export CSV</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-1.5 bg-electric-blue text-onyx text-[10px] uppercase tracking-widest font-bold hover:bg-blue-400 transition-colors">
                <Plus size={12} />
                <span>Create SKU</span>
              </button>
            </div>
          }
        />

        <div className="p-8 max-w-[1600px] mx-auto">
          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="relative w-full md:w-96">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search by SKU Code or Product Name..." 
                className="w-full bg-surface border border-white/5 pl-10 pr-4 py-2 text-sm text-white focus:border-electric-blue outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-surface border border-white/5 px-3 py-2">
                <Filter size={14} className="text-gray-500" />
                <select 
                  className="bg-transparent text-xs text-gray-400 outline-none"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <option value="">All Locations</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="karkhana">Karkhana</option>
                  <option value="retail_shop">Retail Shop</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-surface border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-onyx/50 border-b border-white/5">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="px-6 py-4 table-header">
                          <div className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && <ArrowUpDown size={10} />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {flatData.length > 0 ? (
                    table.getRowModel().rows.map((row, i) => (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={row.id} 
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-4 py-2.5 text-sm text-gray-200 border-b border-white/[0.04]">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-20 text-center text-gray-600 uppercase tracking-[0.3em] text-xs">
                        {status === 'pending' ? "Accessing Core Ledger..." : "No matching inventory records found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Load More */}
            {hasNextPage && (
              <div className="p-4 border-t border-white/5 flex justify-center">
                <button 
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-2 bg-onyx border border-white/10 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-white hover:border-white/20 transition-all"
                >
                  {isFetchingNextPage ? "Synchronizing..." : "Load More Records"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
