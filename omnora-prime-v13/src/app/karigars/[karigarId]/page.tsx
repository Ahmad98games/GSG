"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Phone, CreditCard, Calendar, 
  Briefcase, DollarSign, Award, 
  CheckCircle2, AlertCircle, Clock,
  ArrowLeft, Edit3, Plus, Download,
  Filter, ChevronLeft, ChevronRight,
  TrendingUp, Activity, PieChart
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Decimal from "decimal.js";
import Image from "next/image";

// --- Components ---

const InfoRow = ({ label, value, icon: Icon }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-white/[0.03]">
    <div className="flex items-center space-x-3 text-gray-500">
      <Icon size={14} />
      <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
    </div>
    <span className="text-xs font-semibold text-white">{value || '—'}</span>
  </div>
);

const Badge = ({ children, variant = "default" }: any) => {
  const styles: any = {
    default: "bg-white/5 text-gray-400",
    emerald: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border border-red-500/20",
    blue: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    gold: "bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20"
  };
  return (
    <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px]", styles[variant])}>
      {children}
    </span>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center space-x-2 px-6 py-4 border-b-2 transition-all text-[10px] uppercase font-black tracking-widest whitespace-nowrap",
      active 
        ? "border-[#C5A059] text-white bg-white/5" 
        : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
    )}
  >
    <Icon size={14} />
    <span>{label}</span>
  </button>
);

// --- Page Component ---

