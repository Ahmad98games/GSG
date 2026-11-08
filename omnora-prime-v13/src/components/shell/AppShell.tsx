/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import React, { Suspense, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import QuickActions from "@/components/shell/QuickActions";
import ActionTrail from "@/components/ui/ActionTrail";
import GlobalSearch from "@/components/shell/GlobalSearch";
import { CommandPalette } from '@/components/shell/CommandPalette';
import KeyboardShortcuts from "@/components/shell/KeyboardShortcuts";
import ReleaseNotesModal from "@/components/shell/ReleaseNotesModal";
import { ToastContainer } from "@/components/ui/Toast";

import GlobalTopBar from "@/components/shell/GlobalTopBar";
import TitleBar from "@/components/shell/TitleBar";
import ThemePicker from "@/components/shell/ThemePicker";
import SentinelAssistant from "@/components/sentinel/SentinelAssistant";
import SentinelCopilot from "@/components/sentinel/SentinelCopilot";
import { IntroAnimation } from "@/components/shell/IntroAnimation";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useThemeStore } from "@/stores/themeStore";
import { useTierStore } from "@/stores/tierStore";
import { AlertTriangle, Download, ExternalLink, MessageSquare } from "lucide-react";
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
import { TopUrgencyBanner } from '@/components/trial/TrialCountdownBanner';
import { TrialExpirationModal } from '@/components/trial/TrialExpirationModal';
import { LicenseReminderModal } from '@/components/license/LicenseReminderModal';
import { PlanCompletionUpgradeModal } from '@/components/license/PlanCompletionUpgradeModal';
import { ActivationCelebration } from '@/components/license/ActivationCelebration';
import HWIDActivationModal from "@/components/pricing/HWIDActivationModal";
import BusinessModeSelector from '@/components/onboarding/BusinessModeSelector';
import { ProductTour } from '@/components/onboarding/ProductTour';
import WelcomeGuide from '@/components/onboarding/WelcomeGuide';
import { useBusinessModeStore } from '@/stores/businessModeStore';
import { PublicNavProvider } from '@/components/shell/PublicNavbar';
import { NoxisSessionRecoveryModal } from '@/components/shell/NoxisSessionRecoveryModal';
import { useWorkstationHeartbeat } from '@/hooks/useWorkstationHeartbeat';
import { useAccessControl } from '@/hooks/useAccessControl';
import BannedLockdownModal from '@/components/license/BannedLockdownModal';
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";


