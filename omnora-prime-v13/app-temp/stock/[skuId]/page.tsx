"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, ArrowLeft, BarChart3, 
  History, Settings2, ShieldCheck,
  TrendingUp, Truck, Warehouse,
  AlertTriangle, CheckCircle2,
  Image as ImageIcon, Upload, Maximize2,
  Calendar, Info, Edit3, Printer, Boxes, ShoppingCart, Plus
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Decimal from "decimal.js";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from "recharts";
import Image from "next/image";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  colorClass?: string;
  fontMono?: boolean;
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'gold';
}

// --- Components ---

const StatCard = ({ label, value, sub, icon: Icon, colorClass, fontMono = false }: StatCardProps) => (
  <div className="bg-[#1A1D21] border border-white/5 p-5 relative overflow-hidden group hover:border-white/10 transition-all">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon size={48} />
    </div>
    <p className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">{label}</p>
    <div className="flex items-baseline space-x-2">
      <h3 className={cn(
        "text-2xl font-black tracking-tighter",
        fontMono ? "font-mono" : "font-inter",
        colorClass
      )}>{value}</h3>
      {sub && <span className="text-[10px] uppercase font-bold text-gray-600">{sub}</span>}
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label }: TabButtonProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center space-x-2 px-6 py-4 border-b-2 transition-all text-[10px] uppercase font-black tracking-widest",
      active 
        ? "border-[#C5A059] text-white bg-white/5" 
        : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
    )}
  >
    <Icon size={14} />
    <span>{label}</span>
  </button>
);

const Badge = ({ children, variant = "default" }: BadgeProps) => {
  const styles: Record<string, string> = {
    default: "bg-white/5 text-gray-400",
    emerald: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    red: "bg-red-500/10 text-red-500",
    blue: "bg-blue-500/10 text-blue-500",
    purple: "bg-purple-500/10 text-purple-500",
    gold: "bg-[#C5A059]/10 text-[#C5A059]"
  };
  return (
    <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px]", styles[variant])}>
      {children}
    </span>
  );
};

// --- Page Component ---

