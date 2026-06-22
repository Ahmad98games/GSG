"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useSidebarState } from "@/hooks/useSidebarState";
import { IndustrialMath } from "@/lib/finance/IndustrialMath";
import { numberToWords } from "@/utils/NumberToWords";
import { 
  FileText, Plus, Trash2, Search, 
  User, Package, ShieldCheck,
  Calculator, X, Printer, Save, HelpCircle, ArrowRight,
  ChevronRight, Building2, Calendar, Globe, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { Decimal } from 'decimal.js';
import CreditRiskBadge from "@/components/invoices/CreditRiskBadge";
import { useDebounce } from "@/hooks/useDebounce";
import { FieldError } from "@/components/ui/StateViews";

import { CURRENCIES, formatCurrency, CurrencyCode } from '@/lib/currency/currencyEngine';

const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

const invoiceSchema = z.object({
  party_id: z.string().min(1, "Select a customer"),
  party_search: z.string().optional(),
  invoice_no: z.string().min(1),
  issue_date: z.string(),
  due_date: z.string(),
  branch_id: z.string().optional(),
  currency: z.string().default("PKR"),
  exchange_rate: z.coerce.number().min(0.000001).default(1.0),
  items: z.array(z.object({
    sku_id: z.string().optional(),
    description: z.string().min(1, "Item description required"),
    qty: z.coerce.number().positive("Quantity must be greater than 0"),
    unit: z.string(),
    unit_price: z.coerce.number().min(0, "Rate cannot be negative"),
  })).min(1, "Add at least one item"),
  discount_pct: z.coerce.number().min(0).max(100),
  tax_pct: z.coerce.number().min(0).max(100),
  payment_terms: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function NewInvoicePage() {
  const router = useRouter();
  const { profile, currency: businessCurrency = "PKR", taxName, taxRate: defaultTaxRate } = useBusinessProfile();
  const supabase = createClient();

  const [parties, setParties] = useState<any[]>([]);
  const [skus, setSkus] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSkuIndex, setActiveSkuIndex] = useState<number | null>(null);
  const [skuSearch, setSkuSearch] = useState("");
  const [docHash, setDocHash] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    setDocHash(Math.random().toString(36).substring(2, 15).toUpperCase());
  }, []);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema) as any,
    mode: "onChange",
    defaultValues: {
      party_id: "",
      party_search: "",
      invoice_no: "",
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      items: [{ description: "", qty: 1, unit: "piece", unit_price: 0 }],
      discount_pct: 0,
      tax_pct: defaultTaxRate || 17,
      payment_terms: "NET 30",
      currency: businessCurrency as CurrencyCode,
      exchange_rate: 1.0
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchValues = watch();
  const watchItems = watch("items") || [];
  const watchDiscountPct = watch("discount_pct") || 0;
  const watchTaxPct = watch("tax_pct") || 0;

  const selectedParty = parties.find(p => p.id === watchValues.party_id);
  const selectedBranch = branches.find(b => b.id === watchValues.branch_id);

  // Sync profile defaults
  useEffect(() => {
    if (profile) {
      setValue("tax_pct", profile.tax_rate || 0);
      setValue("currency", (profile.currency as CurrencyCode) || 'PKR');
    }
  }, [profile, setValue]);

  const totals = useMemo(() => {
    return IndustrialMath.calculateInvoiceTotals(
      watchItems.map(i => ({ qty: i.qty || 0, price: i.unit_price || 0 })),
      watchDiscountPct || 0,
      watchTaxPct || 0
    );
  }, [watchItems, watchDiscountPct, watchTaxPct]);

  const partySearchValue = watch("party_search") || "";
  const debouncedPartySearch = useDebounce(partySearchValue, 300);
  const debouncedSkuSearch = useDebounce(skuSearch, 300);

  const [debouncedTotals, setDebouncedTotals] = useState(totals);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTotals(totals);
    }, 100);
    return () => clearTimeout(handler);
  }, [totals]);

  useEffect(() => {
    if (!profile?.id) return;
    const loadData = async () => {
      const [{ data: pData }, { data: sData }, { data: bData }, { data: count }] = await Promise.all([
        supabase.from('parties').select('*').eq('business_id', profile.id),
        supabase.from('skus').select('*').eq('business_id', profile.id).eq('is_active', true),
        supabase.from('branches').select('*').eq('business_id', profile.id),
        supabase.from('invoices').select('invoice_no', { count: 'exact', head: true }).eq('business_id', profile.id)
      ]);
      if (pData) setParties(pData);
      if (sData) setSkus(sData);
      if (bData) {
        setBranches(bData);
        if (bData.length > 0) setValue("branch_id", bData[0].id);
      }
      
      const nextNo = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(5, '0')}`;
      setValue("invoice_no", nextNo);
    };
    loadData();
  }, [profile?.id, supabase, setValue]);

  // Currency Rate Fetcher
  useEffect(() => {
    if (watchValues.currency === businessCurrency) {
      setValue("exchange_rate", 1.0);
      return;
    }
    const fetchRate = async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', watchValues.currency)
        .eq('to_currency', businessCurrency)
        .lte('effective_date', watchValues.issue_date)
        .order('effective_date', { ascending: false })
        .limit(1);
      
      if (data?.[0]) {
        setValue("exchange_rate", data[0].rate);
      }
    };
    fetchRate();
  }, [watchValues.currency, businessCurrency, watchValues.issue_date, supabase, setValue]);

  const filteredSkus = useMemo(() => {
    if (!debouncedSkuSearch) return [];
    return skus.filter(s => 
      s.sku_code.toLowerCase().includes(debouncedSkuSearch.toLowerCase()) || 
      s.name.toLowerCase().includes(debouncedSkuSearch.toLowerCase())
    ).slice(0, 10);
  }, [skus, debouncedSkuSearch]);

  const onSubmit = async (values: InvoiceFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user session");

      let invId: string | null = null;
      
      // Attempt database RPC first
      const { data, error: rpcError } = await supabase.rpc('create_invoice_atomic', {
        p_business_id: profile?.id,
        p_branch_id: values.branch_id || null,
        p_party_id: values.party_id,
        p_invoice_no: values.invoice_no,
        p_issue_date: values.issue_date,
        p_due_date: values.due_date,
        p_items: values.items,
        p_discount_pct: values.discount_pct,
        p_tax_pct: values.tax_pct,
        p_posted_by: user.id,
        p_currency: values.currency,
        p_exchange_rate: values.exchange_rate
      });

      if (rpcError) {
        // If stored procedure is not found (PGRST202 or 404), use the graceful client-side fallback
        const isProcNotFound = 
          rpcError.code === 'PGRST202' || 
          rpcError.status === 404 || 
          (rpcError.message && rpcError.message.includes('create_invoice_atomic'));

        if (isProcNotFound) {
          console.warn("Stored procedure 'create_invoice_atomic' not found. Executing client-side transaction fallback.");
          
          if (!profile?.id) throw new Error("Business profile context missing.");

          // 1. Fetch Core Accounts
          const { data: accounts, error: accError } = await supabase
            .from('accounts')
            .select('id, account_code')
            .eq('business_id', profile.id)
            .in('account_code', ['1100', '4001', '2100', '5001', '1200']);

          if (accError) throw accError;

          const arAcc = accounts?.find((a: any) => a.account_code === '1100')?.id;
          const salesAcc = accounts?.find((a: any) => a.account_code === '4001')?.id;
          const taxAcc = accounts?.find((a: any) => a.account_code === '2100')?.id;
          const cogsAcc = accounts?.find((a: any) => a.account_code === '5001')?.id;
          const invAcc = accounts?.find((a: any) => a.account_code === '1200')?.id;

          if (!arAcc || !salesAcc) {
            throw new Error("Core accounts (1100 AR / 4001 Revenue) not configured for this business.");
          }

          // 2. Query SKU Cost Prices to calculate total COGS cost
          const itemsPayload = values.items;
          const skuIds = itemsPayload.map(i => i.sku_id).filter(Boolean);
          let skusData: any[] = [];
          if (skuIds.length > 0) {
            const { data: fetchSkus, error: fetchSkusErr } = await supabase
              .from('skus')
              .select('id, cost_price')
              .in('id', skuIds);
            if (fetchSkusErr) throw fetchSkusErr;
            if (fetchSkus) skusData = fetchSkus;
          }

          // 3. Compute Totals Client-side
          let subtotal = 0;
          let totalCost = 0;
          for (const item of itemsPayload) {
            const qty = item.qty || 0;
            const price = item.unit_price || 0;
            subtotal += qty * price;
            
            if (item.sku_id) {
              const skuCost = skusData.find(s => s.id === item.sku_id)?.cost_price || 0;
              totalCost += skuCost * qty;
            }
          }

          const discAmt = subtotal * ((values.discount_pct || 0) / 100);
          const taxAmt = (subtotal - discAmt) * ((values.tax_pct || 0) / 100);
          const netTotal = subtotal - discAmt + taxAmt;

          // 4. Insert Invoice record
          const { data: invRecord, error: invInsError } = await supabase
            .from('invoices')
            .insert({
              business_id: profile.id,
              party_id: values.party_id,
              invoice_no: values.invoice_no,
              status: 'issued',
              issue_date: values.issue_date,
              due_date: values.due_date,
              subtotal,
              discount_pct: values.discount_pct || 0,
              discount_amount: discAmt,
              tax_pct: values.tax_pct || 0,
              tax_amount: taxAmt,
              total: netTotal
            })
            .select('id')
            .single();

          if (invInsError) throw invInsError;
          if (!invRecord?.id) throw new Error("Failed to retrieve generated invoice UUID.");
          invId = invRecord.id;

          // 5. Insert Invoice Items
          const itemInserts = itemsPayload.map(item => ({
            invoice_id: invId,
            sku_id: item.sku_id || null,
            description: item.description,
            qty: item.qty,
            unit: item.unit,
            unit_price: item.unit_price
          }));

          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemInserts);
          if (itemsError) throw itemsError;

          // 6. Update SKU Stocks (and decrement Qty on Hand)
          for (const item of itemsPayload) {
            if (item.sku_id) {
              const { data: skuRecord } = await supabase
                .from('skus')
                .select('qty_on_hand')
                .eq('id', item.sku_id)
                .single();
              const currentQty = skuRecord?.qty_on_hand || 0;
              await supabase
                .from('skus')
                .update({ qty_on_hand: currentQty - (item.qty || 0), updated_at: new Date().toISOString() })
                .eq('id', item.sku_id);
            }
          }

          // 7. Generate Ledger Double-Entries
          const ledgerInserts = [];
          const exRate = values.exchange_rate || 1.0;

          // DEBIT: Accounts Receivable
          ledgerInserts.push({
            business_id: profile.id,
            tx_ref: values.invoice_no,
            entry_type: 'debit',
            account_id: arAcc,
            party_id: values.party_id,
            amount: netTotal,
            description: `Sales Invoice: ${values.invoice_no}`,
            posted_by: user.id,
            invoice_id: invId
          });

          // CREDIT: Sales Revenue
          ledgerInserts.push({
            business_id: profile.id,
            tx_ref: values.invoice_no,
            entry_type: 'credit',
            account_id: salesAcc,
            party_id: values.party_id,
            amount: subtotal - discAmt,
            description: `Sales Revenue: ${values.invoice_no}`,
            posted_by: user.id,
            invoice_id: invId
          });

          // CREDIT: Sales Tax (if applicable)
          if (taxAmt > 0 && taxAcc) {
            ledgerInserts.push({
              business_id: profile.id,
              tx_ref: values.invoice_no,
              entry_type: 'credit',
              account_id: taxAcc,
              party_id: values.party_id,
              amount: taxAmt,
              description: `Sales Tax: ${values.invoice_no}`,
              posted_by: user.id,
              invoice_id: invId
            });
          }

          // DEBIT/CREDIT COGS & Inventory (if totalCost > 0)
          if (totalCost > 0 && cogsAcc && invAcc) {
            // DEBIT: Cost of Goods Sold
            ledgerInserts.push({
              business_id: profile.id,
              tx_ref: values.invoice_no,
              entry_type: 'debit',
              account_id: cogsAcc,
              amount: totalCost,
              description: `Cost of Goods Sold: ${values.invoice_no}`,
              posted_by: user.id,
              invoice_id: invId
            });

            // CREDIT: Inventory Account
            ledgerInserts.push({
              business_id: profile.id,
              tx_ref: values.invoice_no,
              entry_type: 'credit',
              account_id: invAcc,
              amount: totalCost,
              description: `Inventory Deduction: ${values.invoice_no}`,
              posted_by: user.id,
              invoice_id: invId
            });
          }

          const { error: ledgerError } = await supabase
            .from('ledger_entries')
            .insert(ledgerInserts);
          if (ledgerError) throw ledgerError;

        } else {
          throw rpcError;
        }
      } else {
        invId = data;
      }

      // Check invoice count
      const { count } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', profile?.id || '');

      // Show feedback prompt after 5th, 20th, 50th
      if (count === 5 || count === 20 || count === 50) {
        setPendingRedirectUrl(`/invoices/${invId}`);
        setTimeout(() => {
          setFeedbackOpen(true);
        }, 2000); // 2 second delay after success toast
      } else {
        router.push(`/invoices/${invId}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Post failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter flex">
      
      
      <main className={cn( "flex-1 flex flex-col transition-all duration-300 overflow-hidden")}>
        {/* Header Bar */}
        <header className="h-14 border-b border-white/5 flex items-center px-6 bg-[#1A1D21]/80 backdrop-blur-xl z-40 shrink-0">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-[#C5A059]/10 text-[#C5A059] rounded-sm">
               <FileText size={16} />
             </div>
             <div>
               <h1 className="text-xs font-bold text-white uppercase tracking-widest">New Invoice</h1>
             </div>
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            <button 
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#C5A059] text-black text-[10px] uppercase tracking-widest font-black hover:bg-[#D4AF37] transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? <span className="animate-pulse">Posting...</span> : (
                <>
                  <Save size={14} />
                  <span>Finalize & Post</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Two-Panel Workspace */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Editor Panel */}
          <div className="w-[45%] border-r border-white/5 flex flex-col bg-[#0F1113] overflow-y-auto custom-scrollbar">
            <div className="p-8 space-y-8 pb-32">
              
              {/* Context Block */}
              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest flex items-center space-x-2">
                    <FileText size={10} />
                    <span>Invoice Number</span>
                  </label>
                  <input {...register("invoice_no")} className="industrial-field font-mono" />
                </div>
              </div>

              {/* Currency Selector */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#1A1D21] border border-white/5">
                <div className="space-y-2">
                   <label className="text-[9px] uppercase font-black text-[#C5A059] tracking-widest flex items-center space-x-2">
                      <Globe size={10} />
                      <span>Currency</span>
                   </label>
                   <select {...register("currency")} className="industrial-field bg-[#0F1113]">
                      {CURRENCY_CODES.map(c => <option key={c} value={c}>{CURRENCIES[c].name} ({c})</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest flex items-center space-x-2">
                      <TrendingUp size={10} />
                      <span>Ex. Rate (vs {businessCurrency})</span>
                   </label>
                   <input 
                     type="number" 
                     step="0.000001" 
                     {...register("exchange_rate")} 
                     className="industrial-field bg-[#0F1113] font-mono" 
                     disabled={watchValues.currency === businessCurrency}
                   />
                </div>
              </div>

              {/* Customer Block */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest flex items-center justify-between">
                  <span>Customer</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={watch("party_search") || ""}
                    onChange={e => {
                      setValue("party_search", e.target.value);
                      if (e.target.value === "") setValue("party_id", "");
                    }}
                    placeholder="Search customer name..."
                    className="industrial-field"
                  />
                  {debouncedPartySearch.length > 0 && !watch("party_id") && (
                    <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-50 max-h-48 overflow-y-auto shadow-2xl">
                      {parties
                        .filter(p => p.name.toLowerCase().includes(debouncedPartySearch.toLowerCase()))
                        .map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setValue("party_id", p.id);
                              setValue("party_search", p.name);
                            }}
                            className="px-4 py-2.5 text-xs hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5"
                          >
                            <span>{p.name}</span>
                            {p.current_balance > 0 && (
                              <span className="text-[9px] text-red-400 font-mono">
                                Owes {p.current_balance}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <CreditRiskBadge partyId={watchValues.party_id} />
                <FieldError message={errors.party_id?.message} />
              </div>

              {/* Dates Block */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Issue Date</label>
                  <input type="date" {...register("issue_date")} className="industrial-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Due Date</label>
                  <input type="date" {...register("due_date")} className="industrial-field" />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-[10px] uppercase font-black tracking-widest text-[#C5A059]">Line Items</h3>
                  <button 
                    type="button"
                    onClick={() => append({ description: "", qty: 1, unit: "piece", unit_price: 0 })}
                    className="text-[9px] uppercase font-bold text-gray-500 hover:text-white transition-colors flex items-center space-x-1"
                  >
                    <Plus size={12} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="group relative bg-[#1A1D21] border border-white/5 p-4 space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1 space-y-2">
                          <input 
                            {...register(`items.${index}.description`)}
                            placeholder="Item description or SKU..."
                            className="w-full bg-transparent border-none outline-none text-xs text-white placeholder:text-gray-700"
                            onFocus={() => setActiveSkuIndex(index)}
                            onChange={(e) => {
                              setValue(`items.${index}.description`, e.target.value);
                              setSkuSearch(e.target.value);
                            }}
                          />
                          <FieldError message={errors.items?.[index]?.description?.message} />
                          {/* Sku Search Results */}
                          {activeSkuIndex === index && filteredSkus.length > 0 && (
                            <div className="absolute left-4 right-4 top-12 z-50 bg-[#2D3139] border border-white/10 shadow-2xl rounded-sm">
                              {filteredSkus.map(s => (
                                <div 
                                  key={s.id}
                                  onClick={() => {
                                    setValue(`items.${index}.sku_id`, s.id);
                                    setValue(`items.${index}.description`, s.name);
                                    setValue(`items.${index}.unit_price`, s.sale_price);
                                    setValue(`items.${index}.unit`, s.unit);
                                    setActiveSkuIndex(null);
                                    setSkuSearch("");
                                  }}
                                  className="px-4 py-2 hover:bg-[#C5A059]/10 cursor-pointer border-b border-white/5 last:border-0"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-white">{s.sku_code}</span>
                                    <span className="text-[10px] font-mono text-[#C5A059]">{watchValues.currency} {s.sale_price}</span>
                                  </div>
                                  <p className="text-[9px] text-gray-500">{s.name}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button type="button" onClick={() => remove(index)} className="text-gray-700 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#0F1113] p-2 border border-white/5">
                           <span className="text-[8px] uppercase text-gray-600 font-bold block mb-1">Qty</span>
                           <input type="number" {...register(`items.${index}.qty`)} className="w-full bg-transparent border-none outline-none text-xs font-mono text-white" />
                           <FieldError message={errors.items?.[index]?.qty?.message} />
                        </div>
                        <div className="bg-[#0F1113] p-2 border border-white/5">
                           <span className="text-[8px] uppercase text-gray-600 font-bold block mb-1">Unit Price</span>
                           <input type="number" {...register(`items.${index}.unit_price`)} className="w-full bg-transparent border-none outline-none text-xs font-mono text-white" />
                           <FieldError message={errors.items?.[index]?.unit_price?.message} />
                        </div>
                        <div className="bg-[#0F1113] p-2 border border-white/5 flex flex-col justify-center items-end">
                           <span className="text-[8px] uppercase text-gray-600 font-bold block mb-1">Line Total</span>
                           <span className="text-xs font-mono text-gray-400">
                             {new Decimal(watchValues.items[index]?.qty || 0).times(watchValues.items[index]?.unit_price || 0).toFixed(2)}
                           </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <FieldError message={errors.items?.message} />
              </div>

              {/* Adjustments Block */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                 <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Global Discount (%)</label>
                    <input type="number" {...register("discount_pct")} className="industrial-field font-mono" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">{taxName} (%)</label>
                    <input type="number" {...register("tax_pct")} className="industrial-field font-mono" />
                 </div>
              </div>

            </div>
          </div>

          {/* RIGHT: Live Preview Panel */}
          <div className="flex-1 bg-[#1A1D21] p-12 overflow-y-auto flex justify-center custom-scrollbar">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-[800px] aspect-[1/1.414] bg-white text-black shadow-2xl p-16 flex flex-col relative"
            >
              {/* Draft Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-45deg] select-none">
                <span className="text-[120px] font-black uppercase">Draft Preview</span>
              </div>

              {/* PDF Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-10 mb-10 shrink-0">
                 <div className="space-y-1">
                   <h2 className="text-2xl font-black uppercase tracking-tighter">{profile?.business_name || "Noxis"}</h2>
                   <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{profile?.address || ""}</p>
                   <p className="text-[10px] font-bold text-gray-600">{profile?.tax_number ? `NTN: ${profile.tax_number}` : ""}</p>
                 </div>
                 <div className="text-right">
                   <h1 className="text-4xl font-black text-gray-200 mb-2">INVOICE</h1>
                   <div className="text-[10px] font-bold space-y-1 uppercase">
                     <p>Serial: <span className="text-black font-mono">{watchValues.invoice_no || "---"}</span></p>
                     <p>Issued: <span className="text-black font-mono">{watchValues.issue_date}</span></p>
                     <p>Due: <span className="text-black font-mono">{watchValues.due_date}</span></p>
                   </div>
                 </div>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-2 gap-12 mb-12 shrink-0">
                 <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase mb-3 tracking-widest">Bill To</p>
                   <p className="text-lg font-black uppercase tracking-tight">{selectedParty?.name || "Customer"}</p>
                   <p className="text-[10px] text-gray-600 mt-1 max-w-[200px] leading-relaxed uppercase">{selectedParty?.address || ""}</p>
                   <p className="text-[10px] font-mono mt-2 font-bold">{selectedParty?.phone}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] text-gray-500 mt-1 uppercase">Term: {watchValues.payment_terms}</p>
                 </div>
              </div>

              {/* Line Items */}
              <div className="flex-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-black text-[9px] uppercase font-black text-gray-500">
                      <th className="py-3 text-left">Description</th>
                      <th className="py-3 text-center w-20">Qty</th>
                      <th className="py-3 text-right w-32">Rate ({watchValues.currency})</th>
                      <th className="py-3 text-right w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {watchValues.items.map((item, i) => (
                      <tr key={i} className="text-[11px]">
                        <td className="py-4 font-bold uppercase tracking-tight">{item.description || "—"}</td>
                        <td className="py-4 text-center font-mono">{item.qty || 0}</td>
                        <td className="py-4 text-right font-mono">{new Decimal(item.unit_price || 0).toFixed(2)}</td>
                        <td className="py-4 text-right font-mono font-black">
                          {new Decimal(item.qty || 0).times(item.unit_price || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Block */}
              <div className="shrink-0 pt-10 border-t border-black/5 flex justify-end">
                <div className="w-72 space-y-3">                   <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                     <span>Subtotal (Gross)</span>
                     <span className="font-mono text-black">{debouncedTotals.subtotal.toFixed(2)}</span>
                   </div>
                   {debouncedTotals.discountAmount > 0 && (
                     <div className="flex justify-between text-[10px] uppercase font-bold text-red-500">
                       <span>Trade Discount ({watchValues.discount_pct}%)</span>
                       <span className="font-mono">-{debouncedTotals.discountAmount.toFixed(2)}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                     <span>{taxName} ({watchValues.tax_pct}%)</span>
                     <span className="font-mono text-black">+{debouncedTotals.taxAmount.toFixed(2)}</span>
                   </div>
                   <div className="pt-4 border-t-2 border-black flex justify-between items-baseline">
                     <span className="text-xs font-black uppercase tracking-[0.2em]">Net Payable</span>
                     <div className="text-right">
                       <span className="text-[10px] font-bold mr-2 uppercase">{watchValues.currency}</span>
                       <span className="text-3xl font-black font-mono tracking-tighter">{debouncedTotals.total.toFixed(2)}</span>
                     </div>
                   </div>
 
                   {/* Multi-Currency Conversion Info */}
                   {watchValues.currency !== businessCurrency && (
                     <div className="p-3 bg-blue-50 border border-blue-200 mt-2">
                        <p className="text-[7px] uppercase font-black text-blue-400 mb-1 tracking-widest">Base Currency Equivalent</p>
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black font-mono text-blue-800">{businessCurrency} {new Decimal(debouncedTotals.total).times(watchValues.exchange_rate).toFixed(2)}</span>
                           <span className="text-[8px] font-bold text-blue-400">Rate: {watchValues.exchange_rate}</span>
                        </div>
                     </div>
                   )}
 
                   <div className="p-3 bg-gray-50 border border-black/5 mt-4">
                     <p className="text-[7px] uppercase font-black text-gray-400 mb-1 tracking-widest">Amount in Words</p>
                     <p className="text-[9px] font-bold italic leading-tight text-gray-800">
                        {numberToWords(debouncedTotals.total, watchValues.currency)}
                     </p>
                    </div>
                </div>
              </div>

              {/* PDF Footer */}
              <div className="mt-auto pt-16 flex justify-between items-end shrink-0">
                 <div className="space-y-4">
                   <div className="w-48 h-[1px] bg-black/20" />
                   <p className="text-[8px] uppercase font-bold text-gray-400">Authorized Personnel Signature</p>
                 </div>
                 <div className="text-right space-y-1">
                   <p className="text-[9px] font-black uppercase">Electronic Record Verification</p>
                   <p className="text-[7px] font-mono text-gray-400 uppercase tracking-widest">DOC_HASH: {docHash}</p>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .industrial-field {
          width: 100%;
          background: #1A1D21;
          border: 1px solid rgba(255,255,255,0.05);
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.75rem;
          outline: none;
          transition: all 0.2s;
          border-radius: 2px;
        }
        .industrial-field:focus {
          border-color: #C5A059;
          background: #2D3139;
        }
        .industrial-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
      
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => {
          setFeedbackOpen(false);
          if (pendingRedirectUrl) {
            router.push(pendingRedirectUrl);
          }
        }}
        trigger="post_invoice"
      />
    </div>
  );
}
