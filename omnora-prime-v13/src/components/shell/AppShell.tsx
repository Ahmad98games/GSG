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

  // Hide internal shell components on landing, auth, and setup pages
  const shouldHideShell = pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname?.startsWith("/setup");
  
  if (shouldHideShell) {
    return (
      <>
        <ToastContainer />
        {children}
      </>
    );
  }

  // Detect Electron for TitleBar visibility
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronWindow;

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
