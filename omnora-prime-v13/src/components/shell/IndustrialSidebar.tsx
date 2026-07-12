"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { 
  LayoutDashboard, 
  Users, 
  Factory, 
  Layers, 
  Package, 
  ShoppingCart, 
  Truck, 
  Settings, 
  FileText, 
  PieChart, 
  ShieldCheck, 
  Zap, 
  ChevronRight,
  Calculator,
  ArrowLeftRight,
  Globe,
  Banknote,
  Search,
  Bell,
  LogOut,
  Shield,
  BarChart3,
  ClipboardList,
  Book,
  Database,
  Cpu,
  ShieldAlert,
  LayoutGrid,
  Microscope,
  Upload,
  CalendarCheck,
  TrendingUp,
  Building2,
  BookOpen,
  Wallet,
  AlertTriangle,
  Thermometer,
  AlertOctagon,
  Video,
  MessageSquare,
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import { usePersona } from "@/hooks/usePersona";
import { useStaff } from "@/hooks/useStaff";
import { useIndustryConfig } from '@/hooks/useIndustryConfig';
import { hasModulePermission } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import Image from "next/image";
import QuickProductionModal from "@/components/production/QuickProductionModal";
import { TierBadge } from "../ui/TierBadge";
import { createClient } from "@/lib/supabase/client";
import { resetAllStores } from "@/stores";

