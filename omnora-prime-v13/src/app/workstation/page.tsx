'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Monitor, 
  ShoppingCart, 
  FileText, 
  BookOpen, 
  Package, 
  Factory, 
  BarChart3, 
  ShieldCheck, 
  Wifi, 
  Clock, 
  ChevronRight, 
  ExternalLink,
  Laptop,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface HubInfo {
  ip: string;
  localIp: string;
  port: number;
  hostname: string;
  version: string;
}

export default function WorkstationPage() {
  const [hubInfo, setHubInfo] = useState<HubInfo | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function checkHost() {
      const start = performance.now();
      try {
        const res = await fetch('/api/hub/info');
        if (res.ok) {
          const data = await res.json();
          setHubInfo(data);
          setLatencyMs(Math.round(performance.now() - start));
        }
      } catch (e) {
        console.error('Host connection error', e);
      }
    }
    checkHost();
    const interval = setInterval(checkHost, 8000);
    return () => clearInterval(interval);
  }, []);

  const workstationModules = [
    {
      title: 'POS Cash Terminal',
      description: 'High-speed retail & wholesale cash checkout, thermal slip printing & instant credit billing.',
      href: '/pos',
      icon: ShoppingCart,
      color: 'emerald',
      badge: 'F2 / Hotkey Ready',
      highlight: true
    },
    {
      title: 'Sales & Tax Invoices',
      description: 'Create GST/VAT sales invoices, handle customer returns, and print proformas.',
      href: '/invoices',
      icon: FileText,
      color: 'blue',
      badge: 'Billing Desk'
    },
    {
      title: 'Wholesale Khata Ledger',
      description: 'Double-entry customer & supplier debit/credit records, payment receipts & statements.',
      href: '/khata',
      icon: BookOpen,
      color: 'purple',
      badge: 'Accounts'
    },
    {
      title: 'Inventory & Stock Control',
      description: 'Real-time SKU lookup, inward stock adjustments, batch tracking & low-stock alerts.',
      href: '/inventory',
      icon: Package,
      color: 'amber',
      badge: 'Warehouse'
    },
    {
      title: 'Production & Karigar Floor',
      description: 'Piece-rate production logging, artisan attendance, job batches & yield tracking.',
      href: '/production',
      icon: Factory,
      color: 'cyan',
      badge: 'Workshop'
    },
    {
      title: 'Daybook & Daily Cash Reports',
      description: 'Review today’s sales register, cash drawer reconciliation, and Roznamcha entries.',
      href: '/reports',
      icon: BarChart3,
      color: 'rose',
      badge: 'Audit & Cash'
    }
  ];

  return (
    <div className="min-h-screen bg-[#040608] text-slate-200 font-mono flex flex-col selection:bg-emerald-500/30">
      {/* Top Industrial App Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-blue-500/30 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">Local Area Network Workstation</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-xl font-black text-white tracking-wider uppercase flex items-center gap-2">
                Noxis Workstation Node
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Host Link Pill */}
            <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
              <Wifi size={13} className="text-emerald-400" />
              <span className="text-slate-400">Host:</span>
              <span className="text-slate-200 font-bold">{hubInfo?.ip ? `${hubInfo.ip}:${(hubInfo as any)?.webPort || 3000}` : '192.168.0.103:3000'}</span>
              {latencyMs !== null && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20">
                  {latencyMs}ms
                </span>
              )}
            </div>

            {/* Time */}
            <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-300">
              <Clock size={13} className="text-slate-400" />
              <span>{currentTime}</span>
            </div>

            {/* Full ERP Switch */}
            <Link 
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs shadow-lg shadow-blue-600/20"
            >
              <span>Full ERP Hub</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-6 md:p-10 flex-1 flex flex-col justify-between">
        <div>
          {/* Welcome & Shift Banner */}
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-slate-950 border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Workstation Operational
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">Zero Cloud Latency · Local SQLite Sync</span>
              </div>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                This workstation is connected directly to the primary Noxis Hub node over office Wi-Fi. 
                All transactions, invoices, and stock movements are saved securely onto the master node.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link 
                href="/pos"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
              >
                <ShoppingCart size={15} />
                <span>Launch POS Terminal</span>
              </Link>
            </div>
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workstationModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.title}
                  href={mod.href}
                  className={`group relative p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between bg-slate-900/40 hover:bg-slate-900/70 ${
                    mod.highlight 
                      ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.08)]' 
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                        mod.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        mod.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        mod.color === 'purple' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                        mod.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        mod.color === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                        'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        <Icon size={22} className="group-hover:scale-110 transition-transform duration-200" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
                        {mod.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                      <span>{mod.title}</span>
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-slate-300">
                    <span>Open Module</span>
                    <ExternalLink size={12} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Hardware Info */}
        <footer className="mt-12 pt-6 border-t border-slate-900 text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Monitor size={14} className="text-slate-400" />
            <span>Secondary Workstation Node · Up to 15 Workstations per LAN Mesh</span>
          </div>
          <div>
            <span>Noxis Industrial Engine · Host Node: <strong className="text-slate-300">{hubInfo?.hostname || 'Host PC'}</strong></span>
          </div>
        </footer>
      </main>
    </div>
  );
}
