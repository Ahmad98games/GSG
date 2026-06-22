/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import QuickActions from "@/components/shell/QuickActions";
import ActionTrail from "@/components/ui/ActionTrail";
import GlobalSearch from "@/components/shell/GlobalSearch";
import KeyboardShortcuts from "@/components/shell/KeyboardShortcuts";
import { ToastContainer } from "@/components/ui/Toast";

import GlobalTopBar from "@/components/shell/GlobalTopBar";
import TitleBar from "@/components/shell/TitleBar";
import ThemePicker from "@/components/shell/ThemePicker";
import SentinelAssistant from "@/components/sentinel/SentinelAssistant";
import { IntroAnimation } from "@/components/shell/IntroAnimation";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useThemeStore } from "@/stores/themeStore";
import { useTierStore } from "@/stores/tierStore";
import { AlertTriangle, Download, ExternalLink } from "lucide-react";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useLanguageStore } from "@/stores/languageStore";
import { cn } from "@/lib/utils";
import { UpdateBanner } from "@/components/shell/UpdateBanner";
import IndustrialSidebar from "@/components/shell/IndustrialSidebar";
import { useNoxisLocale } from "@/hooks/useLocale";
import { NoxisLogoLoader } from "@/components/ui/NoxisLogoLoader";


export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const { isCollapsed } = useSidebarState();
  const { isRTL } = useLanguageStore();

  const { profile } = useBusinessProfile();

  const [showIntro, setShowIntro] = React.useState(false);
  const [introChecked, setIntroChecked] = React.useState(false);

  const { language, setLanguage, isRTL: storeIsRTL } = useLanguageStore();
  const locale = useNoxisLocale().locale;

  // Trial state reads and caching
  const { isTrial, expiresAt } = useTierStore();
  const [dismissedExpired, setDismissedExpired] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const trialExpiryDate = expiresAt ? new Date(expiresAt) : null;
  const isTrialExpired = isTrial && trialExpiryDate && trialExpiryDate < new Date();
  
  const getTrialBannerData = () => {
    if (!trialExpiryDate) return { text: "", isRed: false, isToday: false };
    const diffMs = trialExpiryDate.getTime() - new Date().getTime();
    
    if (diffMs <= 0) {
      return {
        text: "Trial ended — read-only mode active",
        isRed: true,
        isToday: false
      };
    }
    
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours <= 24) {
      return {
        text: "⚠ Trial expires TODAY — purchase to continue",
        isRed: true,
        isToday: true
      };
    }
    
    const diffDays = Math.ceil(diffHours / 24);
    return {
      text: `🔑 Elite Trial — ${diffDays} days remaining (expires ${trialExpiryDate.toLocaleDateString()})`,
      isRed: false,
      isToday: false
    };
  };

  const bannerData = getTrialBannerData();

  const handleExportData = async () => {
    if (!profile?.id) {
      alert("No business profile found to export.");
      return;
    }
    
    setIsExporting(true);
    try {
      const response = await fetch(`/api/internal/backup?business_id=${profile.id}`);
      if (!response.ok) throw new Error("Failed to generate backup");
      const data = await response.json();
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `noxis-backup-${(profile.business_name || 'backup').toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  React.useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);


  React.useEffect(() => {
    const currentThemeId = useThemeStore.getState().activeThemeId;
    if (profile?.visual_theme && profile.visual_theme !== currentThemeId) {
      useThemeStore.getState().setTheme(profile.visual_theme as any);
    }
  }, [profile?.visual_theme]);

  React.useEffect(() => {
    // Show intro if user has completed onboarding
    const hasOnboarded = localStorage.getItem('noxis_onboarded');
    const sessionIntroShown = sessionStorage.getItem('noxis_session_intro_shown');
    
    // Administrators always see it once per session
    // Regular users see it once per day (or per session if preferred)
    const isAdmin = true; // This would ideally come from an auth hook, but user identified as admin

    if (hasOnboarded && !sessionIntroShown) {
      setTimeout(() => setShowIntro(true), 0);
      sessionStorage.setItem('noxis_session_intro_shown', 'true');
    }
    setTimeout(() => setIntroChecked(true), 0);
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      return (window as any).electron.onLicenseExpired(() => {
        alert("CRITICAL: Your Noxis Hub license has expired. The system is now in READ-ONLY mode. Background monitoring processes have been terminated.");
      });
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  
  if (!mounted) {
    return (
      <>
        <ToastContainer />
        <NoxisLogoLoader label="Initializing Noxis..." fullScreen={true} />
      </>
    );
  }

  // Hide internal shell components on landing, static website, docs, auth, and setup pages
  const shouldHideShell = 
    pathname === "/" || 
    pathname === "/index.html" || 
    pathname === "/login" || 
    pathname === "/signup" || 
    pathname?.startsWith("/setup") ||
    pathname?.startsWith("/download") ||
    pathname?.startsWith("/pricing") ||
    pathname?.startsWith("/privacy") ||
    pathname?.startsWith("/about") ||
    pathname?.startsWith("/reviews") ||
    pathname?.startsWith("/docs") ||
    pathname?.startsWith("/blog") ||
    pathname?.startsWith("/admin"); // Admin dashboard is web-only, bypass Electron guard
  
  // Detect Electron for TitleBar and secure access checking
  const isElectron = typeof window !== 'undefined' && (
    !!(window as any).electronWindow || 
    !!(window as any).electron ||
    navigator.userAgent.toLowerCase().includes('electron')
  );

  // Block web browser access to secured software dashboard paths
  if (!shouldHideShell && !isElectron && process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-[#0F1113] text-gray-300 font-inter flex flex-col items-center justify-center p-6 select-none">
        <ToastContainer />
        <div className="max-w-xl w-full bg-[#16191C] border border-red-500/20 p-12 text-center space-y-8 relative overflow-hidden shadow-2xl">
          {/* Decorative background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.03)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="flex flex-col items-center space-y-4 relative z-10">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-red-500 font-mono font-black uppercase tracking-[0.3em] bg-red-500/10 px-3 py-1 border border-red-500/20 rounded-full">
                Environment Blocked
              </span>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white mt-2">
                Desktop App <span className="text-gray-500">Strictly Required</span>
              </h2>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed font-medium max-w-md mx-auto relative z-10">
            Noxis Industrial Hub runs strictly and securely within the isolated desktop container (<code className="text-red-400 font-mono">.exe</code>). Access to localized database operations, secure WebSocket bridges, and Sentinel AI vision feeds from open-web browser environments is prohibited to prevent telemetry leakage and session hijack.
          </p>

          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <a 
              href="/download" 
              className="px-8 py-4 bg-red-500/10 border border-red-500/30 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] text-center font-bold"
            >
              Get Desktop Client (.exe)
            </a>
            <a 
              href="/" 
              className="px-8 py-4 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/10 hover:text-white transition-all text-center font-bold"
            >
              Back to Website
            </a>
          </div>
          
          <div className="text-[8px] font-mono text-gray-600 uppercase tracking-widest relative z-10">
            Noxis Hub Security Protocol v13.0.0 · AES-256 Protected
          </div>
        </div>
      </div>
    );
  }

  if (shouldHideShell) {
    return (
      <>
        <ToastContainer />
        {children}
      </>
    );
  }

  return (
    <>
      {introChecked && showIntro && (
        <IntroAnimation onComplete={handleIntroComplete} />
      )}
      {isElectron && <TitleBar />}
      
      {isTrial && bannerData.text && (
        <div className={cn(
          "w-full py-2.5 px-6 border-b text-[11px] font-bold tracking-wide transition-all duration-300 flex items-center justify-between z-[40]",
          bannerData.isRed 
            ? "bg-red-500/10 border-red-500/20 text-red-400" 
            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
        )}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
            <span>{bannerData.text}</span>
          </div>
          <div className="flex items-center gap-3">
            {!isTrialExpired && (
              <a 
                href="https://noxishub.app/pricing" 
                target="_blank"
                className="text-[9px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-400 text-black px-3 py-1 rounded transition-colors"
              >
                Upgrade License
              </a>
            )}
            {isTrialExpired && (
              <button 
                onClick={handleExportData}
                disabled={isExporting}
                className="text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 px-3 py-1 rounded text-gray-300 transition-colors disabled:opacity-50"
              >
                {isExporting ? "Exporting..." : "Export Data"}
              </button>
            )}
          </div>
        </div>
      )}

      <UpdateBanner />
      <ToastContainer />
      <QuickActions />
      <ActionTrail />
      <GlobalSearch />
      <KeyboardShortcuts />
      <ThemePicker hideTrigger={true} />
      <SentinelAssistant />
      <div 
        className={cn(
          "relative min-h-screen flex flex-col transition-all duration-300",
          isElectron ? "pt-10" : "pt-0",
          isCollapsed ? "ps-[64px]" : "ps-[240px]"
        )}
        style={{ "--sidebar-width": isCollapsed ? "64px" : "240px" } as React.CSSProperties}
      >
        <GlobalTopBar />
        <IndustrialSidebar />
        <div className="flex-1 w-full flex flex-col min-h-0 relative">
          <div
            className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
            aria-hidden="true"
          >
            {/* Omnora Labs OM watermark */}
            <div style={{
              position: 'absolute',
              bottom: -20,
              right: -20,
              opacity: 0.015,
              transform: 'rotate(-15deg)',
              userSelect: 'none',
              pointerEvents: 'none',
            }}>
              <img
                src="/logos/omnoralabs.png"
                alt=""
                style={{
                  width: 400,
                  height: 400,
                  objectFit: 'contain',
                  filter: 'grayscale(1) brightness(10)',
                }}
              />
            </div>
          </div>
          <Suspense fallback={<PageSkeleton />}>
            {children}
          </Suspense>
        </div>
      </div>

      {isTrialExpired && !dismissedExpired && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-xl w-full bg-[#16191C] border border-amber-500/20 p-10 text-center space-y-8 relative overflow-hidden shadow-2xl rounded-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03)_0%,transparent_70%)] pointer-events-none" />
            
            <div className="flex flex-col items-center space-y-4 relative z-10">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-amber-500 font-mono font-black uppercase tracking-[0.3em] bg-amber-500/10 px-3 py-1 border border-amber-500/20 rounded-full">
                  Trial Expired
                </span>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white mt-2">
                  Your 3-Day Trial <span className="text-gray-500">Has Ended</span>
                </h2>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed font-medium max-w-md mx-auto relative z-10">
              Your data is fully saved and secure. To continue writing transactions, managing staff, and viewing active Sentinel CCTV cameras, please purchase a license key. You can safely export your local database backup immediately.
            </p>

            <div className="pt-4 border-t border-white/5 flex flex-col gap-3 relative z-10">
              <a 
                href="https://noxishub.app/pricing" 
                target="_blank"
                className="w-full py-4 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all text-center flex items-center justify-center gap-2 rounded-xl font-bold"
              >
                <span>Buy Now</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              
              <button 
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full py-4 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/10 hover:text-white transition-all text-center flex items-center justify-center gap-2 rounded-xl disabled:opacity-50 font-bold"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? "Exporting Data..." : "Export My Data"}</span>
              </button>

              <button 
                onClick={() => setDismissedExpired(true)}
                className="w-full py-3 bg-transparent text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-all text-center"
              >
                Dismiss to Read-Only Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-white/[0.04] rounded-sm" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-white/[0.04] rounded-sm" />
        ))}
      </div>
      <div className="h-64 bg-white/[0.04] rounded-sm" />
    </div>
  );
}
