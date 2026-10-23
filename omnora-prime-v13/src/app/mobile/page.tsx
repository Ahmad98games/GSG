'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  ShoppingCart, 
  QrCode, 
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
  ScanLine
} from 'lucide-react';

interface HubInfo {
  ip: string;
  localIp: string;
  port: number;
  hostname: string;
  version: string;
}

export default function MobileTerminalPage() {
  const [hubInfo, setHubInfo] = useState<HubInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);

  useEffect(() => {
    async function checkHub() {
      const start = performance.now();
      try {
        const res = await fetch('/api/hub/info');
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
    }
    checkHub();
    const interval = setInterval(checkHub, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-emerald-500/30">
      {/* Mobile Header */}
      <header className="p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-wider uppercase">Noxis Mobile Terminal</h1>
              <p className="text-[10px] text-slate-400">Shop Floor & Field Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-slate-300 font-bold">{connected ? 'Host Linked' : 'Connecting...'}</span>
            {pingMs !== null && (
              <span className="text-emerald-400 text-[9px]">({pingMs}ms)</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Touch Actions */}
      <main className="p-4 space-y-4 flex-1 max-w-lg mx-auto w-full">
        {/* Status Callout */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/20 text-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} /> Local Wi-Fi Mesh Connected
            </p>
            <p className="text-slate-300 text-xs">
              Host: <strong className="text-white">{hubInfo?.ip || '192.168.0.103'}:3000</strong>
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            Offline Safe
          </span>
        </div>

        {/* Action 1: Mobile POS Terminal */}
        <Link 
          href="/pos"
          className="block p-4 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-slate-900 border border-emerald-500/30 active:scale-[0.98] transition-all shadow-lg shadow-emerald-950/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
                <ShoppingCart size={22} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Mobile POS Cash Counter</h3>
                <p className="text-xs text-slate-400 mt-0.5">Take orders, bill customers, print receipts</p>
              </div>
            </div>
            <ChevronRight className="text-emerald-400" size={20} />
          </div>
        </Link>

        {/* Action 2: SKU & Price Checker */}
        <Link 
          href="/inventory"
          className="block p-4 rounded-2xl bg-slate-900/80 border border-slate-800 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                <ScanLine size={22} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Barcode & Stock Lookup</h3>
                <p className="text-xs text-slate-400 mt-0.5">Check real-time stock levels & wholesale prices</p>
              </div>
            </div>
            <ChevronRight className="text-slate-500" size={20} />
          </div>
        </Link>

        {/* Action 3: Karigar Daily Yield Entry */}
        <Link 
          href="/production/daily-log"
          className="block p-4 rounded-2xl bg-slate-900/80 border border-slate-800 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                <Users size={22} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Karigar Production Log</h3>
                <p className="text-xs text-slate-400 mt-0.5">Log completed pieces & artisan attendance</p>
              </div>
            </div>
            <ChevronRight className="text-slate-500" size={20} />
          </div>
        </Link>

        {/* Action 4: Khata Payment Collection */}
        <Link 
          href="/khata"
          className="block p-4 rounded-2xl bg-slate-900/80 border border-slate-800 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                <BookOpen size={22} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Khata Payment Collection</h3>
                <p className="text-xs text-slate-400 mt-0.5">Record customer cash receipts & ledger balances</p>
              </div>
            </div>
            <ChevronRight className="text-slate-500" size={20} />
          </div>
        </Link>

        {/* Switch to Full Workstation Desktop View */}
        <div className="pt-2">
          <Link
            href="/workstation"
            className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-850 active:scale-[0.98] transition-all"
          >
            <Laptop size={14} className="text-blue-400" />
            <span>Switch to Full PC Workstation Mode</span>
          </Link>
        </div>
      </main>

      {/* Mobile Footer */}
      <footer className="p-4 bg-slate-950 border-t border-slate-900 text-center text-[11px] text-slate-500">
        <p>Noxis Hub v14 · Connected to <strong className="text-slate-400">{hubInfo?.hostname || 'Host PC'}</strong></p>
        <p className="text-[10px] text-slate-600 mt-0.5">All updates save instantly to the master host database</p>
      </footer>
    </div>
  );
}