const PRESET_AVATARS = [
  { id: 1, src: '/images/presets/preset-1.png', border: '#22d3ee' },
  { id: 2, src: '/images/presets/preset-2.png', border: '#22d3ee' },
  { id: 3, src: '/images/presets/preset-3.png', border: '#22d3ee' },
  { id: 4, src: '/images/presets/preset-4.png', border: '#22d3ee' },
  { id: 5, src: '/images/presets/preset-5.png', border: '#22d3ee' },
  { id: 6, src: '/images/presets/preset-6.png', border: '#22d3ee' },
  { id: 7, src: '/images/presets/preset-7.png', border: '#22d3ee' },
  { id: 8, src: '/images/presets/preset-8.png', border: '#22d3ee' },
  { id: 9, src: '/images/presets/preset-9.png', border: '#22d3ee' },
  { id: 10, src: '/images/presets/preset-10.png', border: '#22d3ee' },
];

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export default React.memo(function IndustrialSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isCollapsed, toggle } = useSidebarState();
  const { hasModule, term, workerTermPlural, isLoading: isPersonaLoading, t: personaT, businessId } = usePersona();
  const { profile } = useBusinessProfile();
  const { role, isLoading: isRoleLoading } = useStaff(businessId);
  const [mounted, setMounted] = useState(false);
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const supabase = createClient();

  const { nav, features, industry } = useIndustryConfig();

  const isLoading = isPersonaLoading || isRoleLoading;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Global Keyboard Shortcut: [N]
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key && e.key.toLowerCase() === 'n' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsProductionModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const CORE_ITEMS = useMemo(() => [
    {
      label: nav.dashboard,
      href: '/dashboard',
      icon: LayoutDashboard,
      always: true,
    },
    {
      label: nav.inventory,
      href: '/inventory',
      icon: Package,
      always: true,
    },
    {
      label: nav.workers,
      href: '/karigars',
      icon: Users,
      always: true,
    },
    {
      label: nav.production,
      href: '/production',
      icon: Zap,
      // Hide production tab for pure
      // wholesale businesses
      always: industry.key !== 'general',
    },
    {
      label: nav.invoices,
      href: '/invoices',
      icon: FileText,
      always: true,
    },
    {
      label: nav.parties,
      href: '/parties',
      icon: Building2,
      always: true,
    },
    {
      label: nav.ledger,
      href: '/khata',
      icon: BookOpen,
      always: true,
    },
    {
      label: nav.payroll,
      href: '/payroll',
      icon: Wallet,
      always: true,
    },
    {
      label: nav.dispatch,
      href: '/dispatch',
      icon: Truck,
      always: true,
    },
    {
      label: nav.purchase,
      href: '/purchase',
      icon: ShoppingCart,
      always: true,
    },
    {
      label: nav.reports,
      href: '/reports',
      icon: BarChart3,
      always: true,
    },
    // Industry-specific nav items
    {
      label: 'Expiry Alerts',
      href: '/inventory/expiry',
      icon: AlertTriangle,
      always: features.expiryManagement,
    },
    {
      label: 'Yield Tracking',
      href: '/production/yield',
      icon: TrendingUp,
      always: features.yieldTracking,
    },
    {
      label: 'Cold Chain Log',
      href: '/cold-chain',
      icon: Thermometer,
      always: features.coldChainLogging,
    },
    {
      label: 'Batch Recall',
      href: '/inventory/batches',
      icon: AlertOctagon,
      always: features.batchTracking,
    },
  ], [nav, features, industry.key]);

  const UTILITY_ITEMS = useMemo(() => [
    {
      label: 'CCTV Feeds',
      href: '/cctv',
      icon: Video,
      always: true,
    },
    {
      label: 'Messaging',
      href: '/messaging',
      icon: MessageSquare,
      always: true,
    },
    {
      label: 'Device Pairing',
      href: '/pairing',
      icon: Smartphone,
      always: true,
    },
    {
      label: 'File Conversion',
      href: '/file-morph',
      icon: ArrowLeftRight,
      always: true,
    },
    {
      label: 'CRM / Sales',
      href: '/sales',
      icon: TrendingUp,
      always: true,
    },
    {
      label: 'Expense & Finance',
      href: '/finance',
      icon: Banknote,
      always: true,
    },
    {
      label: 'Compliance & Tax',
      href: '/compliance',
      icon: ShieldCheck,
      always: true,
    },
    {
      label: 'Audit Logs',
      href: '/audit',
      icon: ClipboardList,
      always: true,
    },
    {
      label: 'Configuration',
      href: '/settings',
      icon: Settings,
      always: true,
    },
  ], []);

  const visibleCoreItems = useMemo(() => CORE_ITEMS.filter(
    item => item.always
  ), [CORE_ITEMS]);

  const visibleUtilityItems = useMemo(() => UTILITY_ITEMS.filter(
    item => item.always
  ), [UTILITY_ITEMS]);

  if (!mounted) return null;

  const isElectron = typeof window !== 'undefined' && !!(window as any).electronWindow;

  const initials = (() => {
    const name = (profile as any)?.owner_name?.trim() || profile?.business_name?.trim() || 'N';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, Math.min(name.length, 2)).toUpperCase();
  })();

  const renderSidebarAvatar = () => {
    if (profile?.avatar_type === 'custom' && profile?.avatar_url) {
      return (
        <div className="w-8 h-8 rounded-full border border-white/10 bg-black overflow-hidden flex items-center justify-center flex-shrink-0 relative">
          <Image src={profile.avatar_url} alt="Profile" width={32} height={32} className="w-full h-full object-cover" />
        </div>
      );
    }
    
    const presetId = Number(profile?.avatar_preset_id || 1);
    const preset = PRESET_AVATARS.find(p => p.id === presetId) || PRESET_AVATARS[0];
    
    return (
      <div 
        style={{ borderColor: preset.border }}
        className="w-8 h-8 rounded-full border flex items-center justify-center overflow-hidden flex-shrink-0 bg-black/40 shadow-[0_0_8px_rgba(34,211,238,0.2)] relative"
      >
        <Image src={preset.src} alt="Preset Avatar" width={32} height={32} className="w-full h-full object-cover" />
      </div>
    );
  };

  return (
    <Tooltip.Provider delayDuration={0}>
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 35 }}
        className={cn(
          "fixed bottom-0 start-0 bg-noxis-surface border-r border-noxis-border z-[60] flex flex-col shadow-2xl",
          isElectron ? "top-10" : "top-0"
        )}
      >
        {/* Sidebar Header / Branding */}
        <div className="h-20 flex items-center px-4 border-b border-noxis-border bg-noxis-bg">
          <button 
            onClick={() => setIsProductionModalOpen(true)}
            className="flex items-center space-x-3 overflow-hidden group hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-noxis-overlay group-hover:bg-electric-blue/20 rounded-sm transition-colors relative overflow-hidden">
              {profile?.logo_url ? (
                <Image src={profile.logo_url} alt={profile.business_name || 'Business Logo'} fill className="object-contain p-1" />
              ) : (
                <Image src="/logos/noxis.png" alt="Noxis Logo" width={20} height={20} className="object-contain" />
              )}
            </div>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col text-left"
              >
                <span className="text-xs font-black text-noxis-text tracking-tighter uppercase italic">Noxis Hub</span>
                <span className="text-[8px] text-noxis-text-muted font-bold uppercase tracking-widest leading-none">{profile?.business_name || 'Noxis Hub'}</span>
              </motion.div>
            )}
          </button>
        </div>

        {/* Industry Badge */}
        {!isCollapsed && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 16,
            paddingBottom: 12,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 20 }}>
              {industry.emoji}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: industry.accentColor,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}>
              {industry.displayName}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-2">
          {isLoading ? (
            <div className="space-y-4 px-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-noxis-overlay animate-pulse rounded-sm" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Core ERP
                  </div>
                )}
                <div className="space-y-1">
                  {visibleCoreItems.map((item) => (
                    <SidebarItem 
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      isCollapsed={isCollapsed}
                      isActive={pathname.startsWith(item.href)}
                    />
                  ))}
                </div>
              </div>

              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Utilities & Setup
                  </div>
                )}
                <div className="space-y-1">
                  {visibleUtilityItems.map((item) => (
                    <SidebarItem 
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      isCollapsed={isCollapsed}
                      isActive={pathname.startsWith(item.href)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-noxis-border bg-noxis-overlay/10">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3 mb-4 px-2">
              {renderSidebarAvatar()}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-noxis-text truncate max-w-[120px]">
                  {profile?.business_name || "Ahmad Mahboob"}
                </span>
                <span className="text-[9px] text-noxis-text-muted font-bold uppercase tracking-wider">
                  Administrator
                </span>
                <div className="mt-1">
                  <TierBadge />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              {renderSidebarAvatar()}
            </div>
          )}
          
          <button 
            onClick={async () => {
              try {
                resetAllStores();
                await supabase.auth.signOut();
                localStorage.removeItem('noxis-business-profile');
                localStorage.removeItem('noxis-bridge-status');
                localStorage.removeItem('NOXIS-profile-cache');
                queryClient.clear();
                router.push('/license');
              } catch (err) {
                toast.error('Could not sign out. Please try again.');
              }
            }}
            className={cn(
              "w-full flex items-center h-8 rounded-sm px-2 text-noxis-text-muted hover:text-noxis-text hover:bg-noxis-overlay transition-all group",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-noxis-text-muted group-hover:text-noxis-text" />
            {!isCollapsed && <span className="ml-3 text-[10px] font-black uppercase tracking-widest">Log Out</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-noxis-border bg-noxis-bg">
          <button 
            onClick={toggle}
            className="w-full h-10 flex items-center justify-center bg-noxis-overlay hover:bg-noxis-overlay-hover text-noxis-text-muted hover:text-noxis-text transition-all rounded-sm"
          >
            {isCollapsed ? <ChevronRight size={16} /> : (
              <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest">
                <ChevronRight size={14} className="rotate-180" />
                <span>Collapse Menu</span>
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      <QuickProductionModal 
        isOpen={isProductionModalOpen} 
        onClose={() => setIsProductionModalOpen(false)} 
      />
    </Tooltip.Provider>
  );
});

const SidebarItem = React.memo(function SidebarItem({ href, icon: Icon, label: rawLabel, isCollapsed, isActive, badge }: { 
  href: string; 
  icon: React.ElementType; 
  label: string; 
  isCollapsed: boolean; 
  isActive?: boolean;
  badge?: string;
}) {
  const label = rawLabel ? (rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)) : '';
  const content = (
    <Link
      href={href}
      className={cn(
        "flex items-center py-2.5 my-1.5 rounded-sm px-3 transition-all duration-200 group relative border-l-[3px]",
        isActive 
          ? "text-cyan-400 bg-cyan-950/20 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.15),_inset_4px_0_10px_-4px_rgba(34,211,238,0.2)]" 
          : "text-slate-400 hover:bg-white/5 hover:text-slate-100 border-transparent"
      )}
    >
      <Icon className={cn(
        "w-5 h-5 flex-shrink-0 transition-colors duration-200", 
        isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-400"
      )} />
      {!isCollapsed && (
        <>
          <span className={cn(
            "sidebar-label ml-3 text-xs font-semibold whitespace-nowrap tracking-wide-sm",
            isActive ? "text-white font-black" : "text-slate-350 group-hover:text-white"
          )}>
            {label}
          </span>
          {badge && (
            <span className="ml-auto text-[8px] font-black bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-sm">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {content}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={10}
            className="bg-noxis-surface border border-noxis-border px-3 py-1.5 text-noxis-text font-bold uppercase tracking-wider shadow-2xl z-[60] rounded-sm"
          >
            {label}
            <Tooltip.Arrow className="fill-noxis-surface" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return content;
});