export default function AppShell({ children }: { children: React.ReactNode }) {
  const { license } = useLicenseValidation();
  const pathname = usePathname();
  const { isConfigured: isBusinessModeConfigured, setMode } = useBusinessModeStore();
  const [mounted, setMounted] = React.useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = React.useState(false);
  const { isBanned, banReason, hwid: banHwid, userName: banUser, brandName: banBrand, recheck: recheckBan } = useAccessControl();
  const { isViewer, roleLabel, currentUser } = usePermissions();
  const toast = useToast();

  React.useEffect(() => {
    const handleOpenGuide = () => setShowWelcomeGuide(true);
    window.addEventListener('open-welcome-guide', handleOpenGuide);
    return () => window.removeEventListener('open-welcome-guide', handleOpenGuide);
  }, []);
  const { isCollapsed } = useSidebarState();
  const { isRTL } = useLanguageStore();
  const { profile } = useBusinessProfile();

  // First-run detection: User needs mode selection if they haven't configured their business mode
  // and haven't previously completed onboarding.
  const hasOnboarded = typeof window !== 'undefined' && (
    localStorage.getItem('noxis_onboarded') === 'true' ||
    localStorage.getItem('noxis_first_run_complete') === 'true'
  );
  const isCustomBusiness = Boolean(
    profile?.business_name &&
    profile.business_name !== 'Noxis Business' &&
    profile.business_name !== 'Noxis Factory Workstation' &&
    profile.business_name !== 'My Business'
  );
  const hasExistingBusiness = hasOnboarded || isCustomBusiness;
  const shouldShowModeSelector = !isBusinessModeConfigured && !hasExistingBusiness;

  // Auto-mark as configured only if a genuine custom established business exists
  React.useEffect(() => {
    if (hasExistingBusiness && !isBusinessModeConfigured && isCustomBusiness) {
      setMode('textile', profile?.business_name || 'My Business', profile?.phone || '');
    }
  }, [hasExistingBusiness, isBusinessModeConfigured, isCustomBusiness, profile?.business_name, profile?.phone, setMode]);

  useGlobalKeyboardShortcuts();
  useWorkstationHeartbeat();

  const [showIntro, setShowIntro] = React.useState(false);
  const [introChecked, setIntroChecked] = React.useState(false);

  const { language, setLanguage, isRTL: storeIsRTL } = useLanguageStore();
  const locale = useNoxisLocale().locale;

  // Trial state reads and caching
  const { isTrial, expiresAt } = useTierStore();
  const [dismissedExpired, setDismissedExpired] = React.useState(false);
  const [showHwidModal, setShowHwidModal] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [powerCutNotice, setPowerCutNotice] = React.useState<{ lastRoute: string; message: string } | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const api = (window as any).electronAPI;
    if (api?.onPowerCutDetected) {
      const unsub = api.onPowerCutDetected((data: { lastRoute: string; message: string }) => {
        setPowerCutNotice(data);
        setShowRecoveryModal(true);
      });
      return unsub;
    }
  }, []);

  const trialExpiryDate = expiresAt ? new Date(expiresAt) : null;
  const isTrialExpired = Boolean(isTrial && trialExpiryDate && trialExpiryDate < new Date());
  
  const getTrialBannerData = () => {
    if (!trialExpiryDate) return { text: "", isRed: false, isToday: false, isUrgent: false, daysLeft: 0 };
    const diffMs = trialExpiryDate.getTime() - new Date().getTime();
    
    if (diffMs <= 0) {
      return {
        text: "Elite Trial Ended: Strict Read-Only Mode Active (New Invoices & Ledger Entries Blocked)",
        isRed: true,
        isToday: false,
        isUrgent: true,
        daysLeft: 0,
      };
    }
    
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);

    if (diffDays <= 3) {
      return {
        text: `⚠ ${diffDays} Day${diffDays > 1 ? 's' : ''} Remaining in Elite Trial: Active Karigar Ledgers & Bills will lock into Read-Only mode`,
        isRed: true,
        isToday: diffHours <= 24,
        isUrgent: true,
        daysLeft: diffDays,
      };
    }
    
    return {
      text: `🔑 Elite Trial — ${diffDays} days remaining (expires ${trialExpiryDate.toLocaleDateString()})`,
      isRed: false,
      isToday: false,
      isUrgent: false,
      daysLeft: diffDays,
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
    if (typeof window === 'undefined') return;

    const enforceLockBarrier = async () => {
      const sessionLocked = sessionStorage.getItem('noxis_locked') === 'true';
      const localLocked = localStorage.getItem('noxis_locked') === 'true';

      let electronLocked = false;
      const api = (window as any).electronAPI;
      if (api?.store) {
        try {
          const isL = await api.store.isLocked?.();
          electronLocked = Boolean(isL);
        } catch {}
      }

      if (
        (sessionLocked || localLocked || electronLocked) &&
        pathname &&
        !pathname.startsWith('/lock') &&
        !pathname.startsWith('/login')
      ) {
        window.location.replace('/lock');
      }
    };

    enforceLockBarrier();
  }, [pathname]);

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


  const hasInitializedTheme = React.useRef(false);
  React.useEffect(() => {
    if (hasInitializedTheme.current) return;
    hasInitializedTheme.current = true;
    // Only adopt profile theme on initial load if user has never explicitly set a local theme
    if (typeof window !== 'undefined' && profile?.visual_theme) {
      const savedTheme = localStorage.getItem('noxis-theme');
      if (!savedTheme) {
        useThemeStore.getState().setTheme(profile.visual_theme as any, false);
      }
    }
  }, [profile?.visual_theme]);

  React.useEffect(() => {
    // Show intro animation whenever software is opened
    const sessionIntroShown = sessionStorage.getItem('noxis_session_intro_shown');
    if (!sessionIntroShown) {
      setShowIntro(true);
      sessionStorage.setItem('noxis_session_intro_shown', 'true');
    }
    setIntroChecked(true);
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      return (window as any).electron.onLicenseExpired(() => {
        // License expired: silently handle downgrade via LicenseProvider
      });
    }
  }, []);

  const [isPosKiosk, setIsPosKiosk] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncKiosk = () => {
      const isPos = pathname?.startsWith('/pos');
      const inQuery = window.location.search.includes('standalone=true') || window.location.search.includes('kiosk=true');
      const inStore = localStorage.getItem('noxis_pos_kiosk') === 'true';
      setIsPosKiosk(Boolean(isPos && (inQuery || inStore)));
    };
    syncKiosk();

    const handleKioskEvent = (e: any) => {
      if (pathname?.startsWith('/pos')) {
        setIsPosKiosk(Boolean(e.detail?.kiosk));
      } else {
        setIsPosKiosk(false);
      }
    };

    window.addEventListener('noxis:kiosk_toggle', handleKioskEvent);
    window.addEventListener('popstate', syncKiosk);
    return () => {
      window.removeEventListener('noxis:kiosk_toggle', handleKioskEvent);
      window.removeEventListener('popstate', syncKiosk);
    };
  }, [pathname]);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  
  // Impenetrable Read-Only Guard: Intercept any and all DOM actions that create, edit, or delete data
  React.useEffect(() => {
    if (!isViewer || typeof window === 'undefined') return;

    const handleIntercept = (e: MouseEvent | SubmitEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('button, a, input[type="submit"], [role="button"]') as HTMLElement | null;
      if (!target) return;

      const text = (target.textContent || '').trim().toLowerCase();
      const title = (target.getAttribute('title') || '').toLowerCase();
      const ariaLabel = (target.getAttribute('aria-label') || '').toLowerCase();
      const className = (target.className || '').toString().toLowerCase();
      const combined = `${text} ${title} ${ariaLabel} ${className}`;

      // Whitelist of permitted view, search, export and navigation actions:
      const isAllowed = 
        combined.includes('close') || 
        combined.includes('cancel') || 
        combined.includes('dismiss') || 
        combined.includes('export') || 
        combined.includes('download') || 
        combined.includes('print') || 
        combined.includes('excel') || 
        combined.includes('csv') || 
        combined.includes('search') || 
        combined.includes('filter') || 
        combined.includes('refresh') || 
        combined.includes('switch') || 
        combined.includes('operator') || 
        combined.includes('details') || 
        combined.includes('inspect') || 
        combined.includes('view') || 
        combined.includes('overview') || 
        combined.includes('finance') || 
        combined.includes('people') || 
        combined.includes('stock') || 
        combined.includes('next') || 
        combined.includes('prev') || 
        combined.includes('back') ||
        combined.includes('copy') ||
        combined.includes('help') ||
        combined.includes('theme') ||
        combined.includes('sidebar') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        (target.tagName === 'A' && !combined.includes('new') && !combined.includes('add') && !combined.includes('delete') && !combined.includes('edit'));

      if (isAllowed) return;

      // Disallowed modification keywords:
      const isDisallowed =
        e.type === 'submit' ||
        target.getAttribute('type') === 'submit' ||
        combined.includes('add') ||
        combined.includes('new') ||
        combined.includes('create') ||
        combined.includes('save') ||
        combined.includes('update') ||
        combined.includes('delete') ||
        combined.includes('remove') ||
        combined.includes('adjust') ||
        combined.includes('import') ||
        combined.includes('pay') ||
        combined.includes('disburse') ||
        combined.includes('post') ||
        combined.includes('checkout') ||
        combined.includes('charge') ||
        combined.includes('complete sale') ||
        combined.includes('reset') ||
        combined.includes('trash');

      if (isDisallowed) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning(
          'Action Blocked (View-Only Mode)',
          'Your account is in View-Only mode. Creating, editing, or deleting records is locked.'
        );
      }
    };

    window.addEventListener('click', handleIntercept, true);
    window.addEventListener('submit', handleIntercept, true);
    return () => {
      window.removeEventListener('click', handleIntercept, true);
      window.removeEventListener('submit', handleIntercept, true);
    };
  }, [isViewer, toast]);

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

  const isStandalonePortal = Boolean(
    pathname?.startsWith('/workstation') ||
    pathname?.startsWith('/mobile') ||
    pathname?.startsWith('/scanner') ||
    (pathname?.startsWith('/pos') && isPosKiosk)
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
    pathname.startsWith("/about") ||
    pathname.startsWith("/reviews") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/who-is-it-for") ||
    pathname.startsWith("/technology") ||
    pathname.startsWith("/whats-new") ||
    pathname.startsWith("/purchase/success") ||
    pathname.startsWith("/success") ||
    pathname.startsWith("/specs") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/admin");

  // Check if current route is a public marketing route
  const isPublicRoute = shouldHideShell;

  // On the public cloud marketing website (noxishub.app), protect private internal routes
  const isCloudWebsite = typeof window !== 'undefined' && (
    window.location.hostname === 'noxishub.app' ||
    window.location.hostname.endsWith('.noxishub.app') ||
    window.location.hostname.includes('pages.dev') ||
    window.location.hostname.includes('vercel.app')
  );

  if (isCloudWebsite && !isPublicRoute && !isStandalonePortal) {
    return (
      <PublicNavProvider>
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
      </PublicNavProvider>
    );
  }

  // Dedicated LAN Standalone Portals: Workstation node, POS cashier, mobile terminals
  if (isStandalonePortal) {
    return (
      <div 
        className="min-h-screen w-screen flex flex-col bg-[#07090E] select-none text-zinc-100 overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg, #07090E)' }}
      >
        {isElectron && !isPosKiosk && <TitleBar />}
        <ToastContainer />
        <main className={cn(
          "flex-1 w-full",
          pathname?.startsWith('/pos') ? "flex flex-col min-h-0 overflow-hidden" : "overflow-y-auto"
        )}>
          {children}
        </main>
      </div>
    );
  }

  const isLockScreen = pathname === '/lock' || pathname?.startsWith('/lock');

  // Impenetrable Security Barrier: Isolate lock screen from the entire shell
  if (isLockScreen) {
    return (
      <div 
        className="fixed inset-0 min-h-screen w-screen flex flex-col bg-[#060708] select-none z-[99999] overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg, #060708)' }}
      >
        {isElectron && <TitleBar />}
        <ToastContainer />
        <main className="flex-1 w-full flex items-center justify-center relative overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  if (shouldHideShell) {
    const isAuthOrSpecial = 
      pathname.startsWith("/login") || 
      pathname.startsWith("/signup") || 
      pathname.startsWith("/setup") ||
      pathname.startsWith("/portal") || 
      pathname.startsWith("/admin") ||
      isLockScreen;

    if (isAuthOrSpecial) {
      return (
        <>
          <ToastContainer />
          {children}
        </>
      );
    }

    return (
      <PublicNavProvider>
        <ToastContainer />
        {children}
      </PublicNavProvider>
    );
  }

  return (
    <>
      {/* First-Run Business Mode Selector (New installations only - bypassed for owner / active license) */}
      {shouldShowModeSelector && (
        <BusinessModeSelector />
      )}

      {/* Guided Workstation Tour */}
      {!shouldShowModeSelector && (
        <ProductTour />
      )}

      {!shouldShowModeSelector && introChecked && showIntro && (
        <IntroAnimation onComplete={handleIntroComplete} />
      )}
      {isElectron && <TitleBar />}
      
      {showRecoveryModal && (
        <NoxisSessionRecoveryModal
          powerCutInfo={powerCutNotice}
          onClose={() => setShowRecoveryModal(false)}
        />
      )}

      {powerCutNotice && !showRecoveryModal && (
        <div className="bg-[#0B0F19] border-b border-cyan-500/30 px-4 py-2 flex items-center justify-between text-xs font-mono z-[70] shadow-lg sticky top-10 print:hidden noxis-resilience-banner" data-resilience-banner="true">
          <div className="flex items-center gap-2.5 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-white">Noxis Resilience:</span>
            <span className="text-zinc-300">Ungraceful shutdown detected. Pending session & drafts preserved.</span>
            {powerCutNotice.lastRoute && (
              <span className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 font-semibold">
                {powerCutNotice.lastRoute}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRecoveryModal(true)}
              className="px-2.5 py-1 rounded text-[11px] bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-semibold transition-colors cursor-pointer"
            >
              Review Pending Work
            </button>
            <button
              onClick={() => setPowerCutNotice(null)}
              className="text-zinc-400 hover:text-white px-2 py-1 rounded text-[11px] bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {isViewer && (
        <div className="bg-[#1c1308] border-b border-amber-500/40 px-4 py-2 flex items-center justify-between text-xs font-mono z-[75] shadow-lg sticky top-0 print:hidden animate-fadeIn">
          <div className="flex items-center gap-2.5 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-amber-200">View-Only Mode:</span>
            <span className="text-zinc-200 font-semibold">{currentUser?.name || 'Staff Member'} ({roleLabel})</span>
            <span className="text-amber-300/90 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-500/30 text-[10px] font-sans font-medium">
              Browse & Audit Mode Active — Creating, editing, and deleting records is strictly locked
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-user-switch'));
              }}
              className="px-2.5 py-1 rounded text-[11px] bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold transition-colors cursor-pointer"
            >
              Switch Operator
            </button>
          </div>
        </div>
      )}
      
      <TopUrgencyBanner />
      <ExpiryBanner />
      <UpdateBanner />
      <ToastContainer />
      <ActionTrail />
      <GlobalSearch />
      <CommandPalette />
      <KeyboardShortcuts />
      <ReleaseNotesModal />
      <ThemePicker hideTrigger={true} />
      <SentinelAssistant />
      <SentinelCopilot />
      <ShortcutHelp />
      <ZoomSafetyPill />
      <QuickActions />
      {showWelcomeGuide && (
        <WelcomeGuide
          ownerName={profile?.owner_name || 'Administrator'}
          businessName={profile?.business_name || 'My Business'}
          industry={profile?.industry_type || 'textile'}
          onClose={() => setShowWelcomeGuide(false)}
        />
      )}
      <div 
        className={cn(
          "relative flex flex-col transition-all duration-300",
          pathname?.startsWith('/pos')
            ? (isElectron ? "h-[calc(100vh-40px)] overflow-hidden overscroll-none" : "h-screen overflow-hidden overscroll-none")
            : "min-h-screen",
          isCollapsed ? "sidebar-collapsed ps-[64px]" : "sidebar-expanded ps-[240px]"
        )}
        style={{
          "--sidebar-width": isCollapsed ? "64px" : "240px",
          backgroundColor: "var(--color-bg, #0B0E14)"
        } as React.CSSProperties}
      >
        <GlobalTopBar />
        <IndustrialSidebar />
        <div 
          className={cn(
            "flex-1 w-full flex flex-col min-h-0 relative",
            pathname?.startsWith('/pos') && "overflow-hidden"
          )}
          style={{
            backgroundColor: "var(--color-bg)",
            color: "var(--color-text)"
          }}
        >
          <ExpiryBanner />
          <div
            className="fixed inset-0 pointer-events-none z-0 overflow-hidden print:hidden no-print"
            aria-hidden="true"
          >
            {/* Noxis Hub watermark */}
            <div style={{
              position: 'absolute',
              bottom: -20,
              right: -20,
              opacity: 0.02,
              transform: 'rotate(-15deg)',
              userSelect: 'none',
              pointerEvents: 'none',
            }}>
              <img
                src="/logos/noxis.png"
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

      <HWIDActivationModal
        isOpen={showHwidModal}
        onClose={() => {
          setShowHwidModal(false);
        }}
        initialTier="elite"
        isNonDismissible={false}
      />

      <TrialExpirationModal />
      <LicenseReminderModal />
      <PlanCompletionUpgradeModal />
      <ActivationCelebration />
      <OfflineIndicator />

      {isBanned && (
        <BannedLockdownModal
          hwid={banHwid}
          userName={banUser}
          brandName={banBrand}
          reason={banReason}
          onRefresh={recheckBan}
        />
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

function ZoomSafetyPill() {
  const [isZoomedOut, setIsZoomedOut] = useState(false);

  useEffect(() => {
    const checkZoom = () => {
      if (typeof window !== 'undefined') {
        const ratio = window.outerWidth / window.innerWidth;
        if (ratio < 0.82) {
          setIsZoomedOut(true);
        } else {
          setIsZoomedOut(false);
        }
      }
    };

    window.addEventListener('resize', checkZoom);
    window.addEventListener('noxis:zoom-reset', () => setIsZoomedOut(false));
    checkZoom();

    return () => {
      window.removeEventListener('resize', checkZoom);
    };
  }, []);

  if (!isZoomedOut) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] bg-[#0F172A] border border-white/10 shadow-2xl px-4 py-2 rounded-full flex items-center gap-3 text-xs text-white print:hidden no-print">
      <span className="text-amber-400 font-bold">🔍 Display Shrunken / Zoomed Out</span>
      <button
        onClick={() => {
          if ((window as any).electronAPI?.resetZoom) {
            (window as any).electronAPI.resetZoom();
          }
          document.documentElement.style.zoom = '100%';
          document.body.style.zoom = '100%';
          setIsZoomedOut(false);
        }}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full text-[11px] transition-colors shadow-sm cursor-pointer"
      >
        Reset to 100% (Ctrl+0)
      </button>
      <button onClick={() => setIsZoomedOut(false)} className="text-zinc-400 hover:text-white text-xs ml-1">✕</button>
    </div>
  );
}