export default function SKUDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { fmt } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  const skuId = params.skuId as string;
  const [activeTab, setActiveTab] = useState("history");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const expiryThreshold = useMemo(() => new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), [now]);

  // Queries
  const { data: sku, isLoading: skuLoading } = useQuery({
    queryKey: ['sku', skuId],
    queryFn: async () => {
      const { data, error } = await supabase.from('skus').select('*').eq('id', skuId).single();
      if (error) throw error;
      return data;
    }
  });

  const { data: movements } = useQuery({
    queryKey: ['sku_movements', skuId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfer_logs')
        .select('*')
        .eq('sku_id', skuId)
        .order('initiated_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!sku
  });

  const { data: gallery } = useQuery({
    queryKey: ['sku_gallery', skuId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sku_gallery')
        .select('*')
        .eq('sku_id', skuId)
        .order('sort_order', { ascending: true });
      if (error) return []; // Fallback if table doesn't exist or error
      return data || [];
    },
    enabled: !!sku
  });

  // Logic
  const marginData = useMemo(() => {
    if (!sku?.cost_price || !sku?.sale_price) return { pct: 0, color: 'red' };
    const cost = new Decimal(sku.cost_price);
    const sale = new Decimal(sku.sale_price);
    if (cost.isZero()) return { pct: 0, color: 'red' };
    
    const marginPct = sale.minus(cost).dividedBy(cost).times(100).toNumber();
    let color = 'red';
    if (marginPct > 20) color = 'emerald';
    else if (marginPct >= 10) color = 'amber';
    
    return { pct: marginPct.toFixed(1), color };
  }, [sku]);

  const historyWithBalance = useMemo(() => {
    if (!movements) return [];
    let balance = new Decimal(0);
    return movements.map((m: any) => {
      // Logic for movement type (mocked/inferred for now)
      let type = 'transfer';
      if (m.reference_no?.startsWith('PUR')) type = 'purchase';
      if (m.reference_no?.startsWith('INV')) type = 'sale';
      if (m.reference_no?.startsWith('ADJ')) type = 'adjustment';
      
      // Update running balance
      balance = balance.plus(m.qty);
      return { ...m, type, runningBalance: balance.toNumber() };
    }).reverse(); // Show newest first in table but calc was oldest to newest
  }, [movements]);

  const chartData = useMemo(() => {
    if (!movements) return [];
    // Aggregate by date for the last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    let currentBal = new Decimal(0);
    const dailyBal: any = {};
    
    movements.forEach((m: any) => {
      const date = m.initiated_at.split('T')[0];
      currentBal = currentBal.plus(m.qty);
      dailyBal[date] = currentBal.toNumber();
    });

    let lastKnownBal = 0;
    return last30Days.map(date => {
      if (dailyBal[date] !== undefined) lastKnownBal = dailyBal[date];
      return { date: date.split('-').slice(1).join('/'), qty: lastKnownBal };
    });
  }, [movements]);

  if (skuLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Initializing SKU Data Node...
    </div>
  );

  if (!sku) return (
    <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center space-y-4">
      <AlertTriangle className="text-red-500" size={48} />
      <h1 className="text-white uppercase font-black tracking-widest">SKU Not Found in Registry</h1>
      <button onClick={() => router.back()} className="text-[10px] text-gray-500 hover:text-white uppercase font-black tracking-widest border border-white/10 px-6 py-2 transition-all">Return to Stock</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter selection:bg-[#C5A059]/30">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col pb-20">
        {/* Breadcrumb Header */}
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <button onClick={() => router.back()} className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mr-8 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Back to Stock</span>
           </button>
           <div className="h-4 w-px bg-white/10 mx-4" />
           <div className="flex items-center space-x-3">
              <Package size={16} className="text-[#C5A059]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Registry / SKUs / {sku.sku_code}</span>
           </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8">
           {/* HERO SECTION */}
           <section className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left: Image */}
              <div className="w-full lg:w-[250px] aspect-square bg-[#1A1D21] border border-white/5 flex items-center justify-center overflow-hidden relative group">
                {sku.thumbnail_url ? (
                  <Image 
                    src={sku.thumbnail_url} 
                    alt={sku.name}
                    width={250}
                    height={250}
                    className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059] font-mono text-2xl font-black">
                      {sku.sku_code.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => sku.thumbnail_url && setFullscreenImage(sku.thumbnail_url)} className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all rounded-full">
                    <Maximize2 size={20} />
                  </button>
                </div>
              </div>

              {/* Right: Info + Stats */}
              <div className="flex-1 space-y-6 w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="font-mono text-[#C5A059] text-2xl font-black tracking-tight">{sku.sku_code}</h2>
                    <h1 className="text-xl font-semibold text-white mt-1 uppercase tracking-tight">{sku.name}</h1>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="gold">{sku.category || 'Uncategorized'}</Badge>
                      <Badge>{sku.unit}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {sku.qty_on_hand <= sku.reorder_level && (
                      <button 
                        onClick={() => router.push(`/purchase/new?sku_id=${sku.id}`)}
                        className="flex items-center space-x-2 bg-amber-500 text-black px-4 py-2 text-[10px] uppercase font-black tracking-widest transition-all animate-pulse"
                      >
                        <ShoppingCart size={12} />
                        <span>Reorder Now</span>
                      </button>
                    )}
                    <button className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 text-[10px] uppercase font-black tracking-widest border border-white/5 transition-all">
                      <Plus size={12} />
                      <span>Add Stock</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 text-[10px] uppercase font-black tracking-widest border border-white/5 transition-all">
                      <Boxes size={12} />
                      <span>Adjust Stock</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-[#C5A059] hover:brightness-110 text-black px-4 py-2 text-[10px] uppercase font-black tracking-widest transition-all">
                      <Printer size={12} />
                      <span>Print Label</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard 
                    label="Qty on Hand" 
                    value={sku.qty_on_hand} 
                    sub={sku.unit}
                    icon={Package}
                    colorClass={
                      sku.qty_on_hand === 0 ? "text-red-500" :
                      sku.qty_on_hand <= sku.reorder_level ? "text-amber-500" : "text-emerald-500"
                    }
                    fontMono
                  />
                  <StatCard 
                    label="Cost Price" 
                    value={fmt(sku.cost_price)} 
                    icon={TrendingUp}
                    colorClass="text-[#C5A059]"
                    fontMono
                  />
                  <StatCard 
                    label="Sale Price" 
                    value={fmt(sku.sale_price)} 
                    icon={BarChart3}
                    colorClass="text-[#C5A059]"
                    fontMono
                  />
                  <StatCard 
                    label="Gross Margin" 
                    value={`${marginData.pct}%`} 
                    icon={TrendingUp}
                    colorClass={
                      marginData.color === 'emerald' ? "text-emerald-500" :
                      marginData.color === 'amber' ? "text-amber-500" : "text-red-500"
                    }
                    fontMono
                  />
                </div>
              </div>
           </section>

           {/* TABS SECTION */}
           <div className="bg-[#1A1D21] border border-white/5 min-h-[500px] flex flex-col">
              <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
                <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={History} label="Movement History" />
                <TabButton active={activeTab === "gallery"} onClick={() => setActiveTab("gallery")} icon={ImageIcon} label="Gallery" />
                <TabButton active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} icon={BarChart3} label="Stock Analytics" />
                {sku.batch_number && <TabButton active={activeTab === "batch"} onClick={() => setActiveTab("batch")} icon={Info} label="Batch/Lot Info" />}
              </div>

              <div className="flex-1 p-6">
                <AnimatePresence mode="wait">
                  {activeTab === "history" && (
                    <motion.div 
                      key="history"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {historyWithBalance.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 text-[9px] uppercase font-black text-gray-600 tracking-widest text-left">
                                <th className="pb-4 px-4">Date</th>
                                <th className="pb-4 px-4 text-right">Change</th>
                                <th className="pb-4 px-4">Reason</th>
                                <th className="pb-4 px-4">Reference</th>
                                <th className="pb-4 px-4 text-right">Balance</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs">
                              {historyWithBalance.map((m: any, idx: number) => (
                                <tr key={m.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group">
                                  <td className="py-4 px-4 text-gray-400 font-mono text-[10px]">
                                    {new Date(m.initiated_at).toLocaleDateString()}
                                  </td>
                                  <td className={cn(
                                    "py-4 px-4 font-mono font-bold text-right",
                                    m.qty > 0 ? "text-emerald-500" : "text-red-500"
                                  )}>
                                    {m.qty > 0 ? `+${m.qty}` : m.qty}
                                  </td>
                                  <td className="py-4 px-4">
                                    <Badge variant={
                                      m.type === 'purchase' ? 'blue' :
                                      m.type === 'sale' ? 'emerald' :
                                      m.type === 'adjustment' ? 'amber' : 'purple'
                                    }>{m.type}</Badge>
                                  </td>
                                  <td className="py-4 px-4 text-gray-500 font-medium">{m.reference_no || '—'}</td>
                                  <td className="py-4 px-4 text-right font-mono font-bold text-white">
                                    {m.runningBalance}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                           <History size={48} strokeWidth={1} className="opacity-20 mb-4" />
                           <p className="text-[10px] uppercase font-black tracking-[0.3em]">No movement data found</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "gallery" && (
                    <motion.div 
                      key="gallery"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-6"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Asset Management</h3>
                        <button className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 text-[10px] uppercase font-black tracking-widest border border-white/5 transition-all">
                          <Upload size={14} />
                          <span>Upload New Asset</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {/* Always show main thumbnail first */}
                        {sku.thumbnail_url && (
                          <div 
                            className="aspect-square bg-[#1A1D21] border border-white/5 hover:border-[#C5A059]/50 transition-all cursor-pointer relative group overflow-hidden"
                            onClick={() => setFullscreenImage(sku.thumbnail_url)}
                          >
                            <Image src={sku.thumbnail_url} alt="Main" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-2 left-2">
                              <Badge variant="gold">Main</Badge>
                            </div>
                          </div>
                        )}
                        {gallery.map((img: any) => (
                          <div 
                            key={img.id}
                            className="aspect-square bg-[#1A1D21] border border-white/5 hover:border-[#C5A059]/50 transition-all cursor-pointer relative group overflow-hidden"
                            onClick={() => setFullscreenImage(img.storage_url)}
                          >
                            <Image src={img.storage_url} alt={img.label || 'Gallery'} fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            {img.label && (
                              <div className="absolute bottom-2 left-2">
                                <span className="text-[8px] uppercase font-black text-white bg-black/60 px-1 py-0.5">{img.label}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "analytics" && (
                    <motion.div 
                      key="analytics"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-[400px] w-full"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Stock Level Velocity (30 Days)</h3>
                        <div className="flex items-center space-x-4">
                           <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                              <span className="text-[9px] uppercase font-black text-gray-500">Inventory Balance</span>
                           </div>
                           <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 border-t-2 border-dashed border-red-500/50" />
                              <span className="text-[9px] uppercase font-black text-gray-500">Reorder Level</span>
                           </div>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            stroke="#475569" 
                            fontSize={9} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#475569" 
                            fontSize={9} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(val) => `${val}${sku.unit}`}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1A1D21', border: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                            itemStyle={{ color: '#C5A059' }}
                          />
                          <ReferenceLine y={sku.reorder_level} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
                          <Line 
                            type="monotone" 
                            dataKey="qty" 
                            stroke="#C5A059" 
                            strokeWidth={2} 
                            dot={{ fill: '#C5A059', strokeWidth: 0, r: 3 }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}

                  {activeTab === "batch" && (
                    <motion.div 
                      key="batch"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                      <div className="bg-white/[0.02] border border-white/5 p-6 space-y-6">
                        <div className="flex items-center space-x-3 text-[#C5A059]">
                          <Boxes size={18} />
                          <h3 className="text-[11px] uppercase font-black tracking-widest">Active Batch Identification</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-[10px] uppercase font-black text-gray-600">Batch Number</span>
                            <span className="text-xs font-mono font-bold text-white">{sku.batch_number}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-[10px] uppercase font-black text-gray-600">Expiry Date</span>
                            <div className="flex items-center space-x-2">
                               <Calendar size={12} className="text-gray-500" />
                               <span className={cn(
                                 "text-xs font-mono font-bold",
                                 new Date(sku.expiry_date) < now ? "text-red-500" :
                                 new Date(sku.expiry_date) < expiryThreshold ? "text-amber-500" : "text-emerald-500"
                               )}>
                                 {new Date(sku.expiry_date).toLocaleDateString()}
                               </span>
                            </div>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-[10px] uppercase font-black text-gray-600">GSM / Density</span>
                            <span className="text-xs font-bold text-white">{sku.gsm || '—'}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-[10px] uppercase font-black text-gray-600">Weave Pattern</span>
                            <span className="text-xs font-bold text-white uppercase">{sku.weave_type || 'Standard'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white/[0.02] border border-white/5 p-6 space-y-6">
                        <div className="flex items-center space-x-3 text-blue-500">
                          <ShieldCheck size={18} />
                          <h3 className="text-[11px] uppercase font-black tracking-widest">Compliance & Certification</h3>
                        </div>
                        <div className="space-y-4">
                           <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-sm">
                              <p className="text-[10px] text-blue-400 font-medium leading-relaxed italic">
                                This batch is certified for industrial use. Ensure storage temperature does not exceed 35°C to maintain integrity of {sku.unit} measurement precision.
                              </p>
                           </div>
                           <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5">
                              <span className="text-[9px] uppercase font-black text-gray-500">Quality Check Status</span>
                              <div className="flex items-center space-x-1 text-emerald-500">
                                <CheckCircle2 size={12} />
                                <span className="text-[9px] uppercase font-black">Passed</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
           </div>
        </div>

        {/* Fullscreen Image Overlay */}
        <AnimatePresence>
          {fullscreenImage && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFullscreenImage(null)}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-12 cursor-zoom-out"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full h-full"
              >
                <Image src={fullscreenImage} alt="Fullscreen" fill className="object-contain" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
