'use client';

import { useEffect, useState } from 'react';
import { Shield, Check, Lock, Key, Video, Scale, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function LicenseInitializer() {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<'privacy' | 'keys' | 'surveillance' | 'disclaimer'>('privacy');

  useEffect(() => {
    // Check Terms Acceptance status from localStorage
    const isTermsAccepted = localStorage.getItem('noxis_terms_accepted') === 'true';
    setAccepted(isTermsAccepted);

    // Existing License check logic
    const checkLicense = async () => {
      const hasCookie = document.cookie.includes('noxis_license_active=true');
      if (!hasCookie) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 1500);
          const res = await fetch('/api/settings', { signal: controller.signal }).catch(() => null);
          clearTimeout(timeout);
          if (!res || !res.ok) return;
          
          const data = await res.json();
          const licenseKey = data.localConfig?.find((c: any) => c.key === 'license_key');
          
          if (licenseKey?.value) {
            document.cookie = `noxis_license_active=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;
            
            // If we're not on license or api, reload to apply middleware
            const path = window.location.pathname;
            if (path !== '/license' && !path.startsWith('/api')) {
              window.location.reload();
            }
          }
        } catch (err) {
          console.error('[License] Initialization failed:', err);
        }
      }
    };
    checkLicense();
  }, []);

  const handleAccept = () => {
    localStorage.setItem('noxis_terms_accepted', 'true');
    setAccepted(true);
  };

  // Prevent blocking access when the user is trying to read the full pages
  const isAgreementsPage = typeof window !== 'undefined' && 
    (window.location.pathname === '/terms' || window.location.pathname === '/privacy');

  if (accepted === null || accepted === true || isAgreementsPage) {
    return null;
  }

  const tabs = [
    {
      id: 'privacy',
      label: 'Data Privacy',
      icon: Lock,
      color: 'text-blue-400',
      title: 'Data Localization Guarantee',
      desc: 'Noxis operates on a strictly sandboxed, Local-First Architecture. Your customer registers, stock databases, and payroll records stay on your physical hard drive. We never upload, sync, or sell your private records.'
    },
    {
      id: 'keys',
      label: 'Local Custody',
      icon: Key,
      color: 'text-amber-400',
      title: 'Database Encryption Keys',
      desc: 'All passwords and encryption keys reside solely on your workstation. Omnora Labs does not maintain cloud backups and cannot recover lost security keys. Keeping secure physical database backups is your responsibility.'
    },
    {
      id: 'surveillance',
      label: 'AI Surveillance',
      icon: Video,
      color: 'text-rose-400',
      title: 'AI Sentinel Monitoring Regulations',
      desc: 'By activating local CCTV feeds and AI Sentinel perimeter scanning, you agree to comply with local labor regulations and employees privacy disclosure laws. Place cameras in compliance with regional regulations.'
    },
    {
      id: 'disclaimer',
      label: 'Disclaimer',
      icon: Scale,
      color: 'text-purple-400',
      title: 'Operational & Bookkeeping Aid',
      desc: 'Noxis provides bookkeeping assistance, wage logs, and stock registers. However, calculations are operational aids and should be reviewed by certified accounts before official tax or legal filings.'
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab)!;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] bg-[#06080D]/90 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-[#0B0F17] max-w-2xl w-full p-8 rounded-lg relative overflow-hidden flex flex-col max-h-[90vh] z-10 border border-white/10 shadow-2xl"
        >
          {/* Top Info Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white">
                  Noxis <span className="text-blue-400">Software Agreement</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Terms of Use & Offline Workstation Policy
                </p>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-xs font-mono font-medium">
              Verified Offline Node
            </div>
          </div>

          {/* Middle Body - Interactive Panel */}
          <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-[300px] overflow-hidden my-2">
            
            {/* Sidebar Tabs */}
            <div className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0 pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-white/10 pr-0 md:pr-4 no-scrollbar">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center space-x-3 px-3.5 py-2.5 rounded-md text-left transition-colors border shrink-0 text-xs font-semibold",
                      isActive
                        ? "bg-white/10 border-white/15 text-white"
                        : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <TabIcon size={15} className={cn(isActive ? "text-blue-400" : "text-slate-400")} />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Content Display */}
            <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-2 scrollbar-thin">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Policy Overview
                    </span>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <currentTab.icon size={16} className={currentTab.color} />
                      {currentTab.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {currentTab.desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Dynamic Bottom Helper */}
              <div className="mt-8 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Legal Documentation</span>
                  <div className="flex gap-2">
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      Terms of Service
                    </a>
                    <span>•</span>
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      Privacy Policy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions Consent Gate */}
          <div className="mt-6 pt-5 border-t border-white/10 space-y-4">
            
            {/* Standard Checkbox */}
            <label className="flex items-start space-x-3 cursor-pointer group select-none">
              <div className="mt-0.5 relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="sr-only"
                />
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  isChecked 
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white/5 border-white/20 group-hover:border-white/40"
                )}>
                  {isChecked && <Check size={11} strokeWidth={3} />}
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-slate-200 font-semibold group-hover:text-white transition-colors block">
                  I accept the terms and offline operation policy
                </span>
                <span className="text-[11px] text-slate-400 block leading-normal">
                  All transaction ledgers, inventory records, and Karigar payroll are stored locally on this machine.
                </span>
              </div>
            </label>

            {/* Modern Enterprise Action Button */}
            <button
              onClick={handleAccept}
              disabled={!isChecked}
              className={cn(
                "w-full py-3 px-5 text-xs font-semibold transition-colors flex items-center justify-center rounded-md font-sans shadow-sm",
                isChecked
                  ? "bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                  : "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
              )}
            >
              <span>Accept & Continue to Workspace</span>
              <ChevronRight size={15} className="ml-1.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

