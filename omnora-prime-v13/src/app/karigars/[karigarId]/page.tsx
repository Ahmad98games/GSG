'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
import { KarigarGradeBadge } from '@/components/karigars/KarigarGradeBadge';
import { getGradeInfo } from '@/lib/karigars/gradeSystem';

export default function KarigarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { profile } = useBusinessProfile();
  const { isLoaded } = useBusinessProfileStore();
  const { term, workerTerm, fmt } = usePersona();
  const supabase = useMemo(() => createClient(), []);
  
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
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [productionModalOpen, setProductionModalOpen] = useState(false);
  const [isUpdatingGrade, setIsUpdatingGrade] = useState(false);

  const handleUpdateGrade = async (newGrade: string) => {
    setIsUpdatingGrade(true);
    try {
      let updated = false;
      try {
        const res = await fetch('/api/karigars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation: 'update_grade', karigar_id: karigarId, new_grade: newGrade }),
        });
        const json = await res.json();
        if (res.ok && json.success) updated = true;
      } catch {}

      if (!updated) {
        const { error } = await supabase
          .from('karigars')
          .update({ grade: newGrade })
          .eq('id', karigarId);
        if (error) throw error;
      }

      setKarigar((prev: any) => ({ ...prev, grade: newGrade }));
      toast.success(`Artisan grade updated to ${newGrade}`);
    } catch (err: any) {
      toast.error('Failed to update grade', humanizeError(err, 'update grade'));
    } finally {
      setIsUpdatingGrade(false);
    }
  };
  
  const loadKarigarDetails = useCallback(async (signal?: AbortSignal) => {
    if (!karigarId) {
      setLoading(false);
      return;
    }

    const bizId = profile?.id || (typeof window !== 'undefined' ? localStorage.getItem('noxis_business_id') : null) || '00000000-0000-0000-0000-000000000000';

    try {
      setLoading(true);

      // 1. Instant 0ms load from localStorage cache
      let initialWorker: any = null;
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`noxis_cached_karigars_${bizId}`);
          if (cached) {
            const list = JSON.parse(cached);
            const found = Array.isArray(list) ? list.find((k: any) => k.id === karigarId) : null;
            if (found) {
              initialWorker = found;
              setKarigar(found);
            }
          }
          const cachedIdent = localStorage.getItem(`noxis_worker_identity_${karigarId}`);
          if (cachedIdent) {
            setIdentity(JSON.parse(cachedIdent));
          }
        } catch {}
      }

      // 2. Query /api/karigars?id= (checks local SQLite first, then Supabase)
      let apiFoundWorker = false;
      try {
        const res = await fetch(`/api/karigars?id=${karigarId}`, { signal });
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            initialWorker = json.data;
            setKarigar(json.data);
            apiFoundWorker = true;
          }
          if (Array.isArray(json.attendance) && json.attendance.length > 0) {
            setAttendanceLogs(json.attendance);
          }
          if (Array.isArray(json.production) && json.production.length > 0) {
            setProductionLogs(json.production);
          }
          if (Array.isArray(json.advances) && json.advances.length > 0) {
            setAdvancesLogs(json.advances);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') console.warn('Local API karigar load notice:', err);
      }

      // 3. Cloud fetch fallback / refresh via Supabase
      const [rawRecord, rawAttendance, rawProduction, rawAdvances, rawIdentity] = await Promise.allSettled([
        !apiFoundWorker
          ? supabase.from('karigars').select('*, karigar_grades(grade_name)').eq('id', karigarId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from('attendance_logs').select('*').eq('karigar_id', karigarId).order('log_date', { ascending: false }).limit(50),
        supabase.from('karigar_production_logs').select('*, skus(name)').eq('karigar_id', karigarId).order('log_date', { ascending: false }).limit(50),
        supabase.from('karigar_advances').select('*').eq('karigar_id', karigarId).order('advance_date', { ascending: false }).limit(50),
        supabase.from('worker_identities').select('*, worker_skills(*)').eq('karigar_id', karigarId).maybeSingle()
      ]);

      if (signal?.aborted) return;

      if (rawRecord.status === 'fulfilled' && rawRecord.value?.data) {
        initialWorker = rawRecord.value.data;
        setKarigar(rawRecord.value.data);
      }
      if (rawAttendance.status === 'fulfilled' && rawAttendance.value?.data && rawAttendance.value.data.length > 0) {
        setAttendanceLogs(rawAttendance.value.data);
      }
      if (rawProduction.status === 'fulfilled' && rawProduction.value?.data && rawProduction.value.data.length > 0) {
        setProductionLogs(rawProduction.value.data);
      }
      if (rawAdvances.status === 'fulfilled' && rawAdvances.value?.data && rawAdvances.value.data.length > 0) {
        setAdvancesLogs(rawAdvances.value.data);
      }

      // 4. Ensure Identity is NEVER null
      let resolvedIdentity: any = null;
      if (rawIdentity.status === 'fulfilled' && rawIdentity.value?.data) {
        resolvedIdentity = rawIdentity.value.data;
      } else if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`noxis_worker_identity_${karigarId}`);
        if (local) {
          try { resolvedIdentity = JSON.parse(local); } catch {}
        }
      }

      if (!resolvedIdentity) {
        resolvedIdentity = {
          id: karigarId,
          karigar_id: karigarId,
          full_name: initialWorker?.name || 'Worker',
          is_public: false,
          open_to_work: false,
          worker_skills: []
        };
      }
      setIdentity(resolvedIdentity);
      try {
        localStorage.setItem(`noxis_worker_identity_${karigarId}`, JSON.stringify(resolvedIdentity));
      } catch {}

    } catch (e) {
      console.warn("Karigar details load notice:", e);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [karigarId, profile?.id, supabase]);

  useEffect(() => {
    if (!karigarId) return;

    const controller = new AbortController();
    loadKarigarDetails(controller.signal);

    return () => {
      controller.abort();
    };
  }, [karigarId, loadKarigarDetails]);

  // Recalculate metrics when logs change
  useEffect(() => {
    if (attendanceLogs && attendanceLogs.length > 0) {
      const presents = attendanceLogs.filter(l => l.status === 'present' || l.status === 'leave').length;
      const rate = Math.round((presents / attendanceLogs.length) * 100);
      setAttendanceRate(rate);
    }
  }, [attendanceLogs]);

  useEffect(() => {
    if (productionLogs && productionLogs.length > 0) {
      const totalUnits = productionLogs.reduce((acc, l) => acc + Number(l.qty_produced || l.units_produced || 0), 0);
      const gradeACount = productionLogs.filter(l => (l.quality_grade || l.grade || '').toUpperCase() === 'A').length;
      const avgUnits = Math.round(totalUnits / Math.max(productionLogs.length, 1));
      const gradeAPct = Math.round((gradeACount / productionLogs.length) * 100);
      setProductionStats({ avg_units_per_day: avgUnits, avg_grade_a_pct: gradeAPct });
    }
  }, [productionLogs]);
  
  const toggleVisibility = async () => {
    const cur = identity || {
      id: karigarId,
      karigar_id: karigarId,
      full_name: karigar?.name || 'Worker',
      is_public: false,
      open_to_work: false,
      worker_skills: []
    };
    const newPublic = !cur.is_public;
    const updated = { ...cur, is_public: newPublic };
    setIdentity(updated);
    try {
      localStorage.setItem(`noxis_worker_identity_${karigarId}`, JSON.stringify(updated));
    } catch {}
    toast.success(newPublic ? "Profile shared with network" : "Profile set to private");
    try {
      await supabase.from('worker_identities').upsert({
        id: cur.id,
        karigar_id: karigarId,
        business_id: profile?.id || '00000000-0000-0000-0000-000000000000',
        full_name: karigar?.name || 'Worker',
        is_public: newPublic
      }, { onConflict: 'karigar_id' });
    } catch {}
  };
  
  const toggleOpenToWork = async () => {
    const cur = identity || {
      id: karigarId,
      karigar_id: karigarId,
      full_name: karigar?.name || 'Worker',
      is_public: false,
      open_to_work: false,
      worker_skills: []
    };
    const newOpen = !cur.open_to_work;
    const updated = { ...cur, open_to_work: newOpen };
    setIdentity(updated);
    try {
      localStorage.setItem(`noxis_worker_identity_${karigarId}`, JSON.stringify(updated));
    } catch {}
    toast.success(newOpen ? "Worker marked as seeking opportunities (ACTIVE)" : "Worker marked as INACTIVE in marketplace");
    try {
      await supabase.from('worker_identities').upsert({
        id: cur.id,
        karigar_id: karigarId,
        business_id: profile?.id || '00000000-0000-0000-0000-000000000000',
        full_name: karigar?.name || 'Worker',
        open_to_work: newOpen
      }, { onConflict: 'karigar_id' });
    } catch {}
  };
  
  const addSkill = async () => {
    const tag = skillInput.trim();
    if (!tag) return;
    setAddingSkill(true);
    try {
      const cur = identity || {
        id: karigarId,
        karigar_id: karigarId,
        full_name: karigar?.name || 'Worker',
        is_public: false,
        open_to_work: false,
        worker_skills: []
      };
      const newSkill = {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'sk_' + Date.now()),
        worker_identity_id: cur.id,
        skill_name: tag,
        employer_name: profile?.business_name || 'Verified Employer',
        verified_at: new Date().toISOString()
      };
      const updated = { ...cur, worker_skills: [...(cur.worker_skills || []), newSkill] };
      setIdentity(updated);
      setSkillInput('');
      try {
        localStorage.setItem(`noxis_worker_identity_${karigarId}`, JSON.stringify(updated));
      } catch {}
      toast.success(`Verified skill added: "${tag}"`);
      try {
        await supabase.from('worker_skills').insert({
          id: newSkill.id,
          worker_identity_id: cur.id,
          skill_name: tag,
          employer_name: profile?.business_name || 'Verified Employer'
        });
      } catch {}
    } catch (e: any) {
      console.warn('Skill registration notice:', e);
    } finally {
      setAddingSkill(false);
    }
  };
  
  const removeSkill = async (skillId: string) => {
    const cur = identity || {
      id: karigarId,
      karigar_id: karigarId,
      full_name: karigar?.name || 'Worker',
      is_public: false,
      open_to_work: false,
      worker_skills: []
    };
    const updated = { ...cur, worker_skills: (cur.worker_skills || []).filter((s: any) => s.id !== skillId) };
    setIdentity(updated);
    try {
      localStorage.setItem(`noxis_worker_identity_${karigarId}`, JSON.stringify(updated));
    } catch {}
    toast.success("Skill tag removed");
    try {
      await supabase.from('worker_skills').delete().eq('id', skillId);
    } catch {}
  };
  
  const handleCopyShareLink = () => {
    const targetId = identity?.id || karigarId;
    const link = `${window.location.origin}/karigars/shared/${targetId}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(link);
    }
    setCopiedShareLink(true);
    toast.success("Public referral link copied to clipboard");
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
              
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Vertical: <span className="text-white">{karigar?.skill_type || 'General'}</span>
                </span>
                <span className="text-gray-600">·</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Artisan Grade:</span>
                  <select
                    value={karigar?.grade || 'B'}
                    disabled={isUpdatingGrade}
                    onChange={(e) => handleUpdateGrade(e.target.value)}
                    className="bg-[#12161F] border border-white/10 text-xs text-white rounded px-2.5 py-1 outline-none focus:border-electric-blue font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <option value="MASTER">Master (Ustaad)</option>
                    <option value="A">Grade A (Expert)</option>
                    <option value="B">Grade B (Intermediate)</option>
                    <option value="C">Grade C (Apprentice)</option>
                  </select>
                  <KarigarGradeBadge grade={karigar?.grade} showDetails />
                </div>
              </div>
              
              <p className="text-[9px] text-gray-600 font-mono mt-1">
                Active Member Since {karigar?.joining_date ? new Date(karigar.joining_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently Registered'}
              </p>

              <div className="flex items-center gap-3 mt-4">
                {/* Direct Call */}
                {karigar?.phone ? (
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
                ) : (
                  <button
                    onClick={() => toast.error("No phone number registered for this worker")}
                    className="flex items-center gap-2
                      px-4 py-2 text-xs font-semibold
                      bg-white/5 border border-white/10
                      text-gray-500 hover:text-gray-400 transition-colors cursor-pointer"
                  >
                    <Phone size={13} />
                    Call
                  </button>
                )}
                
                {/* WhatsApp Reminder */}
                <button
                  onClick={() => {
                    if (!karigar?.phone) {
                      toast.error("No phone number registered for this worker");
                      return;
                    }
                    const msg =
                      `Assalam o Alaikum ${karigar.name || 'Worker'},` +
                      `\n\nYour peshgi balance is: ` +
                      `${profile?.currency || 'PKR'} ` +
                      `${Math.abs(karigar.peshgi_balance || karigar.current_advance || 0)
                        .toLocaleString()}.` +
                      `\n\n_Noxis Hub | ${
                        profile?.business_name || 'Noxis'
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
                    hover:bg-[#25D366]/20 transition-colors cursor-pointer"
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
                    hover:bg-[#C5A059]/20 transition-colors cursor-pointer"
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                    <Calendar size={14} className="text-electric-blue" />
                    <span>Attendance History</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Daily Check-In/Check-Out Logs</p>
                </div>
                <button
                  onClick={() => setAttendanceModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-electric-blue text-black text-xs font-black uppercase tracking-wider rounded-sm hover:bg-cyan-300 transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  Mark Attendance
                </button>
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
                          <td className="py-3 font-mono text-gray-400">{log.log_date || log.attendance_date}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px] ${
                              log.status === 'present' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              log.status === 'leave' || log.status === 'holiday' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              log.status === 'half' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
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
                        <td colSpan={5} className="py-12 text-center text-gray-600 italic">
                          No attendance records found. Click "Mark Attendance" above to log a shift.
                        </td>
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                    <BarChart3 size={14} className="text-electric-blue" />
                    <span>Production History</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Logged Daily Piece-Rate Output</p>
                </div>
                <button
                  onClick={() => setProductionModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-electric-blue text-black text-xs font-black uppercase tracking-wider rounded-sm hover:bg-cyan-300 transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  Log Production
                </button>
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
                          <td className="py-3 text-white font-bold">{log.skus?.name || log.sku_name || 'Standard Production'}</td>
                          <td className="py-3 text-right font-mono font-bold text-white">{Number(log.qty_produced || log.units_produced || 0).toFixed(0)} {log.unit || 'pcs'}</td>
                          <td className="py-3 text-center">
                            <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-[2px] ${
                              (log.quality_grade || log.grade) === 'A' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              (log.quality_grade || log.grade) === 'rejected' || (log.quality_grade || log.grade) === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              Grade {log.quality_grade || log.grade || 'A'}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono text-gray-400">{fmt(log.piece_rate_used || karigar?.piece_rate || 0)}</td>
                          <td className="py-3 text-right font-mono font-bold text-emerald-400">{fmt(log.effective_earning || log.line_earning || log.earnings || 0)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-600 italic">
                          No production records found. Click "Log Production" above to add worker output.
                        </td>
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                    <DollarSign size={14} className="text-[#C5A059]" />
                    <span>Advances (Peshgi) History</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Worker Cash Advances & Settlements</p>
                </div>
                <button
                  onClick={() => setAdvanceModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A059] text-black text-xs font-black uppercase tracking-wider rounded-sm hover:bg-[#d4ad64] transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  Issue Advance
                </button>
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
                        <td colSpan={4} className="py-12 text-center text-gray-600 italic">
                          No cash advance records found. Click "Issue Advance" above to record a disbursement.
                        </td>
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
                    <span className="text-xs font-mono font-bold text-white uppercase">{(karigar?.wage_type || 'piece_rate').replace('_', ' ')}</span>
                  </div>

                  <div className="py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Standard Piece Rate</span>
                    <span className="text-xs font-mono font-bold text-white">{profile?.currency || 'PKR'} {karigar?.piece_rate || 0}/pc</span>
                  </div>

                  <div className="py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Daily Standard Wage</span>
                    <span className="text-xs font-mono font-bold text-white">{profile?.currency || 'PKR'} {karigar?.daily_rate || 0}/day</span>
                  </div>

                  <div className="py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Monthly Salary Base</span>
                    <span className="text-xs font-mono font-bold text-white">{profile?.currency || 'PKR'} {karigar?.monthly_salary || 0}/month</span>
                  </div>

                </div>

                {/* Right side */}
                <div className="space-y-4">
                  
                  <div className="py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Outstanding Cash Advance</span>
                    <span className="text-xs font-mono font-bold text-amber-400">{profile?.currency || 'PKR'} {karigar?.current_advance || karigar?.peshgi_balance || 0}</span>
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
            onSaved={(newEntry?: any) => {
              setAdvanceModalOpen(false);
              if (newEntry) {
                setAdvancesLogs(prev => [newEntry, ...prev]);
                setKarigar((prev: any) => ({
                  ...prev,
                  current_advance: Number(prev?.current_advance || 0) + Number(newEntry.amount),
                  peshgi_balance: Number(prev?.peshgi_balance || 0) + Number(newEntry.amount)
                }));
              }
              loadKarigarDetails();
            }}
          />
        )}

        {attendanceModalOpen && (
          <MarkAttendanceModal
            karigar={karigar}
            onClose={() => setAttendanceModalOpen(false)}
            onSaved={(newLog) => {
              setAttendanceModalOpen(false);
              if (newLog) {
                setAttendanceLogs(prev => [newLog, ...prev]);
              }
            }}
          />
        )}

        {productionModalOpen && (
          <LogProductionModal
            karigar={karigar}
            onClose={() => setProductionModalOpen(false)}
            onSaved={(newProd) => {
              setProductionModalOpen(false);
              if (newProd) {
                setProductionLogs(prev => [newProd, ...prev]);
              }
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

function AdvancePeshgiModal({ karigar, onClose, onSaved }: { karigar: any, onClose: () => void, onSaved: (entry?: any) => void }) {
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
      const res = await fetch('/api/karigars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'advance',
          karigar_id: karigar.id,
          advance_data: {
            business_id: profile?.id,
            karigar_id: karigar.id,
            amount: Number(values.amount),
            reason: values.reason,
            status: 'pending',
            advance_date: new Date().toISOString().split('T')[0],
            new_advance_balance: Number(karigar.current_advance || 0) + Number(values.amount)
          }
        })
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok || resData.error) {
        // Fallback: direct client update
        const { error: advError } = await supabase.from('karigar_advances').insert({
          business_id: profile?.id,
          karigar_id: karigar.id,
          amount: values.amount,
          reason: values.reason,
          status: 'pending',
          advance_date: new Date().toISOString().split('T')[0]
        });
        if (advError) throw new Error(resData.error || advError.message);

        await supabase.from('karigars').update({
          current_advance: Number(karigar.current_advance || 0) + Number(values.amount)
        }).eq('id', karigar.id);
      }

      const newEntry = {
        id: 'adv_' + Date.now(),
        advance_date: new Date().toISOString().split('T')[0],
        amount: Number(values.amount),
        reason: values.reason,
        status: 'approved'
      };

      onSaved(newEntry);
      toast.success(`Peshgi advance of ${profile?.currency || 'PKR'} ${values.amount} issued successfully`);
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
                <input type="number" step="any" required {...register("amount")} className="w-full bg-[#07090B] border border-white/10 p-4 text-2xl font-mono text-center text-[#C5A059] outline-none" placeholder="0.00" />
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
               <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#C5A059] text-black text-[10px] font-black uppercase tracking-widest shadow-lg cursor-pointer hover:bg-[#d6af63] transition-colors">
                  {isSubmitting ? "Processing..." : "Disburse Funds"}
               </button>
               
               <button 
                 type="button"
                 onClick={() => {
                   const msg = `Assalam o Alaikum ${karigar.name},\n\nYour peshgi request for ${profile?.currency || 'PKR'} ${watchAdvance('amount') || 0} (${watchAdvance('reason')}) has been registered.\n\n_Noxis Hub_`;
                   openWhatsApp(karigar.phone, msg, profile?.country_code || 'PK');
                 }}
                 className="w-full py-3 border border-[#25D366]/30 text-[#25D366] text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366]/5 flex items-center justify-center space-x-2 cursor-pointer"
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

function MarkAttendanceModal({
  karigar,
  onClose,
  onSaved
}: {
  karigar: any;
  onClose: () => void;
  onSaved: (log: any) => void;
}) {
  const { profile } = useBusinessProfile();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'present' | 'absent' | 'half' | 'leave'>('present');
  const [shiftHours, setShiftHours] = useState(8);
  const [overtimeHrs, setOvertimeHrs] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'att_' + Date.now()),
        karigar_id: karigar.id,
        business_id: profile?.id || 'local',
        attendance_date: date,
        log_date: date,
        status,
        shift_hours: Number(shiftHours),
        overtime_hrs: Number(overtimeHrs),
        notes: notes || 'Manual shift entry'
      };

      try {
        await fetch('/api/karigars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation: 'attendance', payload })
        });
      } catch (e: any) {
        console.warn('Attendance sync notice:', e);
      }

      toast.success(`Attendance marked as ${status.toUpperCase()} for ${date}`);
      onSaved(payload);
    } catch (err: any) {
      toast.error('Failed to log attendance', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-[#0C0F12] border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 bg-[#07090B] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="text-electric-blue" size={18} />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Mark Worker Attendance</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white cursor-pointer"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-sm outline-none focus:border-electric-blue" required />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-sm outline-none focus:border-electric-blue">
              <option value="present">Present (Full Day)</option>
              <option value="half">Half Day</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave / Holiday</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Shift Hours</label>
              <input type="number" min="0" max="24" step="0.5" value={shiftHours} onChange={e => setShiftHours(Number(e.target.value))} className="w-full bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-sm outline-none focus:border-electric-blue" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Overtime (Hrs)</label>
              <input type="number" min="0" max="24" step="0.5" value={overtimeHrs} onChange={e => setOvertimeHrs(Number(e.target.value))} className="w-full bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-sm outline-none focus:border-electric-blue" />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Notes / Remarks</label>
            <input type="text" placeholder="e.g. On-time check-in" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-sm outline-none focus:border-electric-blue" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-electric-blue text-black text-xs font-black uppercase tracking-widest hover:bg-cyan-300 transition-colors mt-2 cursor-pointer">
            {isSubmitting ? 'Saving...' : 'Record Attendance'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function LogProductionModal({
  karigar,
  onClose,
  onSaved
}: {
  karigar: any;
  onClose: () => void;
  onSaved: (log: any) => void;
}) {
  const { profile } = useBusinessProfile();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [skuName, setSkuName] = useState('Standard Stitching');
  const [units, setUnits] = useState(10);
  const [grade, setGrade] = useState('A');
  const [pieceRate, setPieceRate] = useState(karigar?.piece_rate || 50);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'prod_' + Date.now()),
        karigar_id: karigar.id,
        business_id: profile?.id || 'local',
        log_date: date,
        units_produced: Number(units),
        grade,
        piece_rate_used: Number(pieceRate),
        earnings: Number(units) * Number(pieceRate),
        notes: notes || 'Daily production log'
      };

      try {
        await fetch('/api/karigars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation: 'production', payload })
        });
      } catch (e: any) {
        console.warn('Production sync notice:', e);
      }

      toast.success(`Production logged: ${units} units (Grade ${grade})`);
      onSaved({
        ...payload,
        qty_produced: payload.units_produced,
        quality_grade: payload.grade,
        effective_earning: payload.earnings,
        skus: { name: skuName }
      });
    } catch (err: any) {
      toast.error('Failed to log production', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-[#0C0F12] border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 bg-[#07090B] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="text-electric-blue" size={18} />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Log Production Output</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white cursor-pointer"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-sm outline-none focus:border-electric-blue" required />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Article / SKU Name</label>
            <input type="text" value={skuName} onChange={e => setSkuName(e.target.value)} className="w-full bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-sm outline-none focus:border-electric-blue" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Units (Qty)</label>
              <input type="number" min="1" value={units} onChange={e => setUnits(Number(e.target.value))} className="w-full bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-sm outline-none focus:border-electric-blue" required />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Quality Grade</label>
              <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-sm outline-none focus:border-electric-blue">
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Piece Rate</label>
              <input type="number" min="0" step="0.5" value={pieceRate} onChange={e => setPieceRate(Number(e.target.value))} className="w-full bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-sm outline-none focus:border-electric-blue" />
            </div>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-sm flex items-center justify-between text-xs">
            <span className="text-gray-400 font-bold uppercase text-[10px]">Calculated Earnings:</span>
            <span className="font-mono font-bold text-emerald-400">{profile?.currency || 'PKR'} {(units * pieceRate).toLocaleString()}</span>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Notes / Batch Ref</label>
            <input type="text" placeholder="e.g. Batch #401" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-sm outline-none focus:border-electric-blue" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-electric-blue text-black text-xs font-black uppercase tracking-widest hover:bg-cyan-300 transition-colors mt-2 cursor-pointer">
            {isSubmitting ? 'Saving...' : 'Record Production'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
