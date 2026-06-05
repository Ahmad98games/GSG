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
          const res = await fetch('/api/settings');
          if (!res.ok) return;
          
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
      <div className="fixed inset-0 z-[9999] bg-[#07080A] flex items-center justify-center p-4 holographic-grid">
        
        {/* Animated Cyber Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7C3AED]/10 rounded-full blur-[140px] animate-float-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00E5FF]/5 rounded-full blur-[140px] animate-float-medium" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-panel max-w-2xl w-full p-8 rounded-sm relative overflow-hidden flex flex-col max-h-[90vh] z-10 border border-white/[0.08]"
        >
          {/* Hardware-accelerated Holographic Laser Scanline */}
          <div className="laser-scanner-sweep" />

          {/* Top Info Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-sm bg-white/[0.03] border border-white/10 flex items-center justify-center text-blue-400">
                <Shield size={20} className="animate-glow-pulse" />
              </div>
              <div>
                <h2 className="text-md font-black tracking-tight text-white uppercase italic">
                  Noxis <span className="text-[#C5A059]">Console Consent</span>
                </h2>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono font-bold">
                  System Protocol Verification • v13.0
                </p>
              </div>
            </div>
            <div className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-sm text-blue-400 text-[8px] font-mono tracking-widest uppercase font-bold">
              Secure Local Node
            </div>
          </div>

          {/* Middle Body - Interactive Console Panel */}
          <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-[300px] overflow-hidden my-2">
            
            {/* Sidebar Tabs */}
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible shrink-0 pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-white/[0.05] pr-0 md:pr-4 no-scrollbar">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-sm text-left transition-all border shrink-0 text-xs font-bold uppercase tracking-wider font-mono",
                      isActive
                        ? "bg-white/5 border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]"
                        : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
                    )}
                  >
                    <TabIcon size={14} className={cn(isActive ? tab.color : "text-gray-500")} />
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
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block">
                      Section Highlight
                    </span>
                    <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                      <currentTab.icon size={16} className={currentTab.color} />
                      {currentTab.title}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    {currentTab.desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Dynamic Bottom Helper */}
              <div className="mt-8 pt-4 border-t border-white/[0.04]">
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono font-bold uppercase">
                  <span>Scroll for legal terms</span>
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
          <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-4">
            
            {/* Custom Glowing Checkbox Switch */}
            <label className="flex items-start space-x-3.5 cursor-pointer group select-none">
              <div className="mt-0.5 relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="sr-only"
                />
                {/* Glowing switch circle */}
                <div className={cn(
                  "w-5 h-5 rounded-sm border flex items-center justify-center transition-all duration-300 relative",
                  isChecked 
                    ? "bg-white border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                    : "bg-white/5 border-white/10 group-hover:border-white/25"
                )}>
                  {isChecked && <Check size={13} strokeWidth={3.5} />}
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-gray-400 font-bold group-hover:text-gray-300 transition-colors uppercase tracking-wide block">
                  Confirm Agreement
                </span>
                <span className="text-[10px] text-gray-600 block leading-tight">
                  I acknowledge I have read and agree to all sandbox localization guidelines and operational policies.
                </span>
              </div>
            </label>

            {/* Glowing neon action button */}
            <button
              onClick={handleAccept}
              disabled={!isChecked}
              className={cn(
                "w-full py-4 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center border font-mono rounded-sm",
                isChecked
                  ? "bg-white text-black border-white hover:bg-gray-150 cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.15)] active:scale-[0.99]"
                  : "bg-white/[0.02] text-gray-700 border-white/[0.03] cursor-not-allowed"
              )}
            >
              Verify Consent & Initialize Workspace <ChevronRight size={14} className="ml-2" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

