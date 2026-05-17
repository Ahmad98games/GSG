"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Activity, CheckCircle2, AlertTriangle, XCircle, 
  RefreshCw, Database, Cloud, Network, ShieldCheck,
  FileText, Cpu, Package, ArrowLeft
} from "lucide-react";

import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DiagnosticResult {
  status: 'online' | 'warning' | 'offline' | 'loading';
  detail: string | any[];
}

interface DiagnosticState {
  supabase: DiagnosticResult;
  sqlite: DiagnosticResult;
  tcp: DiagnosticResult;
  sync: DiagnosticResult;
  env: DiagnosticResult;
}

export default function DiagnosticsPage() {
  const { isCollapsed } = useSidebarState();
  const [data, setData] = useState<DiagnosticState | null>(null);
  const [loading, setLoading] = useState(true);

  const runChecks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/diagnostics');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Diagnostics failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runChecks();
  }, []);

  

  return (
    <div className="min-h-screen bg-black text-slate-200 font-inter flex">
      
      
      <main className={cn( "flex-1 transition-all duration-300 min-h-screen flex flex-col")}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-40">
           <Link href="/settings" className="mr-6 p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all">
              <ArrowLeft size={18} />
           </Link>
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-electric-blue/10 text-electric-blue rounded-sm">
                 <Activity size={18} />
              </div>
              <div>
                 <h1 className="text-sm font-black uppercase tracking-widest text-white">System Diagnostics</h1>
                 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Infrastructure health & heartbeat monitor</p>
              </div>
           </div>
           
           <button 
             onClick={runChecks}
             disabled={loading}
             className="ml-auto flex items-center space-x-2 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] uppercase tracking-widest font-black transition-all disabled:opacity-50"
           >
              <RefreshCw size={14} className={cn(loading && "animate-spin")} />
              <span>Refresh Status</span>
           </button>
        </header>

        <div className="flex-1 p-8 max-w-[1000px] mx-auto w-full space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <CheckCard 
                icon={Cloud} 
                title="Cloud Handshake" 
                subtitle="Supabase Integration"
                status={data?.supabase.status || 'loading'} 
                detail={data?.supabase.detail as string} 
              />
              <CheckCard 
                icon={Database} 
                title="Local Storage" 
                subtitle="SQLite Registry"
                status={data?.sqlite.status || 'loading'} 
                detail={data?.sqlite.detail as string} 
              />
              <CheckCard 
                icon={Network} 
                title="Mesh Network" 
                subtitle="TCP Hub Status"
                status={data?.tcp.status || 'loading'} 
                detail={data?.tcp.detail as string} 
              />
              <CheckCard 
                icon={Package} 
                title="Synchronization" 
                subtitle="Cloud Data Queue"
                status={data?.sync.status || 'loading'} 
                detail={data?.sync.detail as string} 
              />

           </div>

           <div className="bg-surface border border-white/5 p-8 rounded-sm space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-[#C5A059]" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Security & Environment</h3>
                 </div>
                 <StatusBadge status={data?.env.status || 'loading'} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {(data?.env.detail as any[])?.map((env: any) => (
                    <div key={env.key} className="flex items-center justify-between p-4 bg-black/50 border border-white/5 rounded-sm">
                       <span className="text-[10px] font-mono text-slate-500">{env.key}</span>
                       <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded",
                          env.status === 'SET' ? "bg-emerald/10 text-emerald" : "bg-red-500/10 text-red-500"
                       )}>{env.status}</span>
                    </div>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 bg-white/5 border border-white/5 rounded-sm text-center">
                 <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Build Version</p>
                 <p className="text-sm font-black text-white">Noxis Hub v13.0</p>
              </div>
              <div className="p-6 bg-white/5 border border-white/5 rounded-sm text-center">
                 <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Runtime</p>
                 <p className="text-sm font-black text-white">Next.js 16.2.4</p>
              </div>
              <div className="p-6 bg-white/5 border border-white/5 rounded-sm text-center">
                 <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Platform</p>
                 <p className="text-sm font-black text-white">Production Mode</p>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

function CheckCard({ icon: Icon, title, subtitle, status, detail }: any) {
  return (
    <div className="bg-surface border border-white/5 p-6 rounded-sm flex items-start gap-5 group hover:border-white/10 transition-all">
       <div className={cn(
          "p-4 rounded-sm transition-colors",
          status === 'online' ? "bg-emerald/5 text-emerald" :
          status === 'warning' ? "bg-amber-500/5 text-amber-500" :
          status === 'offline' ? "bg-red-500/5 text-red-500" : "bg-white/5 text-slate-700"
       )}>
          <Icon size={24} />
       </div>
       <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{title}</h4>
             <StatusBadge status={status} />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{subtitle}</p>
          <p className="text-[10px] text-slate-400 font-mono mt-3">{status === 'loading' ? 'Executing probe...' : detail}</p>
       </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
   if (status === 'loading') return <div className="w-2 h-2 rounded-full bg-slate-700 animate-pulse" />;
   if (status === 'online') return (
     <div className="flex items-center gap-1.5 text-emerald text-[8px] font-black uppercase tracking-widest">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald" />
        Operational
     </div>
   );
   if (status === 'warning') return (
     <div className="flex items-center gap-1.5 text-amber-500 text-[8px] font-black uppercase tracking-widest">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Degraded
     </div>
   );
   return (
     <div className="flex items-center gap-1.5 text-red-500 text-[8px] font-black uppercase tracking-widest">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Offline
     </div>
   );
}
