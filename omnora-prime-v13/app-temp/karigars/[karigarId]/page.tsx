'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessProfileStore } from '@/store/BusinessProfileStore';
import { usePersona } from '@/hooks/usePersona';
import { 
  Users, ChevronLeft, ShieldCheck, Sparkles, CheckCircle2, 
  HelpCircle, Calendar, Plus, Trash2, Share2, Eye, EyeOff, 
  Clock, Award, BarChart3, AlertCircle, Loader2, DollarSign, CreditCard,
  Phone, MessageCircle, Banknote, X
} from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { openWhatsApp } from '@/lib/utils/whatsapp';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';
import { humanizeError } from '@/lib/utils/errors';

export default function KarigarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { profile } = useBusinessProfile();
  const { isLoaded } = useBusinessProfileStore();
  const { term, workerTerm, fmt } = usePersona();
  const supabase = createClient();
  
  const karigarId = params.karigarId as string;
  
  const [karigar, setKarigar] = useState<any>(null);
  const [identity, setIdentity] = useState<any>(null);
  const [attendanceRate, setAttendanceRate] = useState<number>(100);
  const [productionStats, setProductionStats] = useState<any>({ avg_units_per_day: 0, avg_grade_a_pct: 0 });
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'internal' | 'attendance' | 'production' | 'advances'>('profile');
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [productionLogs, setProductionLogs] = useState<any[]>([]);
  const [advancesLogs, setAdvancesLogs] = useState<any[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  
  useEffect(() => {
    if (isLoaded && !profile?.id) {
      router.push('/karigars');
      return;
    }
    if (!profile?.id || !karigarId) return;

    const controller = new AbortController();
    loadKarigarDetails(controller.signal);

    return () => {
      controller.abort();
    };
  }, [isLoaded, profile?.id, karigarId]);
  
  const loadKarigarDetails = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      // 1. Fetch Karigar record
      const { data: karRec, error: karErr } = await supabase
        .from('karigars')
        .select('*, karigar_grades(grade_name)')
        .eq('id', karigarId)
        .single();
         
      if (signal?.aborted) return;

      if (karErr || !karRec) {
        router.push('/karigars');
        return;
      }
      setKarigar(karRec);
      
      // 2. Fetch or create worker identity
      let { data: ident, error: identErr } = await supabase
        .from('worker_identities')
        .select('*, worker_skills(*)')
        .eq('karigar_id', karigarId)
        .eq('business_id', profile?.id)
        .maybeSingle();
        
      if (signal?.aborted) return;
        
      if (!ident && !identErr) {
        const { data: newIdent, error: createErr } = await supabase
          .from('worker_identities')
          .insert({
            karigar_id: karigarId,
            business_id: profile?.id,
            current_employer_id: profile?.id,
            full_name: karRec.name,
            phone: karRec.phone || '',
            is_public: false,
            open_to_work: false,
          })
          .select()
          .single();
          
        if (signal?.aborted) return;
          
        if (!createErr && newIdent) {
          ident = { ...newIdent, worker_skills: [] };
        }
      }
      setIdentity(ident);
      
      // 3. Fetch RPC Stats and raw logs (Attendance, Production, Advances)
      const [attStats, prodStats, rawAttendance, rawProduction, rawAdvances] = await Promise.all([
        supabase.rpc('get_karigar_attendance_rate', {
          p_karigar_id: karigarId,
          p_days: 90
        }),
        supabase.rpc('get_karigar_production_stats', {
          p_karigar_id: karigarId,
          p_days: 90
        }),
        supabase
          .from('attendance_logs')
          .select('*')
          .eq('karigar_id', karigarId)
          .order('log_date', { ascending: false }),
        supabase
          .from('karigar_production_logs')
          .select('*, skus(name)')
          .eq('karigar_id', karigarId)
          .order('log_date', { ascending: false }),
        supabase
          .from('karigar_advances')
          .select('*')
          .eq('karigar_id', karigarId)
          .order('advance_date', { ascending: false })
      ]);
      
      if (signal?.aborted) return;
      
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
      if (rawAttendance.data) setAttendanceLogs(rawAttendance.data);
      if (rawProduction.data) setProductionLogs(rawProduction.data);
      if (rawAdvances.data) setAdvancesLogs(rawAdvances.data);
      
      setActiveTab('profile');
    } catch (e) {
      console.error(e);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };
  
  const toggleVisibility = async () => {
    if (!identity) return;
    const newPublic = !identity.is_public;
    
    try {
      const { error } = await supabase
        .from('worker_identities')
        .update({ is_public: newPublic })
        .eq('id', identity.id);
        
      if (!error) {
        setIdentity((prev: any) => ({ ...prev, is_public: newPublic }));
      } else {
        toast.error("Visibility toggle failed", humanizeError(error, 'toggle visibility'));
      }
    } catch (e) {
      console.error(e);
      toast.error("Visibility toggle failed", humanizeError(e, 'toggle visibility'));
    }
  };
  
  const toggleOpenToWork = async () => {
    if (!identity) return;
    const newOpen = !identity.open_to_work;
    
    try {
      const { error } = await supabase
        .from('worker_identities')
        .update({ open_to_work: newOpen })
        .eq('id', identity.id);
        
      if (!error) {
        setIdentity((prev: any) => ({ ...prev, open_to_work: newOpen }));
      } else {
        toast.error("Job status toggle failed", humanizeError(error, 'toggle job status'));
      }
    } catch (e) {
      console.error(e);
      toast.error("Job status toggle failed", humanizeError(e, 'toggle job status'));
    }
  };
  
  const addSkill = async () => {
    if (!identity || !skillInput.trim()) return;
    setAddingSkill(true);
    
    try {
      const { data, error } = await supabase
        .from('worker_skills')
        .insert({
          worker_identity_id: identity.id,
          skill_name: skillInput.trim(),
          employer_name: profile?.business_name || 'Verified Employer',
        })
        .select()
        .single();
        
      if (!error && data) {
        setIdentity((prev: any) => ({
          ...prev,
          worker_skills: [...(prev.worker_skills || []), data]
        }));
        setSkillInput('');
      } else if (error) {
        toast.error("Skill tag registration failed", humanizeError(error, 'register skill'));
      }
    } catch (e) {
      console.error(e);
      toast.error("Skill tag registration failed", humanizeError(e, 'register skill'));
    } finally {
      setAddingSkill(false);
    }
  };
  
  const removeSkill = async (skillId: string) => {
    if (!identity) return;
    
    try {
      const { error } = await supabase
        .from('worker_skills')
        .delete()
        .eq('id', skillId);
        
      if (!error) {
        setIdentity((prev: any) => ({
          ...prev,
          worker_skills: (prev.worker_skills || []).filter((s: any) => s.id !== skillId)
        }));
      } else {
        toast.error("Skill tag deletion failed", humanizeError(error, 'delete skill'));
      }
    } catch (e) {
      console.error(e);
      toast.error("Skill tag deletion failed", humanizeError(e, 'delete skill'));
    }
  };
  
  const handleCopyShareLink = () => {
    if (!identity) return;
    const link = `${window.location.origin}/karigars/shared/${identity.id}`;
    navigator.clipboard.writeText(link);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090B] text-gray-400 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-electric-blue animate-spin" />
        <span className="text-xs uppercase font-black tracking-[0.2em] text-gray-500">Compiling Worker Identity...</span>
      </div>
    );
  }
  
  const initials = karigar?.name ? karigar.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '';
  
  return (
    <div className="min-h-screen bg-[#07090B] text-gray-200 p-6 md:p-8 font-sans select-none relative">
      <div className="absolute top-0 right-0 w-[500px] h-[250px] bg-electric-blue/5 rounded-full blur-[140px] pointer-events-none" />
      
      <main className="max-w-4xl mx-auto space-y-8">
        
        {/* Back and Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/karigars" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-wider">
            <ChevronLeft size={14} />
            <span>Back to Workers</span>
          </Link>
        </div>

        {/* Dynamic Identity Banner */}
        <div className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/4 h-[1px] bg-electric-blue" />
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-black/40 border-2 border-electric-blue/30 relative flex-shrink-0">
              {karigar?.photo_url ? (
                <Image src={karigar.photo_url} alt={karigar.name || 'Worker Photo'} width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-gray-400 font-mono">{initials}</span>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black uppercase text-white tracking-tight italic">
                  {karigar?.name}
                </h1>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-electric-blue/5 border border-electric-blue/10 text-electric-blue rounded-sm">
                  {karigar?.karigar_code}
                </span>
              </div>
              
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">
                Vertical: {karigar?.skill_type} · Grade: {karigar?.karigar_grades?.grade_name || 'Standard'}
              </p>
              
              <p className="text-[9px] text-gray-600 font-mono mt-1">
                Active Member Since {new Date(karigar?.joining_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <div className="flex items-center gap-3 mt-4">
                {/* Direct Call */}
                {karigar?.phone && (
                  <a
                    href={`tel:${karigar.phone}`}
                    className="flex items-center gap-2
                      px-4 py-2 text-xs font-semibold
                      bg-white/5 border border-white/10
                      text-gray-300 hover:text-white
                      hover:border-white/20 transition-colors"
                  >
                    <Phone size={13} />
                    Call
                  </a>
                )}
                
                {/* WhatsApp Reminder */}
                <button
                  onClick={() => {
                    const msg =
                      `Assalam o Alaikum ${karigar.name},` +
                      `\n\nYour peshgi balance is: ` +
                      `${profile?.currency || 'PKR'} ` +
                      `${Math.abs(karigar.peshgi_balance || karigar.current_advance || 0)
                        .toLocaleString()}.` +
                      `\n\n_Noxis Hub | ${
                        profile?.business_name
                      }_`
                    openWhatsApp(
                      karigar.phone,
                      msg,
                      profile?.country_code || 'PK'
                    )
                  }}
                  className="flex items-center gap-2
                    px-4 py-2 text-xs font-semibold
                    bg-[#25D366]/10 border
                    border-[#25D366]/25 text-[#25D366]
                    hover:bg-[#25D366]/20 transition-colors"
                >
                  <MessageCircle size={13} />
                  WhatsApp
                </button>

                {/* Give Advance (Peshgi) */}
                <button
                  onClick={() => setAdvanceModalOpen(true)}
                  className="flex items-center gap-2
                    px-4 py-2 text-xs font-semibold
                    bg-[#C5A059]/10 border
                    border-[#C5A059]/25 text-[#C5A059]
                    hover:bg-[#C5A059]/20 transition-colors"
                >
                  <Banknote size={13} />
                  Give Advance
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {identity?.open_to_work && (
              <span className="text-[8px] font-black px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full animate-pulse uppercase tracking-widest">
                ● Seeking Opportunities
              </span>
            )}
            <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
              karigar?.status === 'active' ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'bg-gray-500/5 text-gray-400 border border-white/5'
            }`}>
              {karigar?.status}
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-white/5 gap-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-electric-blue text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Work Profile
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-electric-blue text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'production'
                ? 'border-electric-blue text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Production
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'advances'
                ? 'border-electric-blue text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Advances
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'internal'
                ? 'border-electric-blue text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Internal Ledger
          </button>
        </div>

        {/* TAB CONTENTS */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              
              {/* Left Column (Performance & Settings) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Header Profile Info */}
                <div className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                        <Award size={14} className="text-electric-blue" />
                        <span>Verified Work Profile</span>
                      </h3>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Worker Telemetry & Credentials</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Private/Shared toggle */}
                      <button
                        onClick={toggleVisibility}
                        className={`px-3 py-1.5 rounded-sm border text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                          identity?.is_public 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-white/5 border-white/5 text-gray-500'
                        }`}
                      >
                        {identity?.is_public ? (
                          <>
                            <Eye size={12} />
                            <span>Shared with Network</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            <span>Private</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Marketplace Seek Toggle */}
                  <div className="p-4 bg-black/30 border border-white/5 rounded-sm flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-white">Labor Marketplace Registry</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                        Mark this worker as "Open to Work" to showcase their verified profile to other factories seeking talent.
                      </p>
                    </div>
                    <button
                      onClick={toggleOpenToWork}
                      className={`px-4 py-2 rounded-sm border text-[9px] font-black uppercase tracking-widest transition-all ${
                        identity?.open_to_work
                          ? 'bg-electric-blue text-black border-electric-blue'
                          : 'border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {identity?.open_to_work ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>

                  {/* Attendance Record */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-electric-blue" />
                        <span>90-Day Attendance Consistency</span>
                      </span>
                      <span className="text-white font-mono">{attendanceRate}%</span>
                    </div>
                    
                    <div className="h-2.5 bg-black/40 border border-white/5 p-[1px] rounded-sm overflow-hidden">
                      <div 
                        className={`h-full rounded-sm transition-all duration-1000 ${
                          attendanceRate >= 90 ? 'bg-emerald-400' : attendanceRate >= 75 ? 'bg-blue-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Production Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Units average */}
                    <div className="p-4 bg-black/20 border border-white/5 rounded-sm">
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 block">Avg Output Volume</span>
                      <div className="text-xl font-black font-mono text-white tracking-tight mt-1">
                        {productionStats.avg_units_per_day} <span className="text-xs text-gray-500 font-sans">units / day</span>
                      </div>
                      <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest block mt-2">Source: Live production logs</span>
                    </div>

                    {/* Quality Yield */}
                    <div className="p-4 bg-black/20 border border-white/5 rounded-sm">
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 block">Grade A Yield</span>
                      <div className="text-xl font-black font-mono text-emerald-400 tracking-tight mt-1">
                        {productionStats.avg_grade_a_pct}%
                      </div>
                      <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest block mt-2">Source: Quality inspections</span>
                    </div>

                  </div>

                </div>

                {/* Share identity Link */}
                {identity?.is_public && (
                  <div className="p-5 bg-electric-blue/[0.02] border border-electric-blue/10 rounded-sm flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-white">Public Profile Referral Link</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                        A secure read-only URL showing verified skills and productivity metrics. Personal wages, EOBI, and advance logs are hidden.
                      </p>
                    </div>
                    <button
                      onClick={handleCopyShareLink}
                      className="px-4 py-2.5 text-xs font-black uppercase tracking-widest bg-electric-blue text-black hover:bg-cyan-300 transition-all rounded-sm flex items-center gap-1"
                    >
                      <Share2 size={12} />
                      <span>{copiedShareLink ? 'Copied Link!' : 'Copy Link'}</span>
                    </button>
                  </div>
                )}

              </div>

              {/* Right Column (Verified Skills list) */}
              <div className="lg:col-span-1 space-y-6">
                
                <div className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-xxs font-black uppercase tracking-widest text-gray-400">Verified Skills</h3>
                    <Sparkles size={12} className="text-electric-blue" />
                  </div>

                  {/* Add Skill Button */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        placeholder="e.g. Overlock Stitching"
                        className="flex-1 bg-[#161A1F] border border-white/5 text-white text-xs px-3 py-2 outline-none focus:border-electric-blue/40 rounded-sm"
                      />
                      <button
                        onClick={addSkill}
                        disabled={addingSkill || !skillInput.trim()}
                        className="p-2 bg-electric-blue text-black hover:bg-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-sm"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Skills List */}
                  {(!identity?.worker_skills || identity.worker_skills.length === 0) ? (
                    <p className="text-[10px] text-gray-600 text-center py-4 font-bold uppercase tracking-widest">No verified skill tags added.</p>
                  ) : (
                    <div className="space-y-3.5 pt-2">
                      {identity.worker_skills.map((s: any) => (
                        <div key={s.id} className="p-3 bg-black/30 border border-white/5 rounded-sm space-y-1 relative group hover:border-white/10 transition-colors">
                          <button
                            onClick={() => removeSkill(s.id)}
                            className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            title="Remove Skill Tag"
                          >
                            <Trash2 size={12} />
                          </button>
                          
                          <p className="text-xs font-black uppercase text-white tracking-tight">{s.skill_name}</p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Verified by: {s.employer_name}</p>
                          <p className="text-[8px] font-mono text-gray-600 mt-1">Logged: {new Date(s.verified_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>

            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm space-y-6"
            >
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                  <Calendar size={14} className="text-electric-blue" />
                  <span>Attendance History</span>
                </h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Daily Check-In/Check-Out Logs</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Shift Hours</th>
                      <th className="pb-3 text-right">Overtime</th>
                      <th className="pb-3 pl-6">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] divide-y divide-white/[0.02]">
                    {attendanceLogs.length > 0 ? (
                      attendanceLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.01]">
                          <td className="py-3 font-mono text-gray-400">{log.log_date}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px] ${
                              log.status === 'present' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              log.status === 'leave' || log.status === 'holiday' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-white">{log.shift_hours || 8} hrs</td>
                          <td className="py-3 text-right font-mono font-bold text-white">{log.overtime_hrs || 0} hrs</td>
                          <td className="py-3 pl-6 text-gray-400 italic">{log.notes || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-600 italic">No attendance records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'production' && (
            <motion.div
              key="production"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm space-y-6"
            >
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-electric-blue" />
                  <span>Production History</span>
                </h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Logged Daily Piece-Rate Output</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">SKU / Item</th>
                      <th className="pb-3 text-right">Qty</th>
                      <th className="pb-3 text-center">Grade</th>
                      <th className="pb-3 text-right">Piece Rate</th>
                      <th className="pb-3 text-right">Effective Earning</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] divide-y divide-white/[0.02]">
                    {productionLogs.length > 0 ? (
                      productionLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.01]">
                          <td className="py-3 font-mono text-gray-400">{log.log_date}</td>
                          <td className="py-3 text-white font-bold">{log.skus?.name || 'Standard Production'}</td>
                          <td className="py-3 text-right font-mono font-bold text-white">{Number(log.qty_produced).toFixed(0)} {log.unit || 'pcs'}</td>
                          <td className="py-3 text-center">
                            <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-[2px] ${
                              log.quality_grade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              log.quality_grade === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              Grade {log.quality_grade || 'A'}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono text-gray-400">{fmt(log.piece_rate_used)}</td>
                          <td className="py-3 text-right font-mono font-bold text-emerald-400">{fmt(log.effective_earning || log.line_earning)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-600 italic">No production records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'advances' && (
            <motion.div
              key="advances"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm space-y-6"
            >
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                  <DollarSign size={14} className="text-[#C5A059]" />
                  <span>Advances (Peshgi) History</span>
                </h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Worker Cash Advances & Settlements</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 pl-6">Reason</th>
                      <th className="pb-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] divide-y divide-white/[0.02]">
                    {advancesLogs.length > 0 ? (
                      advancesLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.01]">
                          <td className="py-3 font-mono text-gray-400">{log.advance_date}</td>
                          <td className="py-3 text-right font-mono font-bold text-amber-400">{fmt(log.amount)}</td>
                          <td className="py-3 pl-6 text-gray-300">{log.reason || 'Personal Advance'}</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px] ${
                              log.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              log.status === 'settled' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              log.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-gray-600 italic">No cash advance records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'internal' && (
            <motion.div
              key="internal"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm space-y-6"
            >
              
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#C5A059]" />
                  <span>Private Internal Ledger Details</span>
                </h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Private Factory Wage Records & Sensitive CNIC Logs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left side */}
                <div className="space-y-4">
                  
                  <div className="py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Payment Model</span>
                    <span className="text-xs font-mono font-bold text-white uppercase">{karigar?.wage_type.replace('_', ' ')}</span>
                  </div>

                  <div className="py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Standard Piece Rate</span>
                    <span className="text-xs font-mono font-bold text-white">{profile?.currency} {karigar?.piece_rate || 0}/pc</span>
                  </div>

                  <div className="py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Daily Standard Wage</span>
                    <span className="text-xs font-mono font-bold text-white">{profile?.currency} {karigar?.daily_rate || 0}/day</span>
                  </div>

                  <div className="py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Monthly Salary Base</span>
                    <span className="text-xs font-mono font-bold text-white">{profile?.currency} {karigar?.monthly_salary || 0}/month</span>
                  </div>

                </div>

                {/* Right side */}
                <div className="space-y-4">
                  
                  <div className="py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Outstanding Cash Advance</span>
                    <span className="text-xs font-mono font-bold text-amber-400">{profile?.currency} {karigar?.current_advance || 0}</span>
                  </div>

                  <div className="py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Father's Name</span>
                    <span className="text-xs font-semibold text-white">{karigar?.father_name || 'Not logged'}</span>
                  </div>

                  <div className="py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">National CNIC Identity</span>
                    <span className="text-xs font-mono font-bold text-white">{karigar?.cnic || 'Not logged'}</span>
                  </div>

                  <div className="py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Contact Phone</span>
                    <span className="text-xs font-mono text-white">{karigar?.phone || 'Not logged'}</span>
                  </div>

                </div>

              </div>

              <div className="p-4 bg-amber-500/[0.01] border border-amber-500/10 rounded-sm text-[10px] text-gray-500 leading-relaxed font-semibold uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="text-amber-500 shrink-0" size={14} />
                <span>Private details are strictly isolated. External users or neighboring nodes cannot view this wage and identity ledger data.</span>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {advanceModalOpen && (
          <AdvancePeshgiModal
            karigar={karigar}
            onClose={() => setAdvanceModalOpen(false)}
            onSaved={() => {
              setAdvanceModalOpen(false);
              loadKarigarDetails(); // refresh data
            }}
          />
        )}

      </main>
    </div>
  );
}

const advanceSchema = z.object({
  amount: z.coerce.number().positive(),
  reason: z.enum(['Medical', 'Festival', 'Emergency', 'Other']),
  notes: z.string().optional(),
});

function AdvancePeshgiModal({ karigar, onClose, onSaved }: { karigar: any, onClose: () => void, onSaved: () => void }) {
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fmt } = usePersona();
  const { register, handleSubmit, watch: watchAdvance } = useForm<z.infer<typeof advanceSchema>>({
    resolver: zodResolver(advanceSchema),
    defaultValues: { reason: 'Medical' }
  });

  const onSubmit = async (values: z.infer<typeof advanceSchema>) => {
    setIsSubmitting(true);
    try {
      // 1. Log Advance
      const { error: advError } = await supabase.from('karigar_advances').insert({
        business_id: profile?.id,
        karigar_id: karigar.id,
        amount: values.amount,
        reason: values.reason,
        status: 'pending',
        advance_date: new Date().toISOString().split('T')[0]
      });
      if (advError) throw advError;

      // 2. Update Karigar Balance
      const { error: updateError } = await supabase.from('karigars').update({
        current_advance: Number(karigar.current_advance || 0) + Number(values.amount)
      }).eq('id', karigar.id);
      if (updateError) throw updateError;

      onSaved();
    } catch (err: unknown) {
      toast.error("Transaction failed", humanizeError(err, 'issue advance'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
       <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-[#0C0F12] border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6 bg-[#07090B] border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center space-x-3">
                <Banknote className="text-[#C5A059]" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Issue Peshgi (Advance)</h3>
             </div>
             <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
          </div>
          <div className="p-6 bg-[#C5A059]/5 border-b border-white/5 flex items-center justify-between">
             <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Current Outstanding</span>
             <span className="font-mono text-[#C5A059] font-bold">{fmt(karigar.current_advance || karigar.peshgi_balance || 0)}</span>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-600 tracking-widest">Advance Amount ({profile?.currency || 'PKR'})</label>
                <input type="number" {...register("amount")} className="w-full bg-[#07090B] border border-white/10 p-4 text-2xl font-mono text-center text-[#C5A059] outline-none" placeholder="0.00" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-600 tracking-widest">Reason for Disbursement</label>
                <select {...register("reason")} className="w-full bg-[#07090B] border border-white/10 p-3 text-xs text-white outline-none">
                   <option>Medical</option>
                   <option>Festival</option>
                   <option>Emergency</option>
                   <option>Other</option>
                </select>
             </div>
             <div className="flex flex-col space-y-3">
               <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#C5A059] text-black text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {isSubmitting ? "Processing..." : "Disburse Funds"}
               </button>
               
               <button 
                 type="button"
                 onClick={() => {
                   const msg = `Assalam o Alaikum ${karigar.name},\n\nYour peshgi request for ${profile?.currency || 'PKR'} ${watchAdvance('amount') || 0} (${watchAdvance('reason')}) has been registered.\n\n_Noxis Hub_`;
                   openWhatsApp(karigar.phone, msg, profile?.country_code || 'PK');
                 }}
                 className="w-full py-3 border border-[#25D366]/30 text-[#25D366] text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366]/5 flex items-center justify-center space-x-2"
               >
                  <MessageCircle size={14} />
                  <span>Send WhatsApp Alert</span>
               </button>
             </div>
          </form>
       </motion.div>
    </div>
  );
}
