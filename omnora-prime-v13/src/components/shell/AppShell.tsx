/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import QuickActions from "@/components/shell/QuickActions";
import ActionTrail from "@/components/ui/ActionTrail";
import GlobalSearch from "@/components/shell/GlobalSearch";
import { CommandPalette } from '@/components/shell/CommandPalette';
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
import { useLicenseValidation } from '@/hooks/useLicenseValidation';
import { PageTransition } from "@/components/shell/PageTransition";
import { useGlobalKeyboardShortcuts } from "@/hooks/useGlobalKeyboardShortcuts";
import { ShortcutHelp } from "@/components/shell/ShortcutHelp";
import { OfflineIndicator } from '@/components/shell/OfflineIndicator';
import { ExpiryBanner } from '@/components/license/ExpiryBanner';
import { LicenseReminderModal } from '@/components/license/LicenseReminderModal';


export default function AppShell({ children }: { children: React.ReactNode }) {
  const { license } = useLicenseValidation();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const { isCollapsed } = useSidebarState();
  const { isRTL } = useLanguageStore();
  const { profile } = useBusinessProfile();

  useGlobalKeyboardShortcuts();

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.hasAttribute('contenteditable') ||
            (activeEl as HTMLElement).isContentEditable)
        ) {
          return;
        }

        e.preventDefault();
        import('@/stores/undoStore').then(({ useUndoStore }) => {
          useUndoStore.getState().popAndUndo();
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        // License expired: silently handle downgrade via LicenseProvider
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

  // Detect Electron for TitleBar and secure access checking
  const isElectron = typeof window !== 'undefined' && (
    !!(window as any).electronWindow || 
    !!(window as any).electron ||
    navigator.userAgent.toLowerCase().includes('electron')
  );

  // Hide internal shell components on public website pages
  const shouldHideShell = 
    !pathname ||
    pathname === "/" || 
    pathname === "/index.html" || 
    pathname.startsWith("/login") || 
    pathname.startsWith("/signup") || 
    pathname.startsWith("/setup") ||
    pathname.startsWith("/features") ||
    pathname.startsWith("/download") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/industries") ||
    pathname.startsWith("/changelog") ||
    pathname.startsWith("/compare") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/refund") ||
    pathname.startsWith("/purchase") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/reviews") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/who-is-it-for") ||
    pathname.startsWith("/technology") ||
    pathname.startsWith("/whats-new") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/admin");

  // Check if current route is a public marketing route
  const isPublicRoute = shouldHideShell;

  if (!isPublicRoute && !isElectron && process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-[#121417] flex items-center justify-center p-8 select-none">
        <div className="text-center">
          <p className="text-[#C5A059] font-mono text-6xl font-bold mb-4">404</p>
          <h2 className="text-white text-xl font-semibold mb-2">
            Page not found
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            This page does not exist or has been moved.
          </p>
          <a
            href="/"
            className="px-6 py-2.5 bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 hover:text-white transition-colors rounded-sm inline-block"
          >
            Return to Home
          </a>
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
      <CommandPalette />
      <KeyboardShortcuts />
      <ThemePicker hideTrigger={true} />
      <SentinelAssistant />
      <ShortcutHelp />
      <div 
        className={cn(
          "relative min-h-screen flex flex-col transition-all duration-300",
          isElectron ? "pt-10" : "pt-0",
          isCollapsed ? "sidebar-collapsed ps-[64px]" : "sidebar-expanded ps-[240px]"
        )}
        style={{ "--sidebar-width": isCollapsed ? "64px" : "240px" } as React.CSSProperties}
      >
        <GlobalTopBar />
        <IndustrialSidebar />
        <div className="flex-1 w-full flex flex-col min-h-0 relative">
          <ExpiryBanner />
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
            <PageTransition>
              {children}
            </PageTransition>
          </Suspense>
        </div>
      </div>

      <LicenseReminderModal />
      <OfflineIndicator />
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
