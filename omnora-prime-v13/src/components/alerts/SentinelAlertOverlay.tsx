"use client";
import { useEffect, useState } from 'react';
import React from 'react';
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { 
  AlertCircle, ShieldAlert, CheckCircle2, 
  WifiOff, ArrowRight, ShieldCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePersona } from "@/hooks/usePersona";

export default function SentinelAlertOverlay() {
  const { t } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { profile } = useBusinessProfile();
  const [ackInput, setAckInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // 1. Fetch active critical alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['critical-alerts', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audit')
        .select('*, cctv_nodes(node_label)')
        .eq('business_id', profile?.id)
        .eq('state', 'active')
        .eq('severity', 'critical')
        .order('triggered_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
    refetchInterval: 60_000,
  });

  // 2. Realtime subscription for alerts
   useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`audit-alerts-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'security_audit',
        filter: `business_id=eq.${profile.id}` 
      }, (payload: any) => {
        if (payload.new.severity === 'critical') {
          queryClient.invalidateQueries({ queryKey: ['critical-alerts'] });
          // Play alert sound if needed
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, queryClient, supabase]);

  const activeAlert = alerts[0];

  const handleAcknowledge = async () => {
    if (ackInput.toLowerCase().trim() !== activeAlert.cctv_nodes.node_label.toLowerCase().trim()) {
      return;
    }

    setIsSyncing(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const timestamp = new Date().toISOString();
    
    // Generate ack_code (Simplified HMAC simulation for demo, real uses crypto.subtle)
    const ackCode = `ACK-${activeAlert.id.slice(0,8)}-${userId?.slice(0,4)}-${Date.now()}`;

    const updatePayload = {
      state: 'acknowledged',
      acknowledged_at: timestamp,
      acknowledged_by: userId,
      ack_code: ackCode,
      operator_notes: "Forensic confirmation via terminal overlay."
    };

    try {
      const { error } = await supabase
        .from('security_audit')
        .update(updatePayload)
        .eq('id', activeAlert.id);

      if (error) throw error;
      
      setAckInput("");
      queryClient.invalidateQueries({ queryKey: ['critical-alerts'] });
    } catch (err) {
      console.warn("Acknowledgement queued due to connectivity loss.");
      const queue = JSON.parse(localStorage.getItem('pending_acks') || '[]');
      queue.push({ id: activeAlert.id, ...updatePayload });
      localStorage.setItem('pending_acks', JSON.stringify(queue));
      // Optimistic remove
      queryClient.setQueryData(['critical-alerts', profile?.id], (old: any[]) => old.slice(1));
    } finally {
      setIsSyncing(false);
    }
  };

  if (!activeAlert) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-auto overflow-hidden">
        {/* Pulsing Red Border */}
        <motion.div 
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="absolute inset-0 border-[12px] border-critical-red pointer-events-none"
        />

        {/* Backdrop */}
        <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md" />

        <div className="relative h-full flex items-center justify-center p-8">
           <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-2xl w-full bg-surface border border-red-500/30 p-12 shadow-[0_0_100px_rgba(239,68,68,0.2)]"
           >
              <div className="flex flex-col items-center text-center space-y-8">
                 <div className="p-6 bg-red-500/10 rounded-sm">
                    <ShieldAlert size={64} className="text-critical-red animate-pulse" />
                 </div>

                 <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">{t('security.alert_title')}</h1>
                    <p className="text-red-400 font-mono text-sm tracking-widest uppercase">{t('security.violation_detected')}</p>
                 </div>

                 <div className="w-full grid grid-cols-2 gap-8 py-8 border-y border-white/5">
                    <div className="text-left space-y-1">
                       <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{t('security.target_node')}</span>
                       <p className="text-xl font-bold text-white font-mono uppercase">{activeAlert.cctv_nodes.node_label}</p>
                    </div>
                    <div className="text-left space-y-1">
                       <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{t('security.violation_type')}</span>
                       <p className="text-xl font-bold text-critical-red font-mono uppercase">{activeAlert.alert_type.replace('_', ' ')}</p>
                    </div>
                 </div>

                 <div className="w-full space-y-6">
                    <div className="space-y-3">
                       <p className="text-[10px] text-gray-500 uppercase font-bold text-left">{t('security.manual_ack')}</p>
                       <input 
                        type="text"
                        placeholder={t('security.type_to_confirm', { node: activeAlert.cctv_nodes.node_label })}
                        value={ackInput}
                        onChange={(e) => setAckInput(e.target.value)}
                        className="w-full bg-onyx border border-red-500/20 p-4 text-center text-white font-mono outline-none focus:border-red-500 transition-all uppercase placeholder:text-gray-800 rounded-none"
                       />
                    </div>

                    <button 
                      onClick={handleAcknowledge}
                      disabled={ackInput.toLowerCase() !== activeAlert.cctv_nodes.node_label.toLowerCase() || isSyncing}
                      className="w-full py-5 bg-critical-red hover:bg-red-400 disabled:opacity-20 disabled:grayscale text-white font-bold uppercase tracking-[0.3em] text-sm transition-all flex items-center justify-center space-x-3 rounded-none"
                    >
                       <span>{isSyncing ? t('security.posting_audit') : t('security.ack_violation')}</span>
                       <ShieldCheck size={18} />
                    </button>
                 </div>

                 <div className="flex items-center space-x-4 text-[10px] text-gray-600 uppercase font-mono pt-4">
                    <span>{t('security.alert_id')}: {activeAlert.id.slice(0,12)}</span>
                    <span>•</span>
                    <span>{t('security.triggered')}: {new Date(activeAlert.triggered_at).toLocaleTimeString()}</span>
                 </div>
              </div>
           </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

