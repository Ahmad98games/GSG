"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, Download, Calendar, 
  Send, FileText, ChevronDown,
  Info, CheckCircle2, Lock, Terminal,
  ArrowRight, Activity
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { useSidebarState } from "@/hooks/useSidebarState";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Decimal } from "decimal.js";

export default function TaxReturnPage() {
  const { fmt, fmtDate, businessId, taxLabel } = usePersona();
  const { isCollapsed } = useSidebarState();
  const supabase = createClient();
  
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const { data: taxData, isLoading } = useQuery({
    queryKey: ['tax-return-analysis', businessId, dateRange],
    queryFn: async () => {
      // Fetch Sales (Output Tax)
      const { data: sales } = await supabase
        .from('invoices')
        .select('total_amount, subtotal, tax_amount, discount_amount, created_at, invoice_number, parties(name, tax_number)')
        .eq('business_id', businessId)
        .eq('status', 'posted')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      // Fetch Purchases (Input Tax)
      const { data: purchases } = await supabase
        .from('purchase_orders')
        .select('total_amount, subtotal, tax_amount, created_at, po_number, parties(name, tax_number)')
        .eq('business_id', businessId)
        .eq('status', 'posted')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      const outputTotal = (sales || []).reduce((acc: Decimal, s: any) => acc.plus(s.tax_amount || 0), new Decimal(0));
      const outputTaxable = (sales || []).reduce((acc: Decimal, s: any) => acc.plus((s.subtotal || 0) - (s.discount_amount || 0)), new Decimal(0));
      
      const inputTotal = (purchases || []).reduce((acc: Decimal, p: any) => acc.plus(p.tax_amount || 0), new Decimal(0));
      const inputTaxable = (purchases || []).reduce((acc: Decimal, p: any) => acc.plus(p.subtotal || 0), new Decimal(0));

      return {
        outputTotal: outputTotal.toNumber(),
        outputTaxable: outputTaxable.toNumber(),
        inputTotal: inputTotal.toNumber(),
        inputTaxable: inputTaxable.toNumber(),
        netPayable: outputTotal.minus(inputTotal).toNumber(),
        sales: sales || [],
        purchases: purchases || []
      };
    },
    enabled: !!businessId
  });

  const exportFBRXml = () => {
    if (!taxData) return;
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<FBR_IRIS_RETURN version="1.0">
  <Header>
    <BusinessID>${businessId}</BusinessID>
    <PeriodFrom>${dateRange.from}</PeriodFrom>
    <PeriodTo>${dateRange.to}</PeriodTo>
    <GeneratedAt>${new Date().toISOString()}</GeneratedAt>
  </Header>
  <Annexure_C>
    ${taxData.sales.map((s: any) => `
    <Invoice>
      <Number>${s.invoice_number}</Number>
      <Date>${s.created_at.split('T')[0]}</Date>
      <BuyerNTN>${s.parties?.tax_number || ""}</BuyerNTN>
      <Value>${s.subtotal - s.discount_amount}</Value>
      <ST>${s.tax_amount}</ST>
    </Invoice>`).join('')}
  </Annexure_C>
  <Summary>
    <TotalOutputTax>${taxData.outputTotal}</TotalOutputTax>
    <TotalInputTax>${taxData.inputTotal}</TotalInputTax>
    <NetPayable>${taxData.netPayable}</NetPayable>
  </Summary>
</FBR_IRIS_RETURN>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noxis_fbr_return_${dateRange.from}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  

  return (
    <div className="min-h-screen bg-onyx text-slate-200 font-inter">
      
      
      <main className={` transition-all duration-300 min-h-screen flex flex-col`}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <Link href="/reports" className="hover:text-white transition-colors">Reports</Link>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">Tax Reconciliation Return</span>
          </div>

          <nav className="ml-[10%] flex h-16 items-center">
            <Link href="/reports" className="px-6 h-full flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-gray-500 border-b-2 border-transparent hover:text-white hover:bg-white/[0.02]">
              Overview
            </Link>
            <Link href="/reports/tax-return" className="px-6 h-full flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-[#60A5FA] border-b-2 border-[#60A5FA] bg-white/5">
              Tax Return Analysis
            </Link>
            <Link href="/reports/tax" className="px-6 h-full flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-gray-500 border-b-2 border-transparent hover:text-white hover:bg-white/[0.02]">
              Year-End FBR Report
            </Link>
          </nav>

          <div className="ml-auto flex items-center space-x-4">
             <div className="flex items-center bg-white/5 border border-white/10 rounded-sm text-[10px] text-gray-400">
                <input 
                  type="date" 
                  value={dateRange.from} 
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="bg-transparent border-none text-white px-3 py-1.5 focus:ring-0 outline-none"
                />
                <span className="px-1 opacity-30">→</span>
                <input 
                  type="date" 
                  value={dateRange.to} 
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="bg-transparent border-none text-white px-3 py-1.5 focus:ring-0 outline-none"
                />
             </div>
             <button 
               onClick={exportFBRXml}
               className="flex items-center space-x-2 px-4 py-1.5 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-colors"
             >
                <Terminal size={14} />
                <span>Export FBR XML</span>
             </button>
          </div>
        </header>

        <div className="p-12 max-w-[1400px] mx-auto w-full space-y-12">
           {isLoading ? (
             <div className="py-40 text-center text-xs uppercase tracking-[0.5em] text-gray-700 animate-pulse flex flex-col items-center">
                <Activity size={48} strokeWidth={1} className="mb-6 opacity-20" />
                <span>Synchronizing Tax Registers...</span>
             </div>
           ) : taxData && (
             <div className="space-y-12">
                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <TaxStatCard label={`Total Output ${taxLabel}`} value={taxData.outputTotal} taxable={taxData.outputTaxable} color="blue" />
                   <TaxStatCard label={`Claimable Input ${taxLabel}`} value={taxData.inputTotal} taxable={taxData.inputTaxable} color="gold" />
                   <TaxStatCard 
                     label={taxData.netPayable >= 0 ? "Net Payable" : "Refund Claimable"} 
                     value={Math.abs(taxData.netPayable)} 
                     taxable={0} 
                     color={taxData.netPayable >= 0 ? "orange" : "emerald"}
                     isNet
                   />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   {/* Sales Summary */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-electric-blue">Section A: Sales (Output)</h3>
                         <span className="text-[10px] font-mono text-gray-500">{taxData.sales.length} Invoices</span>
                      </div>
                      <div className="bg-surface border border-white/5 overflow-hidden">
                         <table className="w-full text-left">
                            <thead className="bg-white/5 text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                               <tr>
                                  <th className="px-6 py-4">Invoice</th>
                                  <th className="px-6 py-4 text-right">Taxable Value</th>
                                  <th className="px-6 py-4 text-right">Tax</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                               {taxData.sales.slice(0, 10).map((s: any) => (
                                 <tr key={s.invoice_number} className="hover:bg-white/[0.01]">
                                    <td className="px-6 py-4">
                                       <div className="flex flex-col">
                                          <span className="text-white text-xs font-bold">{s.invoice_number}</span>
                                          <span className="text-[9px] text-gray-600 uppercase">{s.parties?.name}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">{fmt(s.subtotal - s.discount_amount)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-xs text-white">{fmt(s.tax_amount)}</td>
                                 </tr>
                               ))}
                               {taxData.sales.length > 10 && (
                                 <tr>
                                    <td colSpan={3} className="px-6 py-3 text-center text-[9px] text-gray-600 italic">+{taxData.sales.length - 10} more transactions summarized</td>
                                 </tr>
                               )}
                            </tbody>
                         </table>
                      </div>
                   </div>

                   {/* Purchases Summary */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-sandstone-gold">Section B: Purchases (Input)</h3>
                         <span className="text-[10px] font-mono text-gray-500">{taxData.purchases.length} Orders</span>
                      </div>
                      <div className="bg-surface border border-white/5 overflow-hidden">
                         <table className="w-full text-left">
                            <thead className="bg-white/5 text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                               <tr>
                                  <th className="px-6 py-4">PO Ref</th>
                                  <th className="px-6 py-4 text-right">Taxable Value</th>
                                  <th className="px-6 py-4 text-right">Input Tax</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                               {taxData.purchases.slice(0, 10).map((p: any) => (
                                 <tr key={p.po_number} className="hover:bg-white/[0.01]">
                                    <td className="px-6 py-4">
                                       <div className="flex flex-col">
                                          <span className="text-white text-xs font-bold">{p.po_number}</span>
                                          <span className="text-[9px] text-gray-600 uppercase">{p.parties?.name}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">{fmt(p.subtotal)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-xs text-white">{fmt(p.tax_amount)}</td>
                                 </tr>
                               ))}
                               {taxData.purchases.length > 10 && (
                                 <tr>
                                    <td colSpan={3} className="px-6 py-3 text-center text-[9px] text-gray-600 italic">+{taxData.purchases.length - 10} more transactions summarized</td>
                                 </tr>
                               )}
                            </tbody>
                         </table>
                      </div>
                   </div>
                </div>

                {/* Footer / Disclaimer */}
                <div className="p-8 bg-white/5 border border-white/10 flex items-start space-x-6">
                   <Info className="text-electric-blue shrink-0 mt-1" size={20} />
                   <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-black text-white tracking-widest">Compliance Statement</h4>
                      <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
                         The figures above are generated based on posted transactions within the Noxis General Ledger. This report is intended for internal reconciliation only. Final statutory returns must be verified by a certified accountant before submission to government portals.
                      </p>
                   </div>
                </div>
             </div>
           )}
        </div>
      </main>
    </div>
  );
}

function TaxStatCard({ label, value, taxable, color, isNet }: any) {
  const { fmt } = usePersona();
  const colors: any = {
    blue: "border-electric-blue/20 bg-electric-blue/5 text-electric-blue",
    gold: "border-sandstone-gold/20 bg-sandstone-gold/5 text-sandstone-gold",
    orange: "border-orange-500/20 bg-orange-500/5 text-orange-500",
    emerald: "border-emerald/20 bg-emerald/5 text-emerald"
  };

  return (
    <div className={cn("p-8 border rounded-sm space-y-4", colors[color])}>
       <div className="space-y-1">
          <span className="text-[10px] uppercase font-black tracking-widest opacity-60">{label}</span>
          <p className="text-3xl font-mono font-black tracking-tighter">{fmt(value)}</p>
       </div>
       {!isNet && (
         <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[9px] uppercase font-bold opacity-40 tracking-widest">
            <span>Taxable Turnover</span>
            <span>{fmt(taxable)}</span>
         </div>
       )}
    </div>
  );
}
