"use client";

import React, { memo, useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { usePersona } from '@/hooks/usePersona';
import { Decimal } from 'decimal.js';

interface StockRow {
  id: string;
  sku_code: string;
  name: string;
  qty: number;
  location: string;
}

const columnHelper = createColumnHelper<StockRow>();

const TableRow = memo(({ row }: { row: any }) => (
  <div className="w-full flex items-center border-b border-white/5 bg-onyx/50 hover:bg-white/5 transition-colors">
    {row.getVisibleCells().map((cell: any) => (
      <div 
        key={cell.id} 
        className={cn(
          "px-4 py-2.5 text-sm text-gray-300 flex-1",
          cell.column.id === 'qty' && "text-right font-mono"
        )}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </div>
    ))}
  </div>
));

TableRow.displayName = 'TableRow';

export default function StockTable({ data }: { data: StockRow[] }) {
  const { t } = usePersona();
  
  const columns =  useMemo (() => [
    columnHelper.accessor('sku_code', { header: t('stock.sku') }),
    columnHelper.accessor('name', { header: t('stock.product_name') }),
    columnHelper.accessor('qty', { 
      header: () => <div className="text-right">{t('stock.qty_on_hand')}</div>,
      cell: (info) => info.getValue() != null ? info.getValue() : '—'
    }),
    columnHelper.accessor('location', { header: t('stock.location') }),
  ], [t]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  return (
    <div className="flex flex-col h-full bg-onyx border border-white/10">
      <div className="flex bg-onyx-light border-b border-white/10 uppercase tracking-widest text-[10px] font-bold text-gray-500">
        {table.getHeaderGroups().map(headerGroup => (
          <React.Fragment key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <div key={header.id} className="px-4 py-3 flex-1">
                {flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="flex-1 overflow-auto max-h-[600px]">
        {rows.map(row => (
          <TableRow 
            key={row.id} 
            row={row} 
          />
        ))}
      </div>
    </div>
  );
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}

