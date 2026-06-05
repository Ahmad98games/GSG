'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { 
  Users, Globe, Sparkles, Clock, Award, ShieldCheck, 
  Search, ArrowUpRight, Loader2, Landmark, PhoneCall, ExternalLink 
} from 'lucide-react';
import Link from 'next/link';

export default function WorkerNetworkPage() {
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  
  const [workers, setWorkers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!profile?.id) return;
    loadNetworkWorkers();
  }, [profile?.id]);
  
  const loadNetworkWorkers = async () => {
    try {
      // Query workers marked as open to work
      const { data: idents, error } = await supabase
        .from('worker_identities')
        .select('*, worker_skills(*)')
        .eq('open_to_work', true)
        .eq('is_public', true)
        .order('updated_at', { ascending: false });
        
      if (!error && idents) {
        setWorkers(idents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredWorkers = workers.filter((w: any) => 
    w.full_name.toLowerCase().includes(search.toLowerCase()) ||
    w.worker_skills?.some((s: any) => s.skill_name.toLowerCase().includes(search.toLowerCase()))
  );
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090B] text-gray-400 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-electric-blue animate-spin" />
        <span className="text-xs uppercase font-black tracking-[0.2em] text-gray-500">Connecting Labor Grid...</span>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0A0C0F] p-6 text-gray-200 md:p-8 font-sans select-none relative">
      <div className="absolute top-0 right-0 w-[500px] h-[250px] bg-electric-blue/5 rounded-full blur-[140px] pointer-events-none" />
      
      <main className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 px-3 py-1 rounded-full mb-3">
              <Users className="text-emerald-400" size={14} />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Phase 1 Labor Marketplace</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white italic">
              Verified Worker Network
            </h1>
            <p className="text-gray-500 text-xs mt-1 uppercase font-bold tracking-wider">
              Discover verified factory operators, stitching experts, and loom karigars currently open to work.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-[#0C0F12] border border-white/5 rounded-sm text-center">
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 block">Open to Work</span>
              <span className="text-xs font-black uppercase text-emerald-400">{workers.length} Available</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search workers by name or skill tags..."
            className="w-full bg-[#0C0F12] border border-white/5 pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-electric-blue/40 rounded-sm font-medium transition-colors"
          />
        </div>

        {/* Network Grid */}
        {filteredWorkers.length === 0 ? (
          <div className="py-16 border border-dashed border-white/5 rounded-sm text-center flex flex-col items-center justify-center space-y-3">
            <Users className="w-10 h-10 text-gray-700 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">No active seeking-employment records found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredWorkers.map((w: any) => {
              const initials = w.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
              
              return (
                <div key={w.id} className="bg-[#0C0F12] border border-white/5 p-5 rounded-sm flex flex-col justify-between hover:border-white/10 transition-colors space-y-4 relative group">
                  <div className="absolute top-0 left-0 w-1/4 h-[1px] bg-electric-blue" />
                  
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 border border-white/5 font-mono text-xs font-bold text-gray-400">
                          {initials}
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase text-white tracking-tight">{w.full_name}</h4>
                          <span className="text-[8px] font-mono text-gray-600">Updated: {new Date(w.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <Link 
                        href={`/karigars/shared/${w.id}`}
                        target="_blank"
                        className="text-[10px] font-black uppercase tracking-widest text-electric-blue hover:text-cyan-300 transition-colors flex items-center gap-0.5"
                        title="View Public Profile"
                      >
                        <span>Card</span>
                        <ExternalLink size={10} />
                      </Link>
                    </div>

                    {/* Skill chips */}
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">Verified Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {(!w.worker_skills || w.worker_skills.length === 0) ? (
                          <span className="text-[9px] text-gray-600 italic">No skill tags registered</span>
                        ) : (
                          w.worker_skills.map((s: any) => (
                            <span key={s.id} className="text-[9px] font-bold uppercase tracking-wide bg-electric-blue/5 border border-electric-blue/10 text-electric-blue px-2 py-0.5 rounded-sm">
                              {s.skill_name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Request hire */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck size={10} />
                      <span>TELEMETRY VERIFIED</span>
                    </span>
                    
                    {w.phone && (
                      <a 
                        href={`tel:${w.phone}`}
                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <PhoneCall size={10} className="text-electric-blue" />
                        <span>Call Worker</span>
                      </a>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
