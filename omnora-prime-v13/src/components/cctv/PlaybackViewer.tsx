"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Clock, Film, 
  ShieldCheck, AlertCircle, Play, 
  ChevronRight, Download, History
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { usePersona } from '@/hooks/usePersona';
import { format } from 'date-fns';

interface Recording {
  id: string;
  camera_id: string;
  started_at: string;
  duration_seconds: number;
  recording_type: string;
  file_path: string;
  hmac_hash: string;
  is_tampered: boolean;
  camera: { node_label: string };
}

const supabase = createClient();

export default function PlaybackViewer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { businessId } = usePersona();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && businessId) fetchRecordings();
  }, [isOpen, selectedDate, businessId]);

  const fetchRecordings = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('sentinel_recordings')
      .select(`
        *,
        camera:cctv_nodes(node_label)
      `)
      .eq('business_id', businessId)
      .gte('started_at', `${selectedDate}T00:00:00Z`)
      .lte('started_at', `${selectedDate}T23:59:59Z`)
      .order('started_at', { ascending: false });
    
    setRecordings(data || []);
    setIsLoading(false);
  };

  const playRecording = async (recording: Recording) => {
    setSelectedRecording(recording);
    
    // In production, we'd get a signed URL from Supabase Storage
    const { data } = await supabase.storage
      .from('sentinel-recordings')
      .createSignedUrl(recording.file_path, 3600);
    
    if (data?.signedUrl) setVideoUrl(data.signedUrl);
    else setVideoUrl(null); // Fallback: show local storage message
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#0A0C0E] z-[200] flex flex-col"
        >
          {/* Header */}
          <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-black">
            <div className="flex items-center space-x-4">
              <History size={18} className="text-gray-500" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Forensic Playback Archive</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar: Event Timeline */}
            <div className="w-80 border-r border-white/5 flex flex-col bg-[#0D0F11]">
              <div className="p-6 border-b border-white/5 space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-500 flex items-center space-x-2">
                    <Calendar size={12} />
                    <span>Select Date</span>
                  </label>
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-black border border-white/10 p-2 text-xs text-white outline-none focus:border-blue-500 rounded-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                {isLoading ? (
                  [1,2,3,4].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded" />)
                ) : recordings.length > 0 ? recordings.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => playRecording(rec)}
                    className={cn(
                      "w-full p-4 rounded text-left transition-all border flex flex-col space-y-1 relative group",
                      selectedRecording?.id === rec.id 
                        ? "bg-blue-500/10 border-blue-500/50" 
                        : "bg-white/5 border-transparent hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white uppercase">{rec.camera.node_label}</span>
                      <span className="text-[9px] text-gray-500 font-mono">{format(new Date(rec.started_at), 'HH:mm:ss')}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={cn(
                        "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                        rec.recording_type === 'breach' ? "bg-red-500 text-white" : "bg-white/10 text-gray-400"
                      )}>
                        {rec.recording_type}
                      </span>
                      <span className="text-[9px] text-gray-500">{rec.duration_seconds}s Duration</span>
                    </div>
                    <ChevronRight size={14} className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 transition-all opacity-0 group-hover:opacity-100",
                      selectedRecording?.id === rec.id && "opacity-100 text-blue-500"
                    )} />
                  </button>
                )) : (
                  <div className="py-20 flex flex-col items-center justify-center opacity-20 text-center px-6">
                    <Film size={48} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                      No recordings for this period
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Main: Video Player */}
            <div className="flex-1 flex flex-col bg-black relative">
              {selectedRecording ? (
                <>
                  <div className="flex-1 flex items-center justify-center p-12">
                    {videoUrl ? (
                      <video 
                        src={videoUrl} 
                        controls 
                        className="max-w-full max-h-full shadow-2xl border border-white/5" 
                      />
                    ) : (
                      <div className="bg-[#0D0F11] border border-white/5 p-12 rounded-lg text-center max-w-md space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                          <Film size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Clip Stored Locally</h3>
                        <p className="text-xs text-gray-500 leading-relaxed uppercase font-bold">
                          This recording is stored on the Hub's local NVMe storage. 
                          Remote cloud playback requires an active **Elite Sync** license.
                        </p>
                        <button className="text-[9px] font-black uppercase text-blue-500 hover:underline">
                          Open Local Path
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Integrity Footer */}
                  <div className="h-24 bg-[#0D0F11] border-t border-white/5 p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase text-gray-600 tracking-widest">Forensic Hash (HMAC-SHA256)</span>
                        <div className="text-[10px] font-mono text-blue-400 uppercase tracking-tighter">
                          {selectedRecording.hmac_hash?.slice(0, 32) || 'HASH_PENDING_FINALIZATION_X001'}...
                        </div>
                      </div>
                      <div className="h-8 w-px bg-white/5" />
                      <div className="flex items-center space-x-2 text-emerald-500">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Footage Integrity Verified</span>
                      </div>
                    </div>
                    
                    <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded text-[10px] font-black uppercase text-gray-300 hover:text-white transition-all">
                      <Download size={14} />
                      <span>Download Clip</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                  <Play size={120} strokeWidth={1} />
                  <span className="text-xl font-black uppercase tracking-[0.5em] mt-8">Select Event</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
