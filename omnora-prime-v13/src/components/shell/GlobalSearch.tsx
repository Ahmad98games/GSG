"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Package, Users, FileText, 
  User, X, Command, ArrowRight,
  PlusCircle, Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePersona } from "@/hooks/usePersona";
import { useSidebarState } from "@/hooks/useSidebarState";

interface SearchResult {
  id: string;
  type: 'sku' | 'party' | 'invoice' | 'karigar';
  title: string;
  subtitle: string;
  link: string;
}

export default function GlobalSearch() {
  const { isCollapsed } = useSidebarState();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { businessId } = usePersona();
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSearch]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const performSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2 || !businessId) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const [skus, parties, invoices, karigars] = await Promise.all([
        supabase.from('skus').select('id, name, sku_code').ilike('name', `%${q}%`).limit(3),
        supabase.from('parties').select('id, name').ilike('name', `%${q}%`).limit(3),
        supabase.from('invoices').select('id, invoice_number').ilike('invoice_number', `%${q}%`).limit(3),
        supabase.from('karigars').select('id, name, karigar_code').ilike('name', `%${q}%`).limit(3)
      ]);

      const allResults: SearchResult[] = [
        ...(skus.data || []).map((s: any) => ({
          id: s.id,
          type: 'sku' as const,
          title: s.name,
          subtitle: s.sku_code,
          link: `/stock/${s.id}`
        })),
        ...(parties.data || []).map((p: any) => ({
          id: p.id,
          type: 'party' as const,
          title: p.name,
          subtitle: 'Business Partner',
          link: `/parties/${p.id}`
        })),
        ...(invoices.data || []).map((i: any) => ({
          id: i.id,
          type: 'invoice' as const,
          title: `Invoice #${i.invoice_number}`,
          subtitle: 'Sales Document',
          link: `/invoices/${i.id}`
        })),
        ...(karigars.data || []).map((k: any) => ({
          id: k.id,
          type: 'karigar' as const,
          title: k.name,
          subtitle: k.karigar_code,
          link: `/karigars/${k.id}`
        }))
      ];

      setResults(allResults);
    } catch (err) {
      console.error("Global search failed", err);
    } finally {
      setLoading(false);
    }
  }, [businessId, supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (link: string) => {
    router.push(link);
    closeSearch();
  };

  // Listen for global open event
  useEffect(() => {
    const handleOpenSearch = () => setIsOpen(true);
    window.addEventListener("open-global-search", handleOpenSearch);
    return () => window.removeEventListener("open-global-search", handleOpenSearch);
  }, []);

  return (
    <>
      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-20 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl glass-panel shadow-2xl rounded-sm overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="relative border-b border-white/10 p-4">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-electric-blue" size={20} />
                <input 
                  ref={inputRef}
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search SKUs, Parties, Invoices or Workforce..."
                  className="w-full bg-transparent pl-12 pr-12 py-2 text-white text-sm outline-none placeholder:text-gray-600 font-bold uppercase tracking-widest"
                />
                {loading ? (
                  <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" size={18} />
                ) : (
                  <button 
                    onClick={closeSearch}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                {query.length < 2 ? (
                  <div className="py-20 text-center text-gray-700 space-y-4">
                     <Search size={48} strokeWidth={1} className="mx-auto" />
                     <p className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting Command Input</p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-4 p-4">
                    {/* SKUs */}
                    <ResultGroup 
                      title="Stock Items" 
                      items={results.filter(r => r.type === 'sku')} 
                      onSelect={handleSelect}
                    />
                    {/* Parties */}
                    <ResultGroup 
                      title="Business Partners" 
                      items={results.filter(r => r.type === 'party')} 
                      onSelect={handleSelect}
                    />
                    {/* Invoices */}
                    <ResultGroup 
                      title="Financial Documents" 
                      items={results.filter(r => r.type === 'invoice')} 
                      onSelect={handleSelect}
                    />
                    {/* Karigars */}
                    <ResultGroup 
                      title="Industrial Workforce" 
                      items={results.filter(r => r.type === 'karigar')} 
                      onSelect={handleSelect}
                    />
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-6">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No matching records found for "{query}"</p>
                    <div className="flex flex-wrap justify-center gap-3">
                       <Link href="/stock/new" className="px-4 py-2 bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-widest text-gray-400 hover:text-white transition-all flex items-center space-x-2">
                          <PlusCircle size={14} />
                          <span>New SKU</span>
                       </Link>
                       <Link href="/parties/new" className="px-4 py-2 bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-widest text-gray-400 hover:text-white transition-all flex items-center space-x-2">
                          <PlusCircle size={14} />
                          <span>New Party</span>
                       </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-black/20 border-t border-white/5 flex items-center justify-between px-6">
                 <div className="flex items-center space-x-4 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                    <span className="flex items-center space-x-1">
                       <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">↑↓</kbd>
                       <span>Navigate</span>
                    </span>
                    <span className="flex items-center space-x-1">
                       <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">↵</kbd>
                       <span>Select</span>
                    </span>
                 </div>
                 <div className="text-[9px] font-mono text-electric-blue/50 uppercase tracking-widest">
                    Noxis Search Engine v13.0
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function ResultGroup({ title, items, onSelect }: { title: string, items: SearchResult[], onSelect: (l: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 ml-2">{title}</h3>
      <div className="space-y-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.link)}
            className="w-full flex items-center p-3 hover:bg-white/5 group transition-all rounded-sm text-left border border-transparent hover:border-white/5"
          >
            <div className="w-10 h-10 bg-white/5 flex items-center justify-center rounded-sm text-gray-500 group-hover:text-electric-blue transition-colors">
               {item.type === 'sku' && <Package size={18} />}
               {item.type === 'party' && <Users size={18} />}
               {item.type === 'invoice' && <FileText size={18} />}
               {item.type === 'karigar' && <User size={18} />}
            </div>
            <div className="ml-4 flex-1">
               <p className="text-white text-[11px] font-bold uppercase tracking-tight">{item.title}</p>
               <p className="text-[9px] text-gray-600 font-mono mt-0.5 uppercase">{item.subtitle}</p>
            </div>
            <ArrowRight size={14} className="text-gray-800 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
