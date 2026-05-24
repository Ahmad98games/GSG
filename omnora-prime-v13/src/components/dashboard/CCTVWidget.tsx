"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, ShieldAlert, Plus, Shield, Wifi, WifiOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePersona } from '@/hooks/usePersona';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CCTVWidget() {
  const { businessId } = usePersona();
  const supabase = createClient();
  const [cameras, setCameras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streamError, setStreamError] = useState<Record<string, boolean>>({});
  const [detectionAlert, setDetectionAlert] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);

  useEffect(() => {
    if (!businessId) return;

    // 1. Initial Fetch
    const fetchCameras = async () => {
      const { data, error } = await supabase
        .from('cctv_nodes')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'online')
        .limit(2);
      
      if (!error) setCameras(data || []);
      setIsLoading(false);
    };

    const fetchDetections = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('ai_detection_events')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('created_at', today);
      
      setDetectionCount(count || 0);
    };

    fetchCameras();
    fetchDetections();

    // 2. Realtime Subscription
    const channel = supabase
      .channel('cctv-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ai_detection_events', filter: `business_id=eq.${businessId}` },
        (payload: any) => {
          setIsFlashing(true);
          setDetectionAlert(`Motion detected on ${payload.new.camera_name || 'Camera'}`);
          setDetectionCount(prev => prev + 1);
          setTimeout(() => setIsFlashing(false), 300);
          setTimeout(() => setDetectionAlert(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, supabase]);

  if (isLoading) return <div className="col-span-2 h-64 bg-white/[0.02] animate-pulse rounded-sm border border-white/5" />;

  if (cameras.length === 0) {
    return (
      <div className="col-span-2 flex items-center justify-between p-3 bg-[#0F1114] border border-white/[0.05] rounded-sm mt-4">
        <div className="flex items-center gap-3">
          <div className="text-gray-600 text-sm">📹</div>
          <div>
            <p className="text-xs text-gray-500">No cameras configured</p>
          </div>
        </div>
        <a href="/cctv" className="text-xs text-[#60A5FA] hover:text-blue-300 transition-colors">
          Add camera →
        </a>
      </div>
    );
  }

  return (
    <div className={cn(
      "col-span-2 relative glass-panel border overflow-hidden transition-all duration-300",
      isFlashing ? "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]" : "border-white/5"
    )}>
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Video size={18} className="text-electric-blue" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Live Security</h3>
        </div>
        {detectionCount > 0 && (
          <div className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20">
            {detectionCount} Detections Today
          </div>
        )}
      </div>

      <div className="p-4 flex h-48 space-x-4">
        {cameras.length > 0 ? (
          cameras.map((camera) => (
            <div key={camera.id} className="flex-1 relative bg-black group overflow-hidden border border-white/5">
              {!streamError[camera.id] ? (
                <img
                  src={`http://localhost:5001/stream/${camera.id}`}
                  alt={camera.node_name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  onError={() => setStreamError(prev => ({ ...prev, [camera.id]: true }))}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-[#0A0A0A]">
                  <WifiOff size={24} strokeWidth={1.5} />
                  <span className="text-[9px] uppercase font-bold mt-2">Feed Offline</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-[9px] font-black uppercase tracking-widest text-white truncate">{camera.node_name}</p>
              </div>
              <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded-sm border border-white/10 text-[8px] font-mono text-emerald-500 uppercase">
                Live
              </div>
            </div>
          ))
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-4 border border-dashed border-white/10">
            <Shield size={32} className="text-gray-700" strokeWidth={1} />
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">No cameras configured</p>
              <Link href="/cctv/cameras/new" className="mt-3 inline-flex items-center space-x-2 bg-electric-blue text-onyx px-4 py-1.5 text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                <Plus size={12} />
                <span>Add Camera</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Alert Overlay */}
      <AnimatePresence>
        {detectionAlert && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-red-600 text-white px-4 py-2 flex items-center space-x-3 rounded-sm shadow-2xl z-20"
          >
            <ShieldAlert size={14} className="animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-widest flex-1">{detectionAlert}</span>
            <button onClick={() => setDetectionAlert(null)} className="opacity-50 hover:opacity-100"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
