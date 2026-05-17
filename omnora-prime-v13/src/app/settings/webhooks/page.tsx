"use client";
import { useEffect, useState } from 'react';
import React from 'react';
// app/settings/webhooks/page.tsx
import { 
  Webhook, Plus, ExternalLink, Shield, 
  CheckCircle2, XCircle, Loader2, Search, Trash2, Key, History, Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function WebhookManagementPage() {
  const supabase = createClient();
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

   useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: epData } = await supabase.from('webhook_endpoints').select('*');
    const { data: delData } = await supabase.from('webhook_deliveries').select('*').order('delivered_at', { ascending: false }).limit(50);
    
    if (epData) setEndpoints(epData);
    if (delData) setDeliveries(delData);
    setLoading(false);
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.functions.invoke('deliver-webhook', {
        body: { 
          eventType: 'ping', 
          payload: { message: 'Webhooks online' },
          businessId: user?.user_metadata?.business_id 
        }
      });
      fetchData();
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="bg-onyx min-h-screen text-gray-300 font-inter p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex justify-between items-end">
           <div>
              <div className="flex items-center space-x-3 mb-2">
                 <Webhook className="text-electric-blue" size={24} />
                 <h1 className="text-4xl font-bold text-white tracking-tighter">API Webhooks</h1>
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Configure real-time event delivery for 3rd party tool automation
              </p>
           </div>
           <button 
             onClick={() => setShowAddModal(true)}
             className="bg-electric-blue text-onyx px-8 py-3 font-bold uppercase tracking-widest text-[10px] flex items-center rounded-sm hover:brightness-110 transition-all"
           >
              <Plus size={14} className="mr-2" /> Register Endpoint
           </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
           {/* Endpoints List */}
           <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Active Subscriptions</h3>
              {loading ? (
                Array(2).fill(0).map((_, i) => <div key={i} className="h-32 bg-surface border border-white/5 animate-pulse" />)
              ) : endpoints.length === 0 ? (
                <div className="bg-surface/30 border border-dashed border-white/10 p-12 text-center rounded-sm">
                   <Webhook size={40} className="mx-auto text-gray-700 mb-4" />
                   <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No webhook endpoints configured</p>
                </div>
              ) : (
                endpoints.map(ep => (
                  <motion.div 
                    key={ep.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-surface border border-white/10 p-6 rounded-sm space-y-4 hover:border-white/20 transition-all group"
                  >
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <h4 className="text-sm font-bold text-white uppercase tracking-wider">{ep.name}</h4>
                           <p className="text-[10px] font-mono text-gray-500">{ep.url}</p>
                        </div>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => handleTest(ep.id)}
                             disabled={testing === ep.id}
                             className="p-2 bg-white/5 hover:bg-electric-blue/20 text-gray-500 hover:text-electric-blue transition-all"
                             title="Send Test Ping"
                           >
                              {testing === ep.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                           </button>
                           <button className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-all">
                              <Trash2 size={14} />
                           </button>
                        </div>
                     </div>
                     <div className="flex items-center space-x-4 pt-4 border-t border-white/5">
                        <div className="flex flex-wrap gap-2">
                           {ep.events.map((ev: string) => (
                             <span key={ev} className="text-[8px] font-black text-gray-600 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest">{ev}</span>
                           ))}
                        </div>
                        <div className="ml-auto flex items-center space-x-2">
                           <Shield size={12} className="text-emerald" />
                           <span className="text-[9px] font-bold text-emerald uppercase tracking-widest">Signed</span>
                        </div>
                     </div>
                  </motion.div>
                ))
              )}
           </div>

           {/* Delivery Log */}
           <div className="space-y-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] flex items-center">
                 <History size={14} className="mr-2 text-gray-600" /> Recent Deliveries
              </h3>
              <div className="bg-surface border border-white/5 rounded-sm overflow-hidden divide-y divide-white/5">
                 {deliveries.length === 0 ? (
                   <div className="p-12 text-center text-[10px] text-gray-700 font-bold uppercase tracking-widest">Logs Empty</div>
                 ) : (
                   deliveries.map(del => (
                     <div key={del.id} className="p-4 hover:bg-white/[0.02] transition-all flex items-center justify-between group">
                        <div className="space-y-1">
                           <p className="text-[10px] font-bold text-white uppercase tracking-widest">{del.event_type}</p>
                           <p className="text-[8px] text-gray-600 font-mono">{new Date(del.delivered_at).toLocaleTimeString()}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                           <span className={`text-[9px] font-mono ${del.success ? 'text-emerald' : 'text-red-500'}`}>{del.response_status}</span>
                           {del.success ? <CheckCircle2 size={12} className="text-emerald" /> : <XCircle size={12} className="text-red-500" />}
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Add Modal (Mock) */}
      <AnimatePresence>
         {showAddModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-onyx/80 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface border border-white/10 w-full max-w-lg p-12 space-y-8">
                 <h2 className="text-2xl font-bold text-white tracking-tighter">New Webhook Endpoint</h2>
                 <div className="space-y-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Destination URL</label>
                       <input placeholder="https://api.thirdparty.com/webhook" className="w-full bg-onyx border border-white/10 p-4 text-sm text-white focus:border-electric-blue outline-none" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Secret Token</label>
                       <div className="flex space-x-2">
                          <input type="password" value="••••••••••••••••" readOnly className="flex-1 bg-onyx border border-white/10 p-4 text-sm text-white outline-none" />
                          <button className="p-4 bg-white/5 text-gray-500"><Key size={16} /></button>
                       </div>
                    </div>
                 </div>
                 <div className="flex space-x-4">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 border border-white/10 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Cancel</button>
                    <button className="flex-1 bg-electric-blue text-onyx py-4 text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all">Register</button>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}

