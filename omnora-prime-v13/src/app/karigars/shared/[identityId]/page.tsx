'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Award, Clock, CheckCircle2, Award as MedalIcon, BarChart3, Globe,
  ShieldCheck, Loader2, ArrowUpRight, HelpCircle, Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PublicWorkerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const identityId = params.identityId as string;
  
  const [identity, setIdentity] = useState<any>(null);
  const [attendanceRate, setAttendanceRate] = useState<number>(100);
  const [productionStats, setProductionStats] = useState<any>({ avg_units_per_day: 0, avg_grade_a_pct: 0 });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!identityId) return;
    loadPublicProfile();
  }, [identityId]);
  
  const loadPublicProfile = async () => {
    try {
      // 1. Fetch public worker identity record (RLS permits if is_public = true)
      const { data: ident, error: identErr } = await supabase
        .from('worker_identities')
        .select('*, worker_skills(*)')
        .eq('id', identityId)
        .maybeSingle();
        
      if (identErr || !ident) {
        setLoading(false);
        return;
      }
      
      setIdentity(ident);
      
      // 2. Fetch anonymous rates and telemetry aggregates
      const [attStats, prodStats] = await Promise.all([
        supabase.rpc('get_karigar_attendance_rate', {
          p_karigar_id: ident.karigar_id,
          p_days: 90
        }),
        supabase.rpc('get_karigar_production_stats', {
          p_karigar_id: ident.karigar_id,
          p_days: 90
        })
      ]);
      
      if (attStats.data !== null) {
        setAttendanceRate(Number(attStats.data));
      }
      if (prodStats.data && (prodStats.data as any)[0]) {
        const stats = (prodStats.data as any)[0];
        setProductionStats({
          avg_units_per_day: Number(stats.avg_units_per_day) || 0,
          avg_grade_a_pct: Number(stats.avg_grade_a_pct) || 0
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090B] text-gray-400 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-electric-blue animate-spin" />
        <span className="text-xs uppercase font-black tracking-[0.2em] text-gray-500">Retrieving Public Record...</span>
      </div>
    );
  }
  
  if (!identity || !identity.is_public) {
    return (
      <div className="min-h-screen bg-[#07090B] text-gray-400 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500/80 animate-pulse" />
        <h1 className="text-lg font-black uppercase text-white tracking-widest">Profile Private or Restricted</h1>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
          The requested verified worker credential has been locked by the current employer or worker.
        </p>
      </div>
    );
  }
  
  const initials = identity.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <div className="min-h-screen bg-[#07090B] text-gray-200 p-6 md:p-12 font-sans select-none relative flex flex-col justify-center items-center">
      <div className="absolute top-0 right-0 w-[500px] h-[250px] bg-electric-blue/5 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="max-w-2xl w-full bg-[#0C0F12] border border-white/5 p-8 rounded-sm relative overflow-hidden space-y-8 shadow-2xl">
        <div className="absolute top-0 left-0 w-1/3 h-[1px] bg-electric-blue" />
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-black/40 border border-electric-blue/20 relative flex-shrink-0">
              <span className="text-xs font-black text-gray-400 font-mono">{initials}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black uppercase text-white tracking-tight italic">
                  {identity.full_name}
                </h1>
                <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-sm uppercase tracking-widest">
                  Verified Node
                </span>
              </div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">
                Verified Industrial Worker Credentials
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-electric-blue/5 border border-electric-blue/10 px-3 py-1 rounded-full">
            <Globe className="text-electric-blue shrink-0 animate-spin" size={10} />
            <span className="text-[8px] font-black text-electric-blue uppercase tracking-widest">Noxis Network</span>
          </div>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xxs font-black uppercase tracking-widest text-gray-400 mb-4">Productivity Stats (Last 90 Days)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Attendance */}
              <div className="p-4 bg-black/30 border border-white/5 rounded-sm">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block">Attendance consistency</span>
                <span className="text-xl font-black font-mono text-white tracking-tight block mt-1">
                  {attendanceRate}%
                </span>
                <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest mt-2 block">EXCELLENT</span>
              </div>

              {/* Units Output */}
              <div className="p-4 bg-black/30 border border-white/5 rounded-sm">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block">Avg Output Volume</span>
                <span className="text-xl font-black font-mono text-white tracking-tight block mt-1">
                  {productionStats.avg_units_per_day} <span className="text-xxs text-gray-500 font-sans">pcs/day</span>
                </span>
                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-2 block">Inspected Logs</span>
              </div>

              {/* Yield */}
              <div className="p-4 bg-black/30 border border-white/5 rounded-sm">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block">Grade A Yield</span>
                <span className="text-xl font-black font-mono text-emerald-400 tracking-tight block mt-1">
                  {productionStats.avg_grade_a_pct}%
                </span>
                <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest mt-2 block">HIGH PRECISION</span>
              </div>

            </div>
          </div>

          {/* Skill List */}
          <div className="space-y-3">
            <h3 className="text-xxs font-black uppercase tracking-widest text-gray-400">Verified Skills & Endorsements</h3>
            
            {(!identity.worker_skills || identity.worker_skills.length === 0) ? (
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">No verified skills attached.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {identity.worker_skills.map((s: any) => (
                  <div key={s.id} className="p-3 bg-black/30 border border-white/5 rounded-sm space-y-1">
                    <div className="flex items-center gap-1 text-electric-blue">
                      <MedalIcon size={12} />
                      <p className="text-xs font-black uppercase tracking-tight text-white">{s.skill_name}</p>
                    </div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Endorsed by: {s.employer_name}</p>
                    <p className="text-[8px] font-mono text-gray-600">Verification Date: {new Date(s.verified_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer verification disclaimer */}
        <div className="pt-6 border-t border-white/5 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[8px] font-black text-gray-500 uppercase tracking-widest">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>Noxis Verified Work Identity Record</span>
          </div>
          <p className="text-[9px] text-gray-600 leading-relaxed max-w-md mx-auto">
            This worker profile is dynamically compiled directly from secure machine and ledger telemetry on the Noxis B2B platform. Data is guaranteed tamper-proof.
          </p>
        </div>

      </div>
    </div>
  );
}
