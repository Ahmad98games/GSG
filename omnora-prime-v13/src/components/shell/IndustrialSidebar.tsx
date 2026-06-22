"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import { usePersona } from "@/hooks/usePersona";
import { useStaff } from "@/hooks/useStaff";
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
  const { isCollapsed, toggle } = useSidebarState();
  const { hasModule, term, workerTermPlural, isLoading: isPersonaLoading, t, businessId } = usePersona();
  const { profile } = useBusinessProfile();
  const { role, isLoading: isRoleLoading } = useStaff(businessId);
  const [mounted, setMounted] = useState(false);
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const supabase = createClient();

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

  const NAVIGATION_GROUPS: NavGroup[] = [
    {
      label: 'CORE',
      items: [
        { id: 'quick-entry', name: "Quick Entry", href: "/quick-entry", icon: Zap },
        { id: 'dashboard', name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { id: 'inventory', name: term('inventory'), href: "/inventory", icon: Package },
        { id: 'karigars', name: workerTermPlural, href: "/karigars", icon: Users },
        { id: 'worker-network', name: t('nav_worker_network', "Worker Network"), href: "/karigars/network", icon: Users, badge: "NEW" },
        { id: 'production', name: term('production'), href: "/production", icon: Factory },
        { id: 'payroll', name: term('payroll'), href: "/payroll", icon: Banknote },
        { id: 'dispatch', name: "Dispatch", href: "/dispatch", icon: Truck },
      ]
    },
    {
      label: 'COMMERCE',
      items: [
        { id: 'invoices', name: term('sales'), href: "/invoices", icon: ShoppingCart },
        { id: 'parties', name: term('parties'), href: "/parties", icon: ShieldCheck },
        { id: 'purchase', name: term('purchase'), href: "/purchase", icon: Truck },
        { id: 'orders', name: "Orders", href: "/orders", icon: ClipboardList },
        { id: 'promises', name: "Promises", href: "/promises", icon: CalendarCheck },
        { id: 'network', name: t('nav_network', "Factory Network"), href: "/network", icon: Globe, badge: "NEW" },
        { id: 'finance', name: t('nav_finance', "Finance"), href: "/finance", icon: Banknote, badge: "NEW" },
      ]
    },
    {
      label: 'FINANCE',
      items: [
        { id: 'khata', name: "Khata", href: "/khata", icon: Book },
        { id: 'cashflow', name: "Cashflow", href: "/cashflow", icon: ArrowLeftRight },
        { id: 'reports', name: "Reports", href: "/reports", icon: PieChart },
        { id: 'audit', name: "Audit", href: "/audit", icon: Shield },
      ]
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { id: 'cctv', name: "CCTV", href: "/cctv", icon: Zap },
        { id: 'analytics', name: "Analytics", href: "/analytics", icon: BarChart3 },
      ]
    },
    {
      label: 'TOOLS',
      items: [
        { id: 'intelligence', name: t('nav_intelligence', "Noxis Intelligence"), href: "/intelligence", icon: TrendingUp, badge: "NEW" },
        { 
          id: 'import', 
          name: "Import Data", 
          href: "/import", 
          icon: Upload,
          badge: (() => {
            const launchDate = new Date("2025-05-19");
            const currentDate = new Date();
            const diffTime = currentDate.getTime() - launchDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 30 ? "NEW" : undefined;
          })()
        },
        { id: 'generators', name: t('nav_generators', "Generators"), href: "/generators", icon: FileText },
        { id: 'calculators', name: t('nav_calculators', "Calculators"), href: "/calculators", icon: Calculator },
        { id: 'converters', name: t('nav_converters', "Unit Converters"), href: "/converters", icon: ArrowLeftRight },
        { id: 'file-morph', name: t('nav_file_morph', "PDF & File Tools"), href: "/file-morph", icon: Layers },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'messaging', name: "Messaging", href: "/messaging", icon: Bell },
        { id: 'pairing', name: "Pairing", href: "/pairing", icon: Globe },
        { id: 'settings', name: "Settings", href: "/settings", icon: Settings },
      ]
    },
  ];

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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-8 px-2">
          {isLoading ? (
            <div className="space-y-4 px-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-noxis-overlay animate-pulse rounded-sm" />
              ))}
            </div>
          ) : (
            NAVIGATION_GROUPS.map((group, idx) => {
              const visibleItems = group.items.filter(item => 
                (item.id === 'import' || item.id === 'network' || item.id === 'intelligence' || item.id === 'finance' || item.id === 'worker-network' || hasModule(item.id as string)) && 
                (role && hasModulePermission(role, item.id))
              );
              if (visibleItems.length === 0) return null;

              const dataTourAttr =
                group.label === 'CORE' ? 'sidebar-core' :
                group.label === 'COMMERCE' ? 'sidebar-commerce' :
                group.label === 'FINANCE' ? 'sidebar-finance' :
                undefined;

              return (
                <div key={idx} className="space-y-2" data-tour={dataTourAttr}>
                  {!isCollapsed && (
                    <p className="text-[9px] uppercase font-black text-noxis-text-muted tracking-widest px-4 mb-2">
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-1">
                    {visibleItems.map((item) => (
                      <SidebarItem 
                        key={item.id}
                        href={item.href}
                        icon={item.icon}
                        label={item.name}
                        isCollapsed={isCollapsed}
                        isActive={pathname.startsWith(item.href)}
                        badge={item.badge}
                      />
                    ))}
                  </div>
                </div>
              );
            })
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
              } catch (err) {
                console.error("Logout failed:", err);
              } finally {
                window.location.href = "/login";
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