export default function KarigarProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { fmt } = usePersona();
  const supabase = createClient();
  
  const karigarId = params.karigarId as string;
  const [activeTab, setActiveTab] = useState("production");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Queries
  const { data: karigar, isLoading: karigarLoading } = useQuery({
    queryKey: ['karigar', karigarId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('karigars')
        .select('*, grade:karigar_grades(grade_name)')
        .eq('id', karigarId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: productionLogs } = useQuery({
    queryKey: ['karigar_production', karigarId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('karigar_production_logs')
        .select('*')
        .eq('karigar_id', karigarId)
        .order('log_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!karigar
  });

  const { data: attendanceLogs } = useQuery({
    queryKey: ['karigar_attendance', karigarId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('karigar_id', karigarId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!karigar
  });

  const { data: advances } = useQuery({
    queryKey: ['karigar_advances', karigarId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('karigar_advances')
        .select('*')
        .eq('karigar_id', karigarId)
        .order('advance_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!karigar
  });

  const { data: payslips } = useQuery({
    queryKey: ['karigar_payslips', karigarId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_slips')
        .select('*, period:payroll_periods(period_label, period_start, period_end)')
        .eq('karigar_id', karigarId)
        .order('period_id', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!karigar
  });

  // Logic
  const tenure = useMemo(() => {
    if (!karigar?.joining_date) return "—";
    const join = new Date(karigar.joining_date);
    const now = new Date();
    let years = now.getFullYear() - join.getFullYear();
    let months = now.getMonth() - join.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} years ${months} months`;
  }, [karigar]);

  const productionByMonth = useMemo(() => {
    if (!productionLogs) return [];
    const groups: any = {};
    productionLogs.forEach((log: any) => {
      const monthYear = new Date(log.log_date).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) {
        groups[monthYear] = { month: monthYear, total: new Decimal(0), logs: [] };
      }
      groups[monthYear].total = groups[monthYear].total.plus(log.effective_earning || 0);
      groups[monthYear].logs.push(log);
    });
    return Object.values(groups);
  }, [productionLogs]);

  const advanceLedger = useMemo(() => {
    if (!advances) return [];
    let running = new Decimal(0);
    return [...advances].reverse().map((adv: any) => {
      running = running.plus(adv.amount);
      return { ...adv, balanceAfter: running.toNumber() };
    }).reverse();
  }, [advances]);

  const attendanceStats = useMemo(() => {
    if (!attendanceLogs) return { present: 0, absent: 0, halfDay: 0, leave: 0 };
    return {
      present: attendanceLogs.filter((l: any) => l.status === 'present').length,
      absent: attendanceLogs.filter((l: any) => l.status === 'absent').length,
      halfDay: attendanceLogs.filter((l: any) => l.status === 'half_day').length,
      leave: attendanceLogs.filter((l: any) => l.status === 'leave').length,
    };
  }, [attendanceLogs]);

  if (karigarLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Authenticating Worker Node...
    </div>
  );

  if (!karigar) return (
    <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center space-y-4">
      <AlertCircle className="text-red-500" size={48} />
      <h1 className="text-white uppercase font-black tracking-widest">Worker Profile Not Found</h1>
      <button onClick={() => router.back()} className="text-[10px] text-gray-500 hover:text-white uppercase font-black tracking-widest border border-white/10 px-6 py-2 transition-all">Back to Roster</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <button onClick={() => router.back()} className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mr-8 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Personnel Registry</span>
           </button>
           <h1 className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-400">Worker Profile: {karigar.karigar_code}</h1>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row gap-8">
           {/* LEFT PANEL (1/3) */}
           <aside className="w-full lg:w-[380px] space-y-8">
              <div className="bg-[#1A1D21] border border-white/5 p-8 flex flex-col items-center text-center">
                 <div className="w-32 h-32 rounded-full border-2 border-white/5 p-1 relative">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#25292E] flex items-center justify-center">
                       {karigar.photo_url ? (
                         <Image src={karigar.photo_url} alt={karigar.name} fill className="object-cover" />
                       ) : (
                         <span className="text-3xl font-black text-[#C5A059]">{karigar.name.split(' ').map((n: string) => n[0]).join('')}</span>
                       )}
                    </div>
                    <div className={cn(
                      "absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-[#1A1D21]",
                      karigar.status === 'active' ? 'bg-emerald-500' : 'bg-gray-600'
                    )} />
                 </div>

                 <h2 className="text-2xl font-bold text-white mt-6">{karigar.name}</h2>
                 <p className="text-[#C5A059] font-mono text-sm font-black tracking-widest mt-1 uppercase">{karigar.karigar_code}</p>
                 
                 <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Badge variant="blue">{karigar.skill_type}</Badge>
                    <Badge variant="gold">{karigar.grade?.grade_name || 'Standard'}</Badge>
                    <Badge variant={karigar.status === 'active' ? 'emerald' : 'default'}>{karigar.status}</Badge>
                 </div>

                 <div className="w-full mt-8 space-y-1">
                    <InfoRow label="Phone" value={karigar.phone} icon={Phone} />
                    <InfoRow label="CNIC" value={karigar.cnic} icon={CreditCard} />
                    <InfoRow label="Father Name" value={karigar.father_name} icon={User} />
                    <InfoRow label="Joined" value={karigar.joining_date} icon={Calendar} />
                    <InfoRow label="Tenure" value={tenure} icon={Clock} />
                    <InfoRow label="Wage Type" value={karigar.wage_type.replace('_', ' ')} icon={Briefcase} />
                    <InfoRow label="Pay Rate" value={fmt(karigar.piece_rate || karigar.daily_rate || karigar.monthly_salary)} icon={DollarSign} />
                 </div>

                 <div className="w-full mt-8 pt-8 border-t border-white/5 space-y-4">
                    <div className="flex flex-col items-center">
                       <p className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-2">Outstanding Advance</p>
                       <h3 className={cn(
                         "text-3xl font-mono font-black",
                         new Decimal(karigar.current_advance || 0).gt(0) ? "text-red-500" : "text-emerald-500"
                       )}>
                         {new Decimal(karigar.current_advance || 0).gt(0) ? fmt(karigar.current_advance) : "CLEAR"}
                       </h3>
                    </div>
                 </div>

                 <div className="w-full mt-8 grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 p-3 text-[10px] uppercase font-black tracking-widest border border-white/5 transition-all">
                       <Edit3 size={12} />
                       <span>Edit Profile</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 p-3 text-[10px] uppercase font-black tracking-widest border border-white/5 transition-all">
                       <Calendar size={12} />
                       <span>Attendance</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 p-3 text-[10px] uppercase font-black tracking-widest border border-white/5 transition-all">
                       <Plus size={12} />
                       <span>Advance</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 bg-emerald-500 hover:brightness-110 p-3 text-[10px] uppercase font-black tracking-widest text-black transition-all">
                       <Download size={12} />
                       <span>Payslip</span>
                    </button>
                 </div>
              </div>
           </aside>

           {/* RIGHT PANEL (2/3) */}
           <div className="flex-1 space-y-8">
              <div className="bg-[#1A1D21] border border-white/5 flex flex-col h-full min-h-[700px]">
                 <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
                    <TabButton active={activeTab === "production"} onClick={() => setActiveTab("production")} icon={Activity} label="Production Log" />
                    <TabButton active={activeTab === "attendance"} onClick={() => setActiveTab("attendance")} icon={Calendar} label="Attendance" />
                    <TabButton active={activeTab === "advances"} onClick={() => setActiveTab("advances")} icon={DollarSign} label="Advances (Peshgi)" />
                    <TabButton active={activeTab === "payslips"} onClick={() => setActiveTab("payslips")} icon={Download} label="Payslips" />
                 </div>

                 <div className="flex-1 p-8">
                    <AnimatePresence mode="wait">
                       {activeTab === "production" && (
                         <motion.div key="prod" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                            {productionByMonth.length > 0 ? productionByMonth.map((group: any) => (
                              <div key={group.month} className="space-y-4">
                                 <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{group.month}</h3>
                                    <div className="flex items-center space-x-2">
                                       <span className="text-[10px] text-gray-600 uppercase font-bold">Total Earnings:</span>
                                       <span className="text-sm font-mono font-black text-[#C5A059]">{fmt(group.total)}</span>
                                    </div>
                                 </div>
                                 <div className="overflow-hidden border border-white/5 rounded-sm">
                                    <table className="w-full text-left">
                                       <thead className="bg-white/5 text-[9px] uppercase font-black text-gray-600 tracking-widest">
                                          <tr>
                                             <th className="p-4">Date</th>
                                             <th className="p-4">SKU / Batch</th>
                                             <th className="p-4 text-right">Qty</th>
                                             <th className="p-4">Grade</th>
                                             <th className="p-4 text-right">Earnings</th>
                                          </tr>
                                       </thead>
                                       <tbody className="text-[11px]">
                                          {group.logs.map((log: any) => (
                                            <tr key={log.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                                               <td className="p-4 text-gray-400 font-mono">{log.log_date}</td>
                                               <td className="p-4 font-semibold">{log.sku_id ? 'SKU-001' : 'BATCH-2025'}</td>
                                               <td className="p-4 text-right font-bold text-white">{log.qty_produced} {log.unit}</td>
                                               <td className="p-4"><Badge variant={log.quality_grade === 'A' ? 'emerald' : 'amber'}>{log.quality_grade}</Badge></td>
                                               <td className="p-4 text-right font-mono font-bold text-[#C5A059]">{fmt(log.effective_earning)}</td>
                                            </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                 </div>
                              </div>
                            )) : (
                              <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                                 <TrendingUp size={48} strokeWidth={1} className="opacity-20 mb-4" />
                                 <p className="text-[10px] uppercase font-black tracking-[0.3em]">No production logs recorded</p>
                              </div>
                            )}
                         </motion.div>
                       )}

                       {activeTab === "attendance" && (
                         <motion.div key="att" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            <div className="flex items-center justify-between bg-white/[0.02] p-4 border border-white/5 rounded-sm">
                               <div className="flex items-center space-x-4">
                                  <button onClick={() => {
                                    const d = new Date(currentMonth);
                                    d.setMonth(d.getMonth() - 1);
                                    setCurrentMonth(d);
                                  }} className="p-2 hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                                     <ChevronLeft size={16} />
                                  </button>
                                  <h3 className="text-xs font-black uppercase tracking-widest text-white">
                                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                  </h3>
                                  <button onClick={() => {
                                    const d = new Date(currentMonth);
                                    d.setMonth(d.getMonth() + 1);
                                    setCurrentMonth(d);
                                  }} className="p-2 hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                                     <ChevronRight size={16} />
                                  </button>
                               </div>
                               <div className="flex items-center space-x-6">
                                  <div className="flex flex-col items-center">
                                     <span className="text-[9px] uppercase font-black text-gray-600 mb-1">Present</span>
                                     <span className="text-sm font-black text-emerald-500">{attendanceStats.present}</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                     <span className="text-[9px] uppercase font-black text-gray-600 mb-1">Absent</span>
                                     <span className="text-sm font-black text-red-500">{attendanceStats.absent}</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                     <span className="text-[9px] uppercase font-black text-gray-600 mb-1">Leave</span>
                                     <span className="text-sm font-black text-blue-500">{attendanceStats.leave}</span>
                                  </div>
                               </div>
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                               {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                 <div key={day} className="text-center text-[9px] uppercase font-black text-gray-700 py-2">{day}</div>
                               ))}
                               {/* Mock calendar grid */}
                               {Array.from({ length: 31 }, (_, i) => {
                                 const day = i + 1;
                                 const status = day % 7 === 0 ? 'absent' : day % 12 === 0 ? 'leave' : 'present';
                                 return (
                                   <div key={i} className="aspect-square bg-[#25292E] border border-white/5 flex flex-col items-center justify-between p-2 rounded-sm group hover:border-[#C5A059]/30 transition-all cursor-pointer">
                                      <span className="text-[10px] font-mono font-bold text-gray-500 group-hover:text-white">{day}</span>
                                      <div className={cn(
                                        "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                                        status === 'present' ? 'bg-emerald-500' : 
                                        status === 'absent' ? 'bg-red-500' : 'bg-blue-500'
                                      )} />
                                   </div>
                                 );
                               })}
                            </div>
                         </motion.div>
                       )}

                       {activeTab === "advances" && (
                         <motion.div key="adv" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="flex items-center justify-between p-8 bg-[#C5A059]/5 border border-[#C5A059]/10 rounded-sm">
                               <div className="flex items-center space-x-4">
                                  <div className="p-3 bg-[#C5A059]/10 text-[#C5A059] rounded-sm">
                                     <TrendingUp size={24} />
                                  </div>
                                  <div>
                                     <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Active Peshgi Liability</p>
                                     <h3 className="text-2xl font-mono font-black text-white">{fmt(karigar.current_advance || 0)}</h3>
                                  </div>
                               </div>
                               <button className="flex items-center space-x-2 bg-[#C5A059] hover:brightness-110 px-6 py-3 text-[10px] uppercase font-black tracking-widest text-black transition-all">
                                  <Plus size={14} />
                                  <span>Give New Advance</span>
                               </button>
                            </div>

                            <div className="overflow-hidden border border-white/5 rounded-sm">
                               <table className="w-full text-left">
                                  <thead className="bg-white/5 text-[9px] uppercase font-black text-gray-600 tracking-widest">
                                     <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Reason</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Balance After</th>
                                     </tr>
                                  </thead>
                                  <tbody className="text-[11px]">
                                     {advanceLedger.map((adv: any) => (
                                       <tr key={adv.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                                          <td className="p-4 text-gray-400 font-mono">{adv.advance_date}</td>
                                          <td className="p-4 font-bold text-white">{fmt(adv.amount)}</td>
                                          <td className="p-4 text-gray-500">{adv.reason || 'Personal / General'}</td>
                                          <td className="p-4"><Badge variant={adv.status === 'settled' ? 'emerald' : 'amber'}>{adv.status}</Badge></td>
                                          <td className="p-4 text-right font-mono font-bold text-red-500">{fmt(adv.balanceAfter)}</td>
                                       </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </motion.div>
                       )}

                       {activeTab === "payslips" && (
                         <motion.div key="slips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            {payslips.length > 0 ? (
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {payslips.map((slip: any) => (
                                    <div key={slip.id} className="bg-white/[0.02] border border-white/5 p-6 hover:border-white/10 transition-all group relative">
                                       <div className="flex justify-between items-start mb-6">
                                          <div>
                                             <h4 className="text-sm font-bold text-white">{slip.period?.period_label}</h4>
                                             <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest">{slip.period?.period_start} — {slip.period?.period_end}</p>
                                          </div>
                                          <Badge variant={slip.is_finalized ? 'emerald' : 'amber'}>{slip.is_finalized ? 'Finalized' : 'Draft'}</Badge>
                                       </div>
                                       
                                       <div className="grid grid-cols-2 gap-y-4 border-t border-white/[0.03] pt-4">
                                          <div>
                                             <p className="text-[9px] uppercase font-black text-gray-600">Gross</p>
                                             <p className="text-sm font-mono font-bold text-white">{fmt(slip.gross_earning)}</p>
                                          </div>
                                          <div className="text-right">
                                             <p className="text-[9px] uppercase font-black text-gray-600">Deductions</p>
                                             <p className="text-sm font-mono font-bold text-red-500">{fmt(slip.total_deductions)}</p>
                                          </div>
                                          <div className="col-span-2 pt-2 border-t border-dashed border-white/5 flex justify-between items-end">
                                             <div>
                                                <p className="text-[9px] uppercase font-black text-gray-600">Net Payable</p>
                                                <p className="text-xl font-mono font-black text-emerald-500">{fmt(slip.net_payable)}</p>
                                             </div>
                                             <button className="p-2 bg-white/5 hover:bg-[#C5A059] hover:text-black transition-all rounded-sm">
                                                <Download size={16} />
                                             </button>
                                          </div>
                                       </div>
                                    </div>
                                  ))}
                               </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                                 <CreditCard size={48} strokeWidth={1} className="opacity-20 mb-4" />
                                 <p className="text-[10px] uppercase font-black tracking-[0.3em]">No payslips generated yet</p>
                              </div>
                            )}
                         </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
