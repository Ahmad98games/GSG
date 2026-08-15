// src/app/(kitchen)/live/page.tsx
"use client";

import React, { useState } from "react";
import { useKitchenOrders, useMenuItems } from "@/hooks/useKitchenQueries";
import { usePersona } from "@/hooks/usePersona";
import { useSidebarState } from "@/hooks/useSidebarState";

import { cn } from "@/lib/utils";
import { 
  Utensils, Clock, CheckCircle, 
  AlertTriangle, Flame, TrendingUp,
  DollarSign, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function KitchenLivePage() {
  const { t, fmt } = usePersona();
  const { isCollapsed } = useSidebarState();
  const { data: orders, isLoading: ordersLoading } = useKitchenOrders();
  const { data: menu, isLoading: menuLoading } = useMenuItems();
  
  const [activeTab, setActiveTab] = useState<'live' | 'menu'>('live');

  

  return (
    <div className="min-h-screen bg-onyx text-slate-200">
      
      <main className={cn( "transition-all duration-300")}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <span>NOXIS Kitchen</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-electric-blue">Live Operations</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">{activeTab === 'live' ? 'Orders Ticker' : 'Menu Costing'}</span>
          </div>
          
          <div className="ml-auto flex items-center space-x-2 bg-white/5 p-1">
            <button 
              onClick={() => setActiveTab('live')}
              className={cn(
                "px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all",
                activeTab === 'live' ? "bg-electric-blue text-onyx" : "text-gray-500 hover:text-white"
              )}
            >
              Live Orders
            </button>
            <button 
              onClick={() => setActiveTab('menu')}
              className={cn(
                "px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all",
                activeTab === 'menu' ? "bg-electric-blue text-onyx" : "text-gray-500 hover:text-white"
              )}
            >
              Food Cost
            </button>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto">
          {activeTab === 'live' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {orders?.map((order: any, i: number) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={order.id}
                    className={cn(
                      "bg-surface border p-5 relative group",
                      order.status === 'draft' ? "border-sandstone-gold shadow-[0_0_15px_rgba(234,179,8,0.1)]" : "border-white/5"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">#{order.invoice_no}</span>
                        <h3 className="text-sm font-bold text-white uppercase">{order.party?.name || 'Walk-in'}</h3>
                      </div>
                      <div className={cn(
                        "p-2 rounded-full",
                        order.status === 'draft' ? "text-sandstone-gold bg-sandstone-gold/10" : "text-electric-blue bg-electric-blue/10"
                      )}>
                        {order.status === 'draft' ? <Flame size={16} /> : <Utensils size={16} />}
                      </div>
                    </div>

                    <div className="space-y-2 mb-6 min-h-[100px]">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-gray-400"><span className="text-white font-mono mr-2">{item.qty}x</span>{item.description}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <div className="flex items-center space-x-2 text-[10px] text-gray-500 uppercase font-bold">
                        <Clock size={12} />
                        <span>{Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000)}m Elapsed</span>
                      </div>
                      <button className="text-[10px] font-bold text-electric-blue hover:text-white transition-colors uppercase tracking-widest">
                        Mark Ready
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-surface border border-white/5 overflow-hidden">
               <div className="p-6 border-b border-white/5 bg-onyx/30 flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">Menu Economics</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-critical-red" />
                    <span className="text-[9px] uppercase text-gray-500">High Food Cost (&gt;35%)</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-onyx/50 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Item Name</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Category</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-right">Sale Price</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-right">Food Cost</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-right">Cost %</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menu?.map((item: any) => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-white">{item.name}</td>
                        <td className="px-6 py-4 text-[10px] uppercase text-gray-500">{item.category}</td>
                        <td className="px-6 py-4 text-xs font-mono text-right">{fmt(item.sale_price)}</td>
                        <td className="px-6 py-4 text-xs font-mono text-right text-gray-400">{fmt(item.food_cost)}</td>
                        <td className={cn(
                          "px-6 py-4 text-xs font-mono font-bold text-right",
                          item.food_cost_pct > 35 ? "text-critical-red" : "text-emerald"
                        )}>
                          {Number(item.food_cost_pct).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={cn(
                            "w-2 h-2 rounded-full mx-auto",
                            item.is_available ? "bg-emerald shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-gray-700"
                          )} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

