"use client";

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  Row,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, FileText, Download, CreditCard, Search, Filter } from 'lucide-react';
import { PersonaEngine } from '@/lib/persona/PersonaEngine';
import Link from 'next/link';

interface Invoice {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  outstanding: number;
  status: 'paid' | 'partial' | 'overdue' | 'pending';
  days_overdue: number | null;
}

interface InvoicesClientProps {
  initialInvoices: Invoice[];
  t: (key: string) => string;
  fmt: (val: number) => string;
}

export default function InvoicesClient({ initialInvoices, t, fmt }: InvoicesClientProps) {
  const [expanded, setExpanded] =  useState ({});
  const [filterStatus, setFilterStatus] =  useState ('all');

  const filteredData = initialInvoices.filter(inv => {
    if (filterStatus === 'all') return true;
    return inv.status === filterStatus;
  });

  const columns: ColumnDef<Invoice>[] = [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => (
        <button
          onClick={row.getToggleExpandedHandler()}
          className="p-1 hover:bg-white/5 rounded transition-colors"
        >
          {row.getIsExpanded() ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      ),
    },
    {
      accessorKey: 'invoice_number',
      header: t('portal.invoices.invoice_no'),
      cell: ({ row }) => <span className="font-mono text-sandstone-gold font-bold">{row.original.invoice_number}</span>,
    },
    {
      accessorKey: 'invoice_date',
      header: t('portal.invoices.date'),
      cell: ({ row }) => <span>{PersonaEngine.formatDate(row.original.invoice_date)}</span>,
    },
    {
      accessorKey: 'due_date',
      header: t('portal.invoices.due_date'),
      cell: ({ row }) => <span>{PersonaEngine.formatDate(row.original.due_date)}</span>,
    },
    {
      accessorKey: 'total_amount',
      header: () => <div className="text-right">{t('portal.invoices.amount')}</div>,
      cell: ({ row }) => <div className="text-right font-mono">{fmt(row.original.total_amount)}</div>,
    },
    {
      accessorKey: 'amount_paid',
      header: () => <div className="text-right">{t('portal.invoices.paid')}</div>,
      cell: ({ row }) => <div className="text-right font-mono text-gray-500">{fmt(row.original.amount_paid)}</div>,
    },
    {
      accessorKey: 'outstanding',
      header: () => <div className="text-right">{t('portal.invoices.outstanding')}</div>,
      cell: ({ row }) => <div className="text-right font-mono font-bold text-white">{fmt(row.original.outstanding)}</div>,
    },
    {
      accessorKey: 'status',
      header: t('portal.invoices.status'),
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
          row.original.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
          row.original.status === 'partial' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
          row.original.status === 'overdue' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
          'bg-blue-500/10 text-blue-500 border-blue-500/20'
        }`}>
          {t(`portal.status.${row.original.status}`)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end space-x-2">
          {row.original.outstanding > 0 && (
            <button className="px-3 py-1.5 bg-electric-blue/10 text-electric-blue hover:bg-electric-blue hover:text-onyx transition-all border border-electric-blue/20 text-[9px] font-black uppercase tracking-widest">
              Pay
            </button>
          )}
          <Link 
            href={`/portal/invoices/${row.original.invoice_id}/pdf`}
            className="p-2 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10"
          >
            <Download size={14} />
          </Link>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1A1D21] p-4 border border-white/5">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <Filter size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Filter By</span>
          </div>
          <div className="flex bg-onyx p-1 rounded-sm border border-white/5">
            {['all', 'pending', 'partial', 'paid', 'overdue'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === s ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
          <input 
            type="text" 
            placeholder="Search Reference..." 
            className="bg-onyx border border-white/5 pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-white/20 w-full md:w-64 placeholder:text-gray-700"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-white/5 border-b border-white/5">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-xs text-gray-500 font-medium uppercase tracking-widest">
                  {t('portal.invoices.empty')}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <React.Fragment key={row.id}>
                  <tr 
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                      row.original.status === 'overdue' ? 'border-l-2 border-l-[#EF4444]' : ''
                    }`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-2.5 text-sm text-gray-200 border-b border-white/[0.04]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Expanded Row (Line Items) */}
                  <AnimatePresence>
                    {row.getIsExpanded() && (
                      <tr>
                        <td colSpan={columns.length} className="p-0 bg-black/20">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-16 py-8 space-y-6">
                              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Line Item Breakdown</div>
                              <table className="w-full text-left border-collapse">
                                <thead className="border-b border-white/10">
                                  <tr>
                                    <th className="pb-3 text-[9px] font-bold uppercase tracking-widest text-gray-600">Description</th>
                                    <th className="pb-3 text-[9px] font-bold uppercase tracking-widest text-gray-600 text-right">Qty</th>
                                    <th className="pb-3 text-[9px] font-bold uppercase tracking-widest text-gray-600 text-right">Unit Price</th>
                                    <th className="pb-3 text-[9px] font-bold uppercase tracking-widest text-gray-600 text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {/* This would ideally be fetched or passed in. Simulation for now. */}
                                  <tr className="border-b border-white/5">
                                    <td className="py-3 text-xs text-white">General Industrial Service / Supply</td>
                                    <td className="py-3 text-xs text-right font-mono text-gray-400">1.00</td>
                                    <td className="py-3 text-xs text-right font-mono text-gray-400">{fmt(row.original.total_amount)}</td>
                                    <td className="py-3 text-xs text-right font-mono text-sandstone-gold font-bold">{fmt(row.original.total_amount)}</td>
                                  </tr>
                                </tbody>
                              </table>
                              
                              <div className="flex flex-col items-end space-y-2 pt-4">
                                <div className="flex items-center space-x-12">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Total Amount</span>
                                  <span className="text-sm font-mono text-sandstone-gold font-bold">{fmt(row.original.total_amount)}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

