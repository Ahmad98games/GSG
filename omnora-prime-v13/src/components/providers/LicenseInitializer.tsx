'use client';

import { useEffect, useState } from 'react';
import { Shield, Check, Lock, Key, Video, Scale } from 'lucide-react';

export function LicenseInitializer() {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [isChecked, setIsChecked] = useState(false);

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

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A0A0B]/95 backdrop-blur-md flex items-center justify-center p-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#C5A059]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/2 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="glass-panel max-w-2xl w-full p-8 border border-white/10 rounded-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Holographic Glowing Top Border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-[#C5A059] to-purple-600 animate-pulse" />

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-full text-blue-400 mb-2 border border-white/5">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
            Noxis Hub <span className="text-[#C5A059]">Workspace Consent</span>
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
            Please review and accept our policies to initialize the software
          </p>
        </div>

        {/* Highlight Summaries */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-2 scrollbar-thin my-4 text-slate-300">
          <div className="p-4 bg-white/5 border border-white/5 rounded space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Lock size={14} className="text-blue-400" />
              1. Data Localization Guarantee
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your financial records, ledgers, and inventory data reside exclusively on your physical workstation hard drive. We do not access, view, or sync your private offline records to our servers.
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/5 rounded space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Key size={14} className="text-amber-500" />
              2. Local Key Custody & Password Loss
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Database encryption keys and access passwords are stored locally on your device. We do not maintain server-side backups of your password. If you lose your keys, we cannot recover them.
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/5 rounded space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Video size={14} className="text-[#C5A059]" />
              3. AI Sentinel & Surveillance Regulations
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              When activating local CCTV feeds and AI Sentinel perimeter scanning, you must comply with local labor regulations and privacy laws regarding workspace surveillance in your jurisdiction.
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/5 rounded space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Scale size={14} className="text-purple-400" />
              4. Operational & Audit Disclaimer
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Noxis provides tools to streamline inventory, wages, and bookkeeping. However, calculations are operational aids and should be audited by professional accountants before formal filings.
            </p>
          </div>

          <p className="text-[11px] text-gray-500 text-center leading-relaxed">
            By accepting, you confirm you agree to our full{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        {/* Acceptance Actions */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
          <label className="flex items-start space-x-3 cursor-pointer group select-none">
            <div className="mt-0.5 relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                isChecked 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-white/5 border-white/10 group-hover:border-white/25'
              }`}>
                {isChecked && <Check size={14} strokeWidth={3} />}
              </div>
            </div>
            <span className="text-xs text-gray-400 font-medium group-hover:text-gray-300 transition-colors">
              I agree to the Terms of Service and Privacy Policy.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!isChecked}
            className={`w-full py-4 text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center ${
              isChecked
                ? 'bg-white text-black hover:bg-gray-200 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
            }`}
          >
            Accept & Initialize Workspace
          </button>
        </div>
      </div>
    </div>
  );
}

