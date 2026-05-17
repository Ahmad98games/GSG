"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
  ColumnResizeMode,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  AlertCircle, 
  Loader2,
  FileText,
  ArrowRight
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LedgerEntry {
  id: string;
  tx_ref: string;
  entry_type: 'debit' | 'credit';
  account_id: string;
  party_id?: string;
  amount: number;
  description: string;
  posted_at: string;
  status: string;
}

interface VirtualLedgerTableProps {
  businessId: string;
}

export default function VirtualLedgerTable({ businessId }: VirtualLedgerTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const parentRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sorting from URL
  const sortCol = searchParams.get("sort") || "posted_at";
  const sortDir = (searchParams.get("dir") || "desc") as "asc" | "desc";

  const updateSort = (columnId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sortCol === columnId) {
      params.set("dir", sortDir === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", columnId);
      params.set("dir", "desc");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Filters from URL
  const dateFrom = searchParams.get("from") || "";
  const dateTo = searchParams.get("to") || "";
  const accountId = searchParams.get("accountId") || "all";
  const entryType = searchParams.get("type") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const partyId = searchParams.get("partyId") || "all";

  // Cursor Pagination Fetcher
  const fetchLedger = async ({ pageParam }: { pageParam?: { time: string; id: string } }) => {
    let query = supabase
      .from("ledger_entries")
      .select("*, accounts(name, account_code), parties(name)")
      .eq("business_id", businessId)
      .order("posted_at", { ascending: sortDir === "asc" })
      .order("id", { ascending: sortDir === "asc" })
      .limit(500);

    if (dateFrom) query = query.gte("posted_at", dateFrom);
    if (dateTo) query = query.lte("posted_at", dateTo);
    if (accountId !== "all") query = query.eq("account_id", accountId);
    if (entryType !== "all") query = query.eq("entry_type", entryType);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (partyId !== "all") query = query.eq("party_id", partyId);

    if (pageParam) {
      if (sortDir === "desc") {
        query = query.or(`posted_at.lt.${pageParam.time},and(posted_at.eq.${pageParam.time},id.lt.${pageParam.id})`);
      } else {
        query = query.or(`posted_at.gt.${pageParam.time},and(posted_at.eq.${pageParam.time},id.gt.${pageParam.id})`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as any[];
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["ledger", businessId, sortCol, sortDir, dateFrom, dateTo, accountId, entryType, statusFilter, partyId],
    queryFn: fetchLedger,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < 500) return undefined;
      const last = lastPage[lastPage.length - 1];
      return { time: last.posted_at, id: last.id };
    },
  });

  const flatData = useMemo(() => data?.pages.flatMap((page) => page) ?? [], [data]);

  // Table Columns
  const columns = useMemo<ColumnDef<LedgerEntry>[]>(
    () => [
      {
        accessorKey: "posted_at",
        header: "Date",
        size: 180,
        cell: (info) => new Date(info.getValue() as string).toLocaleString(),
      },
      {
        accessorKey: "tx_ref",
        header: "Reference",
        size: 150,
        cell: (info) => <span className="font-mono text-[10px] text-electric-blue">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "entry_type",
        header: "Type",
        size: 100,
        cell: (info) => (
          <span className={cn(
            "px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider",
            info.getValue() === "debit" ? "bg-emerald/10 text-emerald" : "bg-critical-red/10 text-critical-red"
          )}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 300,
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        size: 150,
        cell: (info) => (
          <div className="text-right font-mono font-bold">
            {(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        cell: (info) => (
          <span className="text-[10px] uppercase text-gray-500">{info.getValue() as string}</span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: flatData,
    columns,
    columnResizeMode: "onChange" as ColumnResizeMode,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Infinite Scroll Trigger
  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollHeight, scrollTop, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight * 1.2 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + F for search
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
        return;
      }

      if (isSearchOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, rows.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && selectedIndex !== -1) {
        const row = rows[selectedIndex].original;
        console.log("Opening detail for:", row.id);
        // router.push(`/ledger/${row.id}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rows, selectedIndex, isSearchOpen]);

  // Auto-scroll selected row into view
  useEffect(() => {
    if (selectedIndex !== -1) {
      rowVirtualizer.scrollToIndex(selectedIndex);
    }
  }, [selectedIndex, rowVirtualizer]);

  if (status === "pending") {
    return (
      <div className="flex h-96 items-center justify-center bg-onyx/50 border border-white/5">
        <Loader2 className="animate-spin text-electric-blue" size={32} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-12 text-center bg-critical-red/5 border border-critical-red/20 rounded-lg">
        <AlertCircle className="mx-auto text-critical-red mb-4" size={48} />
        <h3 className="text-white font-bold mb-2 uppercase tracking-widest">Registry Link Severed</h3>
        <p className="text-gray-500 text-sm">Could not synchronize with cloud ledger.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-onyx/30 border border-white/5 rounded-sm overflow-hidden relative">
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-0 right-0 z-50 p-2 bg-onyx/90 backdrop-blur-md border-b border-l border-white/10 flex items-center space-x-3 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <Search size={14} className="text-electric-blue" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search Ledger (Ref, Desc, Date)..."
            className="bg-transparent text-xs text-white outline-none w-64 font-mono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsSearchOpen(false);
            }}
          />
          <button 
            onClick={() => setIsSearchOpen(false)}
            className="text-[10px] text-gray-500 hover:text-white uppercase font-bold px-2"
          >
            Esc
          </button>
        </div>
      )}

      {/* Table Container */}
      <div 
        ref={parentRef}
        onScroll={onScroll}
        className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10"
      >
        <div 
          style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}
        >
          {/* Header */}
          <div className="sticky top-0 z-20 flex bg-onyx/80 backdrop-blur-md border-b border-white/10 shadow-lg">
            {table.getLeafHeaders().map((header) => (
              <div
                key={header.id}
                style={{ width: header.getSize() }}
                className="relative group p-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 select-none cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => updateSort(header.id)}
              >
                <div className="flex items-center space-x-2">
                  <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                  {sortCol === header.id && (
                    sortDir === "asc" ? <ChevronUp size={12} className="text-electric-blue" /> : <ChevronDown size={12} className="text-electric-blue" />
                  )}
                </div>
                
                {/* Resizer */}
                <div
                  onMouseDown={header.getResizeHandler()}
                  onTouchStart={header.getResizeHandler()}
                  className={cn(
                    "absolute right-0 top-0 h-full w-1 cursor-col-resize bg-white/0 group-hover:bg-electric-blue/30 transition-colors",
                    header.column.getIsResizing() && "bg-electric-blue w-1 opacity-100"
                  )}
                />
              </div>
            ))}
          </div>

          {/* Body */}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            const isSelected = selectedIndex === virtualRow.index;
            
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "48px",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={cn(
                  "flex border-b border-white/[0.02] items-center transition-colors group cursor-pointer",
                  isSelected ? "bg-electric-blue/10 border-l-2 border-l-electric-blue" : "hover:bg-white/[0.02]",
                  virtualRow.index % 2 === 0 ? "bg-white/[0.01]" : ""
                )}
                onClick={() => setSelectedIndex(virtualRow.index)}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className="p-3 text-[11px] text-gray-300 truncate"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Stats */}
      <div className="p-2 px-4 bg-onyx/80 border-t border-white/5 flex items-center justify-between text-[9px] uppercase font-bold tracking-widest text-gray-500">
        <div className="flex items-center space-x-6">
          <span className="flex items-center space-x-2">
            <span className="w-1 h-1 bg-emerald rounded-full" />
            <span>Connected: Noxis Cloud Proxy v13</span>
          </span>
          <span>Loaded: {flatData.length.toLocaleString()} Entries</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-electric-blue/60 underline">F1: System Help</span>
          <span>Buffer: {isFetchingNextPage ? "Streaming..." : "Stable"}</span>
        </div>
      </div>
    </div>
  );
}
