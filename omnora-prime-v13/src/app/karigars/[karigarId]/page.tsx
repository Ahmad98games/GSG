'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { usePersona } from '@/hooks/usePersona';
import { 
  Users, ChevronLeft, ShieldCheck, Sparkles, CheckCircle2, 
  HelpCircle, Calendar, Plus, Trash2, Share2, Eye, EyeOff, 
  Clock, Award, BarChart3, AlertCircle, Loader2, DollarSign, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function KarigarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile, isLoaded } = useBusinessProfile();
  const { term, workerTerm } = usePersona();
  const supabase = createClient();
  
  const karigarId = params.karigarId as string;
  
  const [karigar, setKarigar] = useState<any>(null);
  const [identity, setIdentity] = useState<any>(null);
  const [attendanceRate, setAttendanceRate] = useState<number>(100);
  const [productionStats, setProductionStats] = useState<any>({ avg_units_per_day: 0, avg_grade_a_pct: 0 });
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'internal'>();
  const [skillInput, setSkillInput] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  
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
      
      // 3. Fetch RPC Stats (Attendance & Production)
      const [attStats, prodStats] = await Promise.all([
        supabase.rpc('get_karigar_attendance_rate', {
          p_karigar_id: karigarId,
          p_days: 90
        }),
        supabase.rpc('get_karigar_production_stats', {
          p_karigar_id: karigarId,
          p_days: 90
        })
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
      }
    } catch (e) {
      console.error(e);
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
      }
    } catch (e) {
      console.error(e);
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
      }
    } catch (e) {
      console.error(e);
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
      }
    } catch (e) {
      console.error(e);
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
                <img src={karigar.photo_url} alt={karigar.name} className="w-full h-full object-cover" />
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
        <div className="flex border-b border-white/5 gap-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-electric-blue text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Work Profile
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
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
          {activeTab === 'profile' ? (
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
                        Mark this worker as "Open to Work" to showcase their verified credentials to other factories seeking talent.
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
          ) : (
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

      </main>
    </div>
  );
}
