"use client";
import { useEffect, useState } from 'react';
import React from 'react';
import Image from 'next/image';
// app/cctv/detections/page.tsx
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { 
  Activity, Calendar, Filter, Camera, 
  Search, Download, ExternalLink, ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";

export default function DetectionHistoryPage() {
  const { t, fmtDate } = usePersona();
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const toast = useToast();

  
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("all");

   useEffect(() => {
    async function fetchEvents() {
      let query = supabase
        .from('ai_detection_events')
        .select(`
          *,
          node:cctv_nodes(label, install_location)
        `)
        .eq('business_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (filterClass !== 'all') {
        query = query.eq('detected_class', filterClass);
      }

      const { data } = await query;
      setEvents(data || []);
      setIsLoading(false);
    }
    if (profile?.id) fetchEvents();
  }, [profile?.id, filterClass, supabase]);

  return (
    <div className="p-8 space-y-8">
       {/* Header */}
       <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase">AI Detection Timeline</h1>
          <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-1">Real-time Activity Feed</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-surface border border-white/10 text-xs font-bold uppercase tracking-widest px-4 py-2 focus:border-electric-blue outline-none"
          >
            <option value="all">All Classes</option>
            <option value="person">Person</option>
            <option value="vehicle">Vehicle</option>
            <option value="fire">Fire/Smoke</option>
            <option value="animal">Animal</option>
          </select>
          <button 
            onClick={() => toast.info("Export Timeline", "Timeline spreadsheet export is coming soon")}
            className="bg-white/5 border border-white/10 text-white p-2 hover:bg-white/10 transition-all"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-surface border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-onyx/50 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Security Node</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Detection</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Zone</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Confidence</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8 h-4 bg-white/5" />
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Activity size={48} className="mx-auto text-gray-700 mb-4 stroke-1" />
                    <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">No detection events recorded</p>
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-xs text-white font-mono">{fmtDate(event.created_at)}</div>
                      <div className="text-[10px] text-gray-600 font-mono mt-1">{new Date(event.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-white uppercase">{event.node?.label}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{event.node?.install_location}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                        event.detected_class === 'fire' ? 'bg-critical-red/20 text-critical-red border border-critical-red/30' :
                        event.detected_class === 'person' ? 'bg-electric-blue/20 text-electric-blue border border-electric-blue/30' :
                        'bg-onyx text-gray-400 border border-white/10'
                      }`}>
                        {event.detected_class}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-gray-300 uppercase tracking-tighter">
                        {event.zone_id || "Unrestricted Area"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-1 bg-white/5 w-16 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-electric-blue" 
                            style={{ width: `${event.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-gray-400">{(event.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-16 h-10 bg-onyx border border-white/10 flex items-center justify-center overflow-hidden relative cursor-pointer group-hover:border-electric-blue transition-colors">
                        {event.thumbnail_url ? (
                          <Image src={event.thumbnail_url} alt="Detection Snapshot" width={64} height={40} className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={14} className="text-gray-700" />
                        )}
                        <div className="absolute inset-0 bg-electric-blue/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <ExternalLink size={12} className="text-white" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

