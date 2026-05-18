"use client";

import React, { useState } from 'react';
import Link from "next/link";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, Plus, Save, Trash2, 
  Settings2, Activity, Info, Lock 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { usePersona } from '@/hooks/usePersona';
import { FeatureGate } from '../ui/FeatureGate';
import { useTierStore } from '@/stores/tierStore';

interface CameraSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: any[];
  tierLimit: number;
  onUpdate: () => void;
}

const supabase = createClient();

const CAMERA_TYPES = [
  { value: 'dome', label: 'Dome Camera' },
  { value: 'bullet', label: 'Bullet Camera' },
  { value: 'ptz', label: 'PTZ (Pan-Tilt-Zoom)' },
  { value: 'fisheye', label: 'Fisheye / 360°' },
  { value: 'box', label: 'Box Camera' },
  { value: 'covert', label: 'Covert / Hidden' },
];

const CAMERA_BRANDS = [
  'Hikvision', 'Dahua', 'Uniview',
  'CP Plus', 'Bosch', 'Axis',
  'Hanwha', 'Reolink', 'TP-Link',
  'Xiaomi / Mi', 'Generic / Other'
];

export default function CameraSettings({ isOpen, onClose, cameras, tierLimit, onUpdate }: CameraSettingsProps) {
  const { businessId } = usePersona();
  const toast = useToast();
  const { canAddCamera } = useTierStore();
  const [isAdding, setIsAdding] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  const [newCamera, setNewCamera] = useState({
    node_label: '',
    ip_address: '',
    rtsp_port: '554',
    username: 'admin',
    password: '',
    camera_type: 'dome',
    brand: 'Hikvision',
    model: '',
    resolution: '1080p',
    infrared: true,
    ir_range_m: 30,
    ai_detection_enabled: true,
    location_desc: '',
    recording_enabled: true,
    preroll_seconds: 10,
    retention_days: 30
  });

  const rtspUrl = `rtsp://${newCamera.username}:${newCamera.password}@${newCamera.ip_address}:${newCamera.rtsp_port}/stream1`;

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const res = await fetch('http://localhost:5001/test-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rtsp_url: rtspUrl })
      });
      
      if (res.ok) setTestStatus('success');
      else setTestStatus('error');
    } catch (e) {
      toast.error("Test requires Hub to be running", "Ensure Python sidecar is active.");
      setTestStatus('error');
    }
  };

  const handleAdd = async () => {
    if (cameras.length >= tierLimit) {
      toast.error("Tier limit reached", "Upgrade to add more cameras.");
      return;
    }

    const { error } = await supabase.from('cctv_nodes').insert({
      business_id: businessId,
      node_label: newCamera.node_label,
      rtsp_url: rtspUrl,
      ip_address: newCamera.ip_address,
      camera_type: newCamera.camera_type,
      brand: newCamera.brand,
      model: newCamera.model,
      resolution: newCamera.resolution,
      infrared: newCamera.infrared,
      ir_range_m: newCamera.ir_range_m,
      ai_detection_enabled: newCamera.ai_detection_enabled,
      location_desc: newCamera.location_desc,
      recording_enabled: newCamera.recording_enabled,
      status: 'connecting',
      is_active: true
    });

    if (error) toast.error("Registration failed", error.message);
    else {
      toast.success(`Camera ${newCamera.node_label} registered ✓`, "Connecting to stream...");
      setIsAdding(false);
      onUpdate();
    }
  };

  const toggleRecording = async (cameraId: string, current: boolean) => {
    const { error } = await supabase
      .from('cctv_nodes')
      .update({ recording_enabled: !current })
      .eq('id', cameraId);

    if (error) toast.error("Toggle failed", error.message);
    else onUpdate();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-[450px] bg-[#0D0F11] border-l border-white/5 z-[101] flex flex-col shadow-2xl"
          >
            <header className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings2 size={18} className="text-gray-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Grid Config</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* SECTION 1: ACTIVE NODES */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center space-x-2">
                  <Activity size={12} />
                  <span>Active Sentinel Nodes</span>
                </h3>
                
                <div className="space-y-3">
                  {cameras.map((camera) => (
                    <div key={camera.id} className="p-4 bg-white/5 border border-white/5 rounded flex items-center justify-between group">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white uppercase">{camera.node_label}</span>
                        <span className="text-[9px] text-gray-500 font-mono mt-1 truncate max-w-[200px]">{camera.rtsp_url}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-end">
                           <label className="text-[8px] font-black uppercase text-gray-600 mb-1">Recording</label>
                           <button 
                            onClick={() => toggleRecording(camera.id, camera.recording_enabled)}
                            className={cn(
                              "w-8 h-4 rounded-full relative transition-colors",
                              camera.recording_enabled ? "bg-red-500" : "bg-gray-700"
                            )}
                           >
                             <div className={cn(
                               "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                               camera.recording_enabled ? "right-0.5" : "left-0.5"
                             )} />
                           </button>
                        </div>
                        <button className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 2: ADD CAMERA */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Add Camera</h3>
                  {cameras.length >= tierLimit && (
                    <span className="text-[9px] text-amber-500 font-bold uppercase flex items-center space-x-1">
                      <Lock size={10} />
                      <span>Tier Max</span>
                    </span>
                  )}
                </div>

                {isAdding ? (
                  <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded">
                    {/* CAMERA DETAILS */}
                    <div className="space-y-4">
                      <h4 className="text-[9px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Camera Details</h4>
                      
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-gray-500">Camera Name</label>
                        <input 
                          value={newCamera.node_label}
                          onChange={e => setNewCamera(prev => ({ ...prev, node_label: e.target.value }))}
                          placeholder="e.g. LOADING BAY 1"
                          className="w-full bg-black border border-white/10 p-2 text-xs text-white uppercase outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-500">Camera Type</label>
                          <select 
                            value={newCamera.camera_type}
                            onChange={e => setNewCamera(prev => ({ ...prev, camera_type: e.target.value }))}
                            className="w-full bg-black border border-white/10 p-2 text-xs text-white outline-none"
                          >
                            {CAMERA_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-500">Brand</label>
                          <select 
                            value={newCamera.brand}
                            onChange={e => setNewCamera(prev => ({ ...prev, brand: e.target.value }))}
                            className="w-full bg-black border border-white/10 p-2 text-xs text-white outline-none"
                          >
                            {CAMERA_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-500">Night Vision Range (meters)</label>
                          <input 
                            type="number"
                            value={newCamera.ir_range_m}
                            onChange={e => setNewCamera(prev => ({ ...prev, ir_range_m: Number(e.target.value) }))}
                            className="w-full bg-black border border-white/10 p-2 text-xs text-white outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-500">Location</label>
                          <input 
                            value={newCamera.location_desc}
                            onChange={e => setNewCamera(prev => ({ ...prev, location_desc: e.target.value }))}
                            placeholder="e.g. Front Gate"
                            className="w-full bg-black border border-white/10 p-2 text-xs text-white outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* CONNECTION SETTINGS */}
                    <div className="space-y-4">
                      <h4 className="text-[9px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Connection Settings</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-500">IP Address</label>
                          <input 
                            value={newCamera.ip_address}
                            onChange={e => setNewCamera(prev => ({ ...prev, ip_address: e.target.value }))}
                            placeholder="192.168.1.64"
                            className="w-full bg-black border border-white/10 p-2 text-xs text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-500">Camera Port</label>
                          <input 
                            value={newCamera.rtsp_port}
                            onChange={e => setNewCamera(prev => ({ ...prev, rtsp_port: e.target.value }))}
                            placeholder="554"
                            className="w-full bg-black border border-white/10 p-2 text-xs text-white outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-500">Username</label>
                          <input 
                            value={newCamera.username}
                            onChange={e => setNewCamera(prev => ({ ...prev, username: e.target.value }))}
                            className="w-full bg-black border border-white/10 p-2 text-xs text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-500">Password</label>
                          <input 
                            type="password"
                            value={newCamera.password}
                            onChange={e => setNewCamera(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full bg-black border border-white/10 p-2 text-xs text-white outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-black border border-white/5 space-y-2">
                        <label className="text-[8px] font-black uppercase text-gray-600">RTSP URL (auto-built):</label>
                        <div className="flex items-center space-x-2">
                          <code className="text-[10px] text-blue-400 font-mono flex-1 break-all">
                            rtsp://{newCamera.username}:****@{newCamera.ip_address}:{newCamera.rtsp_port}/stream1
                          </code>
                          <button 
                            onClick={() => navigator.clipboard.writeText(rtspUrl)}
                            className="text-[8px] font-black uppercase text-gray-500 hover:text-white"
                          >
                            [Copy]
                          </button>
                        </div>
                        <p className="text-[8px] text-gray-700 italic">
                          Common paths: Hikvision: /Streaming/Channels/101 | Dahua: /cam/realmonitor?channel=1&subtype=0 | Generic: /stream1
                        </p>
                      </div>

                      <button 
                        onClick={handleTestConnection}
                        disabled={testStatus === 'testing'}
                        className={cn(
                          "w-full py-2 text-[9px] font-black uppercase tracking-widest border transition-all",
                          testStatus === 'success' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" :
                          testStatus === 'error' ? "bg-red-500/10 border-red-500 text-red-500" :
                          "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                        )}
                      >
                        {testStatus === 'testing' ? 'Connecting...' : 
                         testStatus === 'success' ? 'Stream accessible ✓' :
                         testStatus === 'error' ? 'Cannot reach camera — check IP and password' :
                         'Test Connection'}
                      </button>
                    </div>

                    {/* AI DETECTION */}
                    <FeatureGate feature="aiCctvDetection">
                      <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/10 rounded">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">AI Detection</span>
                          <p className="text-[8px] text-gray-500 leading-tight">Enable neural detection for people, vehicles, and fire hazards.</p>
                        </div>
                        <button 
                          onClick={() => setNewCamera(prev => ({ ...prev, ai_detection_enabled: !prev.ai_detection_enabled }))}
                          className={cn(
                            "w-8 h-4 rounded-full relative transition-colors",
                            newCamera.ai_detection_enabled ? "bg-blue-500" : "bg-gray-700"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                            newCamera.ai_detection_enabled ? "right-0.5" : "left-0.5"
                          )} />
                        </button>
                      </div>
                    </FeatureGate>

                    <FeatureGate feature="fireDetection">
                      <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">Fire Detection</span>
                          <p className="text-[8px] text-gray-500 leading-tight">Specialized neural network for early fire and smoke detection.</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] font-bold text-red-500 uppercase">Elite Only</span>
                        </div>
                      </div>
                    </FeatureGate>

                    <div className="flex space-x-2 pt-2">
                      <button 
                        onClick={handleAdd}
                        className="flex-1 bg-blue-500 text-white text-[10px] font-black uppercase py-3 hover:bg-blue-600 transition-all flex items-center justify-center space-x-2"
                      >
                        <Plus size={14} />
                        <span>Save Camera</span>
                      </button>
                      <button 
                        onClick={() => setIsAdding(false)}
                        className="px-4 bg-white/5 text-gray-500 text-[10px] font-black uppercase py-3 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button 
                      onClick={() => {
                        if (!canAddCamera(cameras.length)) {
                          toast.error(
                            "Tier limit reached", 
                            `Upgrade to Pro to add more than ${tierLimit} cameras.`
                          );
                          return;
                        }
                        setIsAdding(true);
                      }}
                      className="w-full border border-dashed border-white/10 p-6 flex flex-col items-center justify-center space-y-2 group hover:border-blue-500/50 hover:bg-blue-500/5 transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-white/10"
                    >
                      <Plus size={24} className="text-gray-600 group-hover:text-blue-500" />
                      <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-white">Add Camera</span>
                    </button>
                    
                    <Link href="/docs#troubleshoot" className="block text-center text-[9px] font-black uppercase text-blue-500/50 hover:text-blue-500 transition-colors">
                      Need help connecting? See setup guide →
                    </Link>
                  </div>
                )}
              </section>

              {/* TIER INFO */}
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded space-y-2">
                <div className="flex items-center space-x-2 text-blue-500">
                  <Info size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Network Topology</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold">
                  Sentinel Nodes require an RTSP-to-MJPEG proxy for browser rendering. 
                  Vision Engine (Python) manages detection logic locally.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
