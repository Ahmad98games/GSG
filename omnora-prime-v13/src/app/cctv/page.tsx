"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { usePersona } from "@/hooks/usePersona";
import { 
  Camera, 
  Maximize2, 
  Activity, 
  ShieldAlert, 
  History, 
  Settings,
  User,
  Flame,
  Truck,
  AlertTriangle,
  Lock,
  Plus,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import * as Tooltip from "@radix-ui/react-tooltip";
import CameraSettings from "@/components/cctv/CameraSettings";
import PlaybackViewer from "@/components/cctv/PlaybackViewer";

import { useSidebarState } from "@/hooks/useSidebarState";
import Link from "next/link";
import { ChevronLeft, Lock as LockIcon } from "lucide-react";
import { useTierStore } from "@/stores/tierStore";

interface CCTVNode {
  id: string;
  node_label: string;
  is_active: boolean;
  status: 'online' | 'offline' | 'connecting';
  location_desc?: string;
  recording_enabled: boolean;
  preroll_seconds: number;
}

interface DetectionEvent {
  id: string;
  node_id: string;
  detected_class: 'person' | 'fire' | 'vehicle' | string;
  confidence: number;
  created_at: string;
  zone_id?: string;
  bbox_x?: number;
  bbox_y?: number;
  bbox_w?: number;
  bbox_h?: number;
  jpeg_frame?: string;
  acknowledged: boolean;
}

const supabase = createClient();

export default function CCTVPage() {
  const { businessId, t } = usePersona();
  const [cameras, setCameras] = useState<CCTVNode[]>([]);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const { tier, limits } = useTierStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlaybackOpen, setIsPlaybackOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'person' | 'fire' | 'vehicle' | 'unacknowledged'>('all');
  const [now, setNow] = useState<number>(0);

  

  useEffect(() => {
    setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchCCTVData = useCallback(async () => {
    if (!businessId) return;

    // 2. Fetch Cameras
    const { data: cameraData } = await supabase
      .from('cctv_nodes')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true);
    setCameras(cameraData || []);

    // 3. Fetch Recent Events (Last 24h)
    const { data: eventData } = await supabase
      .from('ai_detection_events')
      .select('*')
      .eq('business_id', businessId)
      .gte('created_at', new Date(Date.now() - 86400000).toISOString())
      .order('created_at', { ascending: false });
    setEvents(eventData || []);
  }, [businessId, supabase]);

  useEffect(() => {
    setTimeout(() => fetchCCTVData(), 0);

    const channel = supabase
      .channel('cctv_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_detection_events', filter: `business_id=eq.${businessId}` }, (payload: any) => {
        const newEvent = payload.new as DetectionEvent;
        setEvents(prev => [newEvent, ...prev]);
        if (newEvent.detected_class === 'fire') {
          const audio = new Audio('/alerts/fire_alarm.mp3');
          audio.play().catch(() => {});
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ai_detection_events', filter: `business_id=eq.${businessId}` }, (payload: any) => {
        setEvents(prev => prev.map(e => e.id === payload.new.id ? { ...e, ...payload.new } : e));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [businessId]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    if (filter === 'unacknowledged') return events.filter(e => !e.acknowledged);
    return events.filter(e => e.detected_class === filter);
  }, [events, filter]);

  const gridClass = useMemo(() => {
    const count = cameras.length;
    if (count <= 1) return "grid-cols-1";
    if (count <= 4) return "grid-cols-2";
    if (count <= 8) return "grid-cols-3";
    return "grid-cols-4";
  }, [cameras.length]);

  return (
    <div className="flex h-full bg-[#0A0C0E] overflow-hidden font-inter text-slate-300">
      
      <Tooltip.Provider>
        {/* Left: Camera Grid */}
        <div className="flex-1 p-6 flex flex-col space-y-6 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="p-2 bg-white/5 rounded-sm hover:bg-white/10 transition-colors">
                <ChevronLeft size={20} />
              </Link>
              <div className="flex flex-col">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                  <h1 className="text-xl font-bold tracking-tighter uppercase text-white">Sentinel Mesh</h1>
                </div>
                <p className="text-[10px] text-gray-500 font-mono uppercase mt-1 tracking-widest">
                  Active Nodes: {cameras.length} / {limits.maxCameras >= 999 ? 'Unlimited' : limits.maxCameras} ({tier} Cap)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {cameras.length >= limits.maxCameras && (
                <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded text-amber-500 text-[10px] font-bold uppercase">
                  <LockIcon size={12} />
                  <span>Limit Reached</span>
                </div>
              )}
              
              <div className="flex bg-slate-900/50 p-1 rounded-sm border border-white/5">
                <button 
                  onClick={() => setIsPlaybackOpen(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-[10px] font-bold uppercase hover:text-white transition-colors border-r border-white/5"
                >
                  <History size={14} />
                  <span>Playback</span>
                </button>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-[10px] font-bold uppercase hover:text-white transition-colors"
                >
                  <Settings size={14} />
                  <span>Grid Config</span>
                </button>
              </div>
            </div>
          </div>

          <div className={cn("grid gap-4 flex-1 overflow-y-auto custom-scrollbar", gridClass)}>
            {cameras.map((camera) => (
              <CameraCell key={camera.id} camera={camera} events={events} now={now} />
            ))}
            {cameras.length === 0 && (
              <div className="col-span-full h-full flex items-center justify-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md w-full p-12 glass-panel border-white/5 text-center space-y-6 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                  
                  {/* Decorative Scanline */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
                    <div className="w-full h-[1px] bg-blue-500/50 animate-[scan_3s_linear_infinite]" />
                  </div>

                  <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-full mb-4 border border-white/10 group-hover:border-blue-500/30 transition-colors">
                    <ShieldAlert size={40} className="text-blue-500 animate-pulse" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white italic">Sentinel Offline</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] max-w-xs mx-auto">
                      Security mesh is currently inactive. No industrial monitoring nodes registered.
                    </p>
                  </div>

                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="relative w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white transition-all group overflow-hidden"
                  >
                    <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
                    <span>Initialize Monitoring Nodes</span>
                  </button>
                  
                  <div className="pt-4 flex justify-center space-x-6">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-gray-700 uppercase">Status</span>
                      <span className="text-[10px] font-mono text-gray-500">STANDBY</span>
                    </div>
                    <div className="w-[1px] h-6 bg-white/5" />
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-gray-700 uppercase">Encryption</span>
                      <span className="text-[10px] font-mono text-gray-500">AES-256</span>
                    </div>
                  </div>
                  
                  <Link href="/docs#troubleshoot" className="block pt-4 text-[9px] font-black uppercase text-blue-500/50 hover:text-blue-500 transition-colors">
                    Need help connecting? See setup guide →
                  </Link>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Detection Panel */}
        <div className="w-[400px] border-l border-white/5 bg-[#0D0F11] flex flex-col">
          <header className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert size={16} className="text-blue-500" />
              <h2 className="text-xs font-black uppercase tracking-widest text-white">Detection Events</h2>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold">
              {filteredEvents.length}
            </span>
          </header>

          <div className="flex p-4 space-x-2 border-b border-white/5">
            {['all', 'person', 'fire', 'unacknowledged'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-2.5 py-1 text-[9px] font-black uppercase tracking-tighter rounded border transition-all",
                  filter === f 
                    ? "bg-white/10 border-white/20 text-white" 
                    : "bg-transparent border-white/5 text-gray-500 hover:border-white/10"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                <DetectionCard key={event.id} event={event} />
              )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                  <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No detections in 24h ✓</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Tooltip.Provider>

      {/* Slide-overs & Modals */}
      <CameraSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        cameras={cameras} 
        tierLimit={limits.maxCameras}
        onUpdate={fetchCCTVData}
      />
      
      <PlaybackViewer 
        isOpen={isPlaybackOpen}
        onClose={() => setIsPlaybackOpen(false)}
      />

      <style jsx global>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(500%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}

function CameraCell({ camera, events, now }: { camera: CCTVNode; events: DetectionEvent[]; now: number }) {
  const activeEvent = events.find(e => 
    e.node_id === camera.id && 
    (now - new Date(e.created_at).getTime()) < 10000
  );

  return (
    <div className={cn(
      "relative aspect-video bg-black rounded border transition-all duration-500 group",
      activeEvent ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "border-white/5 hover:border-white/10"
    )}>
      {/* Header */}
      <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center px-3 justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{camera.node_label}</span>
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            camera.status === 'online' ? "bg-emerald-500" : 
            camera.status === 'connecting' ? "bg-amber-500 animate-pulse" : "bg-red-500"
          )} />
          <span className="text-[8px] font-black uppercase text-gray-400">{camera.status}</span>
        </div>
      </div>

      {/* Video Area */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
        {camera.status === 'online' ? (
          <img 
            src={`http://localhost:5001/stream/${camera.id}`} 
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <div className="flex flex-col items-center space-y-2 opacity-20">
            <Camera size={32} />
            <span className="text-[10px] font-black uppercase">Signal Lost</span>
          </div>
        )}
      </div>

      {/* AI Overlay */}
      {activeEvent && (
        <div className="absolute bottom-10 left-3 z-30">
          <div className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-sm uppercase flex items-center space-x-2 animate-pulse">
            <ShieldAlert size={10} />
            <span>{activeEvent.detected_class} Detected — {(activeEvent.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/80 to-transparent z-20 flex items-center px-3 justify-between">
        <div className="flex items-center space-x-3">
          {camera.recording_enabled && (
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black uppercase text-gray-400 italic">REC</span>
            </div>
          )}
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded">
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  );
}

function DetectionCard({ event }: { event: DetectionEvent }) {
  const isFire = event.detected_class === 'fire';
  const isPerson = event.detected_class === 'person';

  const acknowledge = async () => {
    await supabase.from('ai_detection_events').update({ acknowledged: true }).eq('id', event.id);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: event.acknowledged ? 0.4 : 1, y: 0 }}
      className={cn(
        "p-3 bg-white/5 border rounded-sm flex space-x-3 relative overflow-hidden group",
        isFire ? "border-red-500/50" : "border-white/5 hover:border-white/10"
      )}
    >
      <div className="w-16 h-16 bg-black flex-shrink-0 flex items-center justify-center border border-white/5 overflow-hidden">
        {event.jpeg_frame ? (
          <img src={event.jpeg_frame} className="w-full h-full object-cover" />
        ) : (
          <Camera size={20} className="opacity-20" />
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
            isFire ? "bg-red-500 text-white" : isPerson ? "bg-blue-500 text-white" : "bg-white/10 text-gray-400"
          )}>
            {event.detected_class}
          </span>
          <span className="text-[9px] text-gray-600 font-mono">
            {new Date(event.created_at).toLocaleTimeString([], { hour12: false })}
          </span>
        </div>

        <div className="text-xs font-bold text-white uppercase tracking-tighter">
          {event.zone_id ? `Breach: ${event.zone_id}` : 'Movement Detected'}
        </div>

        {!event.acknowledged && (
          <button 
            onClick={acknowledge}
            className="text-[8px] font-black uppercase text-gray-500 hover:text-white transition-colors"
          >
            Mark Acknowledged
          </button>
        )}
      </div>

      {isFire && <div className="absolute top-0 right-0 p-1 animate-pulse"><Flame size={12} className="text-red-500" /></div>}
    </motion.div>
  );
}
