'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useTierStore } from '@/stores/tierStore';
import { AddCameraWizard } from '@/components/cctv/AddCameraWizard';
import { CameraGrid } from '@/components/cctv/CameraGrid';
import { CameraEventFeed } from '@/components/cctv/CameraEventFeed';
import { Video, Plus, Info, RefreshCw, Lock, ArrowRight, ShieldCheck, Camera, Eye } from 'lucide-react';
import { useLicense } from '@/hooks/useLicense';
import Link from 'next/link';

export default function CCTVPage() {
  const supabase = createClient();
  const { profile } = useBusinessProfile();
  const { limits, tier } = useTierStore();
  const { effectiveTier, isTrial } = useLicense();
  const queryClient = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');

  // Camera slot limit from the tier limits (fallback is 2 for Lite, 4 for Pro, 6 for Elite)
  const maxCameras = limits?.maxCameras || (tier === 'elite' ? 6 : tier === 'pro' ? 4 : 2);

  // Fetch active cameras
  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ['cctv-cameras', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('cctv_cameras')
        .select('*')
        .eq('business_id', profile!.id)
        .eq('is_active', true)
        .order('slot_number');
      return data || [];
    },
    enabled: !!profile?.id,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  // Fetch unacknowledged events
  const { data: recentEvents = [] } = useQuery({
    queryKey: ['cctv-events', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('cctv_events')
        .select(`
          *,
          camera:cctv_cameras(name)
        `)
        .eq('business_id', profile!.id)
        .eq('acknowledged', false)
        .order('occurred_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!profile?.id,
    refetchInterval: 10000,
  });

  // Start WebRTC proxy streams when cameras list changes or on mount
  useEffect(() => {
    if (!cameras.length) return;
    const win = window as any;
    if (!win.cctv) return;

    // Build camera stream payloads with RTSP urls and credentials
    const activeStreams = cameras
      .filter((c: any) => c.rtsp_url_main)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        rtspUrl: c.rtsp_url_main,
      }));

    win.cctv.startStreams(activeStreams)
      .catch((e: any) => console.error('Failed to initialize WebRTC streams:', e));

    return () => {
      if (win.cctv) {
        win.cctv.stopStreams().catch(() => {});
      }
    };
  }, [cameras]);

  const onlineCount = cameras.filter((c: any) => c.status === 'online').length;

  // TRIGGER 5 — Warm CCTV Preview on Free tier (instead of cold UpgradeGate)
  if (effectiveTier === 'free' && !isTrial) {
    return (
      <div className="min-h-screen bg-[#07080A] text-slate-300 p-6 sm:p-10 font-inter flex items-center justify-center">
        <div className="max-w-4xl w-full space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-[#60A5FA] text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
              <Video size={13} />
              <span>CCTV Feeds — Lite+ Feature</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Real-Time Workshop & Factory Video Surveillance
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Connect your existing RTSP cameras. No extra hardware needed. Works with any Hikvision, Dahua, or generic IP camera.
            </p>
          </div>

          {/* Screenshot / Demo of what CCTV looks like */}
          <div className="bg-[#0D0F14] border border-white/10 rounded-lg p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Live Feeds Simulation (4 Channels)</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">1080p @ 30 FPS · RTSP/H.264</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'CAM-01 · Production Floor (Karigar Units)', status: 'ACTIVE STREAM', detections: '3 Workers Detected' },
                { name: 'CAM-02 · Main Gate & Loading Bay', status: 'ACTIVE STREAM', detections: 'Motion Event Logged' },
                { name: 'CAM-03 · Inventory Warehouse & Safe', status: 'ACTIVE STREAM', detections: 'No Motion' },
                { name: 'CAM-04 · POS Cash Counter & Till', status: 'ACTIVE STREAM', detections: 'Cashier Active' },
              ].map((cam, idx) => (
                <div key={idx} className="relative aspect-video bg-black/80 border border-white/10 rounded-sm overflow-hidden flex flex-col justify-between p-3 group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded border border-white/10">
                      {cam.name}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      ● REC
                    </span>
                  </div>

                  {/* Simulated AI detection bounding box */}
                  <div className="border border-cyan-400/40 bg-cyan-400/5 rounded-sm p-2 w-32 mx-auto text-center pointer-events-none">
                    <p className="text-[9px] font-mono text-cyan-300 font-bold">{cam.detections}</p>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 relative z-10">
                    <span>{cam.status}</span>
                    <span>192.168.1.{100 + idx}:554</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="text-center space-y-4">
            <Link
              href="/settings/license?upgrade=true"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#60A5FA] hover:bg-blue-400 text-black font-black uppercase tracking-wider text-xs rounded-sm transition-all shadow-[0_4px_25px_rgba(96,165,250,0.3)]"
            >
              <span>See Lite plan — PKR 25,000/year</span>
              <ArrowRight size={14} />
            </Link>
            <p className="text-[11px] text-zinc-500 font-mono">
              Unlocks camera streams, unlimited items, WhatsApp automation, and report exports.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#07080A]">
      {/* Main video area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sub-header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Video size={18} className="text-[#60A5FA]" />
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Security Cameras</h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                {cameras.length} of {maxCameras} configured · {onlineCount} online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            {cameras.length > 1 && (
              <div className="flex border border-white/10 rounded-sm overflow-hidden bg-black/40">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('single')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    viewMode === 'single' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  Single
                </button>
              </div>
            )}

            {cameras.length < maxCameras ? (
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#60A5FA] text-black text-xs font-bold hover:bg-blue-400 transition-colors rounded-sm"
              >
                <Plus size={14} />
                Add Camera
              </button>
            ) : (
              <div className="text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-sm">
                Slots full ({tier})
              </div>
            )}
          </div>
        </div>

        {/* Live notification alerts ticker */}
        {recentEvents.length > 0 && (
          <div className="px-6 py-2 border-b border-white/6 flex-shrink-0 bg-black/20">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
              {recentEvents.slice(0, 5).map((event: any) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0 border ${
                    event.severity === 'critical'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}
                >
                  <span>
                    {event.event_type === 'human_detected'
                      ? '👤'
                      : event.event_type === 'motion'
                      ? '〰'
                      : '⚠'}
                  </span>
                  <span>
                    {event.camera?.name || 'Camera'}: {event.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-gray-600 font-mono">
                    {new Date(event.occurred_at).toLocaleTimeString('en-PK', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Camera content area */}
        <div className="flex-1 overflow-hidden bg-black/10">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-gray-700 animate-spin" />
            </div>
          ) : cameras.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center mx-auto mb-6">
                  <Video size={28} className="text-[#60A5FA]" />
                </div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                  Auto-Discover Cameras
                </h2>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  Noxis automatically discovers Hikvision and Imou cameras on your WiFi network with zero configuration required.
                </p>

                {/* Features list */}
                <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                  {[
                    ['🔍', 'Discovery', 'No manual IP entry'],
                    ['🧠', 'Local AI', 'Human alert triggers'],
                    ['⚡', 'Smart Rec', 'Event-only clips'],
                    ['🔒', 'Secured', 'Encrypted local key'],
                  ].map(([icon, title, desc]) => (
                    <div key={title} className="p-3 bg-[#0F1114]/80 border border-white/[0.04] rounded-sm">
                      <span className="text-lg">{icon}</span>
                      <p className="text-[10px] font-bold text-white mt-1 uppercase tracking-wide">{title}</p>
                      <p className="text-[9px] text-gray-600 mt-0.5 leading-normal">{desc}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowWizard(true)}
                  className="w-full py-3 bg-[#60A5FA] text-black font-bold text-xs uppercase tracking-wider hover:bg-blue-400 transition-colors rounded-sm"
                >
                  Configure first camera
                </button>
              </div>
            </div>
          ) : (
            <CameraGrid
              cameras={cameras}
              viewMode={viewMode}
              selectedCamera={selectedCamera}
              onSelectCamera={setSelectedCamera}
              maxCameras={maxCameras}
              onAddCamera={() => setShowWizard(true)}
            />
          )}
        </div>
      </div>

      {/* Events feed sidebar */}
      {cameras.length > 0 && profile?.id && (
        <CameraEventFeed businessId={profile.id} />
      )}

      {/* Onboarding Wizard */}
      {showWizard && profile?.id && (
        <AddCameraWizard
          businessId={profile.id}
          nextSlot={cameras.length + 1}
          onClose={() => setShowWizard(false)}
          onAdded={() => {
            setShowWizard(false);
            queryClient.invalidateQueries({ queryKey: ['cctv-cameras', profile.id] });
          }}
        />
      )}
    </div>
  );
}
