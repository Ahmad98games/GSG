'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  ShoppingCart, 
  BookOpen, 
  Package, 
  Users, 
  Wifi, 
  Clock, 
  CheckCircle2, 
  Laptop, 
  ChevronRight,
  ShieldCheck,
  Search,
  ScanLine,
  RefreshCw,
  Calculator,
  Layers,
  ArrowUpRight,
  Cpu,
  Activity
} from 'lucide-react';
import { useWorkstationHeartbeat } from '@/hooks/useWorkstationHeartbeat';

interface HubInfo {
  ip: string;
  localIp: string;
  port: number;
  hostname: string;
  version: string;
}

export default function MobileTerminalPage() {
  // Automatically register and maintain live heartbeat for this mobile node
  useWorkstationHeartbeat();

  const [hubInfo, setHubInfo] = useState<HubInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [syncing, setSyncing] = useState(false);
  const [nodeId, setNodeId] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('noxis_workstation_node_id') || 'mobile-node';
      setNodeId(stored.slice(0, 14));
    }
  }, []);

  const checkHub = useCallback(async () => {
    const start = performance.now();
    try {
      const res = await fetch('/api/hub/info', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setHubInfo(data);
        setConnected(true);
        setPingMs(Math.round(performance.now() - start));
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    checkHub();
    const interval = setInterval(checkHub, 8000);
    return () => clearInterval(interval);
  }, [checkHub]);

  const handleManualSync = async () => {
    setSyncing(true);
    await checkHub();
    try {
      await fetch('/api/hub/devices', { cache: 'no-store' });
    } catch {}
    setTimeout(() => {
      setSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans flex flex-col justify-between selection:bg-emerald-500/30">
      {/* Top Industrial Header */}
      <header className="p-3.5 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Smartphone size={19} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-white tracking-wider uppercase">NOXIS MOBILE</h1>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                  HUB v{hubInfo?.version || '14.0.18'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">
                Node: {nodeId || 'Mobile Terminal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 active:scale-95 transition-all"
              title="Force Sync with Master PC"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin text-emerald-400' : ''} />
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-500'}`} />
              <span className="text-slate-300 font-bold text-[10px]">{connected ? 'LINKED' : 'OFFLINE'}</span>
              {pingMs !== null && connected && (
                <span className="text-emerald-400 text-[9px] font-semibold">{pingMs}ms</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Touch Actions */}
      <main className="p-4 space-y-3.5 flex-1 max-w-lg mx-auto w-full">
        {/* Host Connection Telemetry Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0E1522] to-slate-900/90 border border-slate-800/90 text-xs shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Zero-Latency Local Mesh
                </span>
              </div>
              <p className="text-slate-300 text-xs font-medium">
                Master Host: <strong className="text-white font-mono">{hubInfo?.ip || '127.0.0.1'}:{hubInfo?.port || 3000}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                SQLCipher WAL
              </span>
              <p className="text-[9px] text-slate-500 font-mono mt-1">Sync: {lastSyncTime}</p>
            </div>
          </div>
        </div>

        {/* Primary Action 1: Mobile POS Terminal */}
        <Link 
          href="/pos"
          className="group block p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-[#0A121A] border border-emerald-500/30 hover:border-emerald-500/50 active:scale-[0.98] transition-all shadow-lg shadow-emerald-950/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <ShoppingCart size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base tracking-tight">Mobile POS Counter</h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">FAST</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Quick order taking, instant invoice & receipt printing</p>
              </div>
            </div>
            <ArrowUpRight className="text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" size={20} />
          </div>
        </Link>

        {/* Action 2: Barcode Stock Lookup */}
        <Link 
          href="/inventory"
          className="group block p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <ScanLine size={22} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base tracking-tight">Barcode & Stock Lookup</h3>
                <p className="text-xs text-slate-400 mt-0.5">Instant fabric roll scan, live warehouse inventory & rates</p>
              </div>
            </div>
            <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" size={20} />
          </div>
        </Link>

        {/* Action 3: Karigar Daily Yield Entry */}
        <Link 
          href="/production/daily-log"
          className="group block p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Users size={22} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base tracking-tight">Karigar Yield & Attendance</h3>
                <p className="text-xs text-slate-400 mt-0.5">Log finished artisan piece rates & daily workshop attendance</p>
              </div>
            </div>
            <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" size={20} />
          </div>
        </Link>

        {/* Action 4: Khata Payment Collection */}
        <Link 
          href="/khata"
          className="group block p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <BookOpen size={22} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base tracking-tight">Khata Ledger & Collection</h3>
                <p className="text-xs text-slate-400 mt-0.5">Collect party payments, verify balance & update ledgers</p>
              </div>
            </div>
            <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" size={20} />
          </div>
        </Link>

        {/* Action 5: Industrial Calculators */}
        <Link 
          href="/calculators"
          className="group block p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Calculator size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base tracking-tight">Industrial Calculators</h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">PRO</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Fabric consumption, GSM calculation & costing breakdown</p>
              </div>
            </div>
            <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" size={20} />
          </div>
        </Link>

        {/* Action 6: Production Batches */}
        <Link 
          href="/production/batches"
          className="group block p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Layers size={22} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base tracking-tight">Active Production Batches</h3>
                <p className="text-xs text-slate-400 mt-0.5">Monitor cutting, stitching, washing & finishing stages</p>
              </div>
            </div>
            <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" size={20} />
          </div>
        </Link>

        {/* Switch to Full Workstation Desktop View */}
        <div className="pt-2">
          <Link
            href="/workstation"
            className="w-full py-3 px-4 rounded-xl bg-[#0D121D] border border-slate-700/80 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800/80 active:scale-[0.98] transition-all shadow-sm"
          >
            <Laptop size={15} className="text-blue-400" />
            <span>Switch to Full Workstation Dashboard</span>
          </Link>
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="p-4 bg-[#080B11] border-t border-slate-900 text-center text-[11px] text-slate-500">
        <p className="font-medium text-slate-400">
          Noxis Hub v{hubInfo?.version || '14.0.18'} · Host: <strong className="text-slate-200">{hubInfo?.hostname || 'Master PC'}</strong>
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">Encrypted SQLite WAL replication with atomic auto-commit</p>
      </footer>
    </div>
  );
}
