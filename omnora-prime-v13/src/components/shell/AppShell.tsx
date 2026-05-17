"use client";

import React from "react";
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
import { useSidebarState } from "@/hooks/useSidebarState";
import { useLanguageStore } from "@/stores/languageStore";
import { cn } from "@/lib/utils";
import { UpdateBanner } from "@/components/shell/UpdateBanner";
import IndustrialSidebar from "@/components/shell/IndustrialSidebar";
import { useNoxisLocale } from "@/hooks/useLocale";


export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const { isCollapsed } = useSidebarState();
  const { isRTL } = useLanguageStore();

  const { profile } = useBusinessProfile();
  const { setTheme, activeThemeId } = useThemeStore();

  const [showIntro, setShowIntro] = React.useState(false);
  const [introChecked, setIntroChecked] = React.useState(false);

  const { language, setLanguage, isRTL: storeIsRTL } = useLanguageStore();
  const locale = useNoxisLocale().locale;

  React.useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  // Sync store with current locale and apply DOM side-effects
  React.useEffect(() => {
    if (locale && locale !== language) {
      setLanguage(locale as any);
    }
    
    // Apply RTL and Language classes to root elements
    if (typeof document !== 'undefined') {
      const isRTL = ['ur', 'ar', 'pa', 'fa'].includes(locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.body.dir = isRTL ? 'rtl' : 'ltr';
      
      // Industrial Jargon/Language support
      document.documentElement.classList.remove(
        'lang-en', 'lang-ur', 'lang-ar', 'lang-hi', 
        'lang-bn', 'lang-pa', 'lang-zh', 'lang-tr', 
        'lang-es', 'lang-ru', 'lang-ta', 'lang-fr'
      );
      document.documentElement.classList.add(`lang-${locale}`);
    }
  }, [locale, language, setLanguage]);

  React.useEffect(() => {
    if (profile?.visual_theme && profile.visual_theme !== activeThemeId) {
      setTheme(profile.visual_theme as any);
    }
  }, [profile?.visual_theme, setTheme, activeThemeId]);

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
      <div className="min-h-screen bg-[#121417] flex items-center justify-center">
        <ToastContainer />
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-electric-blue/20 border-t-electric-blue rounded-full animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Initializing Noxis...</span>
        </div>
      </div>
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
    pathname?.startsWith("/docs");
  
  // Detect Electron for TitleBar and secure access checking
  const isElectron = typeof window !== 'undefined' && (
    !!(window as any).electronWindow || 
    !!(window as any).electron ||
    navigator.userAgent.toLowerCase().includes('electron')
  );

  // Block web browser access to secured software dashboard paths
  if (!shouldHideShell && !isElectron) {
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
          isCollapsed ? "ps-[60px]" : "ps-[240px]"
        )}
        style={{ "--sidebar-width": isCollapsed ? "60px" : "240px" } as React.CSSProperties}
      >
        <GlobalTopBar />
        <IndustrialSidebar />
        <div className="flex-1 relative">
          {children}
        </div>
      </div>
    </>
  );
}
