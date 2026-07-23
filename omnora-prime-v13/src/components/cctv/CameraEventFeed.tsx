'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Bell, BellOff, Check, CheckCircle2, ShieldAlert,
  Clock, Trash2, Eye, EyeOff, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EventFeedProps {
  businessId: string;
}

export function CameraEventFeed({ businessId }: EventFeedProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['cctv-events-feed', businessId],
    queryFn: async () => {
      const { data } = await supabase
        .from('cctv_events')
        .select(`
          *,
          camera:cctv_cameras(name, model)
        `)
        .eq('business_id', businessId)
        .order('occurred_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!businessId,
    refetchInterval: 5000, // Poll every 5s for live alerts
  });

  // Acknowledge mutation
  const ackMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await supabase
        .from('cctv_events')
        .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq('id', eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cctv-events-feed', businessId] });
      queryClient.invalidateQueries({ queryKey: ['cctv-events', businessId] });
    }
  });

  // Acknowledge all mutation
  const ackAllMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from('cctv_events')
        .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq('business_id', businessId)
        .eq('acknowledged', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cctv-events-feed', businessId] });
      queryClient.invalidateQueries({ queryKey: ['cctv-events', businessId] });
    }
  });

  const filteredEvents = events.filter((e: any) => {
    if (filterSeverity === 'all') return true;
    return e.severity === filterSeverity;
  });

  const unreadCount = events.filter((e: any) => !e.acknowledged).length;

  return (
    <div className="w-80 border-l border-white/8 bg-[#07080A] flex flex-col h-full flex-shrink-0 select-none">
      {/* Header */}
      <div className="p-4 border-b border-white/8 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={16} className={unreadCount > 0 ? "text-[#60A5FA] animate-bounce" : "text-gray-400"} />
          <h2 className="text-xs font-bold uppercase tracking-widest text-white">Event Log</h2>
          {unreadCount > 0 && (
            <span className="bg-blue-500/10 text-[#60A5FA] text-[10px] font-bold px-1.5 py-0.5 rounded">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => ackAllMutation.mutate()}
            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors"
          >
            <Check size={10} /> Clear All
          </button>
        )}
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex border-b border-white/6 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
        {(['all', 'critical', 'warning', 'info'] as const).map(sev => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`flex-1 py-2 text-center border-b transition-colors ${
              filterSeverity === sev
                ? 'border-[#60A5FA] text-[#60A5FA] bg-[#60A5FA]/5'
                : 'border-transparent text-gray-600 hover:text-gray-400'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-2.5 pt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/[0.02] border border-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <BellOff size={24} className="text-gray-800 mb-2" />
            <p className="text-xs text-gray-600 font-semibold">No events logged</p>
            <p className="text-[10px] text-gray-700 mt-0.5">Alerts will appear here in real-time</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredEvents.map((event: any) => {
              const isCrit = event.severity === 'critical';
              const isWarn = event.severity === 'warning';
              const isAck = event.acknowledged;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`p-3 border rounded-sm relative group transition-all bg-[#0C0E12]/80 hover:bg-[#0E1116] ${
                    isAck
                      ? 'border-white/5 opacity-50'
                      : isCrit
                      ? 'border-red-500/20 bg-red-950/5'
                      : isWarn
                      ? 'border-amber-500/20 bg-amber-950/5'
                      : 'border-white/8'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Severity Icon */}
                    <div className="mt-0.5">
                      {event.event_type === 'human_detected' ? (
                        <span className="text-base select-none">👤</span>
                      ) : event.event_type === 'vehicle' ? (
                        <span className="text-base select-none">🚗</span>
                      ) : event.event_type === 'motion' ? (
                        <span className="text-base select-none">〰</span>
                      ) : isCrit ? (
                        <ShieldAlert size={14} className="text-red-500" />
                      ) : (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[11px] font-bold truncate ${
                          isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-white'
                        }`}>
                          {event.camera?.name || 'Camera'}
                        </p>
                        <span className="text-[8px] font-semibold text-gray-600 flex items-center gap-1 whitespace-nowrap">
                          <Clock size={8} />
                          {new Date(event.occurred_at).toLocaleTimeString('en-PK', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 capitalize font-medium">
                        {event.event_type.replace(/_/g, ' ')}
                      </p>

                      {/* Details / metadata */}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="mt-1.5 p-1 bg-black/40 rounded border border-white/[0.04] text-[9px] font-mono text-gray-600">
                          {JSON.stringify(event.metadata)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions overlay */}
                  {!isAck && (
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#0E1116] pl-1.5 py-0.5 rounded">
                      <button
                        onClick={() => ackMutation.mutate(event.id)}
                        title="Mark read"
                        className="text-gray-500 hover:text-emerald-400 p-0.5 transition-colors"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
