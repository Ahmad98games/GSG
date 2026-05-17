"use client";

import { useEffect, useState } from 'react';
import React from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { usePersona } from "@/hooks/usePersona";
import { usePurchaseOrder, useProcessGRN, useSuppliers } from "@/hooks/usePurchaseQueries";
import { 
  PackageCheck, Truck, ClipboardCheck, 
  AlertTriangle, Save, ArrowLeft,
  ChevronRight, Info, User, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const REJECT_REASONS = [
  "Wrong Specification",
  "Damaged in Transit",
  "Short Quantity",
  "Quality Failure",
  "Wrong Item"
];

interface GRNLineItem {
  po_line_id: string | null;
  sku_id: string;
  sku_code: string;
  description: string;
  qty_received: number;
  qty_accepted: number;
  qty_rejected: number;
  reject_reason: string;
  unit_cost: number;
}

export default function NewGRNPage() {
  const { t, fmt, persona } = usePersona();
  const router = useRouter();
  const searchParams = useSearchParams();
  const poId = searchParams.get("poId");
  
  const { data: po, isLoading: poLoading } = usePurchaseOrder(poId || "");
  const processGRN = useProcessGRN();

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [grnNumber, setGrnNumber] = useState("");
  const [items, setItems] = useState<GRNLineItem[]>([]);
  const [step, setStep] = useState<'receive' | 'inspect'>('receive');

  useEffect(() => {
    if (po) {
      setSelectedSupplierId(po.supplier_id);
      const grnItems = po.items
        .filter((item: any) => item.qty_pending > 0)
        .map((item: any) => ({
          po_line_id: item.id,
          sku_id: item.sku_id,
          sku_code: item.sku_code || "",
          description: item.description,
          qty_received: item.qty_pending,
          qty_accepted: item.qty_pending,
          qty_rejected: 0,
          reject_reason: "",
          unit_cost: item.unit_cost
        }));
      setItems(grnItems);
    }
  }, [po]);

  const handleProcess = async () => {
    if (!selectedSupplierId) {
      alert("Please select a supplier");
      return;
    }

    const hasIncompleteRejections = items.some(i => i.qty_rejected > 0 && !i.reject_reason);
    if (hasIncompleteRejections) {
      alert("Please provide a rejection reason for all rejected quantities");
      return;
    }

    const payload = {
      business_id: persona?.id,
      po_id: poId || null,
      supplier_id: selectedSupplierId,
      grn_number: grnNumber || `GRN-${Date.now().toString().slice(-6)}`,
      items
    };

    processGRN.mutate(payload, {
      onSuccess: () => {
        alert("Stock received and ledger updated successfully.");
        router.push("/purchase");
      },
      onError: (err: any) => {
        alert("Failed to process GRN: " + err.message);
      }
    });
  };

  if (poLoading) return <div className="p-8 text-gray-500 uppercase tracking-widest text-[10px]">Loading Procurement Data...</div>;

  return (
    <div className="p-8 max-w-[1200px] mx-auto min-h-screen bg-onyx text-slate-200">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald/10 rounded-sm text-emerald">
            <PackageCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Receive Materials (GRN)</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">
              {po ? `Receiving against ${po.po_number}` : 'Direct Material Receipt'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          {step === 'receive' ? (
            <button 
              onClick={() => setStep('inspect')}
              className="px-6 py-2 bg-electric-blue text-onyx text-[10px] uppercase tracking-widest font-bold hover:bg-blue-400 transition-colors flex items-center space-x-2"
            >
              <span>Quality Inspection</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button 
              onClick={handleProcess}
              disabled={processGRN.isPending}
              className="px-6 py-2 bg-emerald text-onyx text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-400 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {processGRN.isPending ? "Processing..." : (
                <>
                  <Save size={14} />
                  <span>Accept & Post to Ledger</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          {/* Progress Indicator */}
          <div className="flex items-center space-x-8 mb-8 border-b border-white/5 pb-4">
            <div className={cn(
              "flex items-center space-x-2 pb-4 -mb-[17px] border-b-2 transition-all",
              step === 'receive' ? "border-electric-blue text-electric-blue" : "border-transparent text-gray-500"
            )}>
              <Truck size={14} />
              <span className="text-[10px] uppercase font-bold tracking-widest">1. Delivery Receipt</span>
            </div>
            <div className={cn(
              "flex items-center space-x-2 pb-4 -mb-[17px] border-b-2 transition-all",
              step === 'inspect' ? "border-emerald text-emerald" : "border-transparent text-gray-500"
            )}>
              <ClipboardCheck size={14} />
              <span className="text-[10px] uppercase font-bold tracking-widest">2. Quality Inspection</span>
            </div>
          </div>

          <section className="bg-surface border border-white/5 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-onyx/50 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Item Description</th>
                  {step === 'receive' ? (
                    <>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-center">Pending on PO</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-center">Actual Received</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-center">Received</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-center">Accepted</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-center">Rejected</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Rejection Reason</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-white">{item.description}</p>
                      <p className="text-[10px] text-gray-600 font-mono">{item.sku_code}</p>
                    </td>
                    
                    {step === 'receive' ? (
                      <>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-mono text-gray-500">
                            {po?.items.find((i: any) => i.id === item.po_line_id)?.qty_pending || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="number"
                            className="bg-onyx border border-white/10 px-2 py-1 text-xs w-24 text-center font-mono outline-none focus:border-electric-blue text-white"
                            value={item.qty_received}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const newItems = [...items];
                              newItems[index] = { ...item, qty_received: val, qty_accepted: val, qty_rejected: 0 };
                              setItems(newItems);
                            }}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-mono text-gray-500">{item.qty_received}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="number"
                            className="bg-onyx border border-white/10 px-2 py-1 text-xs w-20 text-center font-mono outline-none focus:border-emerald text-emerald font-bold"
                            value={item.qty_accepted}
                            onChange={(e) => {
                              const acc = Number(e.target.value);
                              const rej = item.qty_received - acc;
                              const newItems = [...items];
                              newItems[index] = { ...item, qty_accepted: acc, qty_rejected: rej };
                              setItems(newItems);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "text-xs font-mono font-bold",
                            item.qty_rejected > 0 ? "text-critical-red" : "text-gray-700"
                          )}>
                            {item.qty_rejected}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            disabled={item.qty_rejected === 0}
                            className={cn(
                              "industrial-input text-[10px] py-1 h-8",
                              item.qty_rejected > 0 && !item.reject_reason ? "border-critical-red/50" : "opacity-60"
                            )}
                            value={item.reject_reason}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].reject_reason = e.target.value;
                              setItems(newItems);
                            }}
                          >
                            <option value="">Select Reason...</option>
                            {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {step === 'inspect' && (
             <div className="mt-8 p-6 bg-sandstone-gold/5 border border-sandstone-gold/20 rounded-sm">
                <div className="flex items-start space-x-3">
                  <Info className="text-sandstone-gold mt-0.5" size={16} />
                  <div>
                    <h4 className="text-[10px] font-bold text-white uppercase mb-1">Impact of Inspection</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed uppercase">
                      Accepted quantities will be added to your live inventory ledger. Rejected quantities will be flagged in the **Supplier Scorecard** and will not affect stock levels.
                    </p>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .industrial-input {
          width: 100%;
          background: #121417;
          border: 1px solid #2D3139;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
          border-radius: 2px;
        }
        .industrial-input:focus {
          border-color: #60A5FA;
          box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.2);
        }
        select.industrial-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1rem;
        }
      `}</style>
    </div>
  );
}
