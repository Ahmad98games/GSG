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
  Microscope
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

  const isLoading = isPersonaLoading || isRoleLoading;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Global Keyboard Shortcut: [N]
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
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
        { id: 'dashboard', name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { id: 'inventory', name: term('inventory'), href: "/inventory", icon: Package },
        { id: 'karigars', name: workerTermPlural, href: "/karigars", icon: Users },
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
        { id: 'lens', name: "Lens", href: "/lens", icon: Search },
        { id: 'analytics', name: "Analytics", href: "/analytics", icon: BarChart3 },
      ]
    },
    {
      label: 'TOOLS',
      items: [
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
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white/5 group-hover:bg-electric-blue/20 rounded-sm transition-colors relative overflow-hidden">
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
                <span className="text-xs font-black text-white tracking-tighter uppercase italic">Noxis Hub</span>
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest leading-none">PersonaEngine v2.0</span>
              </motion.div>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-8 px-2">
          {isLoading ? (
            <div className="space-y-4 px-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-white/5 animate-pulse rounded-sm" />
              ))}
            </div>
          ) : (
            NAVIGATION_GROUPS.map((group, idx) => {
              const visibleItems = group.items.filter(item => 
                hasModule(item.id as string) && 
                (role && hasModulePermission(role, item.id))
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={idx} className="space-y-2">
                  {!isCollapsed && (
                    <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest px-4 mb-2">
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

        {/* User Info */}
        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-electric-blue/20 flex items-center justify-center text-electric-blue font-bold text-xs border border-electric-blue/30">
                {profile?.business_name?.[0] || "A"}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white truncate max-w-[120px]">
                  {profile?.business_name || "Ahmad Mahboob"}
                </span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                  Administrator
                </span>
                <div className="mt-1">
                  <TierBadge />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
               <div className="w-8 h-8 rounded-full bg-electric-blue/20 flex items-center justify-center text-electric-blue font-bold text-xs border border-electric-blue/30">
                {profile?.business_name?.[0] || "A"}
              </div>
            </div>
          )}
          
          <button 
            className={cn(
              "w-full flex items-center h-8 rounded-sm px-2 text-gray-500 hover:text-white transition-all group",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 text-[10px] font-black uppercase tracking-widest">Log Out</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-white/5 bg-[#121417]">
          <button 
            onClick={toggle}
            className="w-full h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all rounded-sm"
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

const SidebarItem = React.memo(function SidebarItem({ href, icon: Icon, label, isCollapsed, isActive, badge }: { 
  href: string; 
  icon: React.ElementType; 
  label: string; 
  isCollapsed: boolean; 
  isActive?: boolean;
  badge?: string;
}) {
  const content = (
    <Link
      href={href}
      className={cn(
        "flex items-center h-10 rounded-sm px-3 transition-all duration-150 group relative",
        isActive 
          ? "text-electric-blue bg-electric-blue/10 border-r-2 border-electric-blue" 
          : "text-gray-400 hover:bg-white/5 hover:text-white border-r-2 border-transparent"
      )}
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-electric-blue")} />
      {!isCollapsed && (
        <>
          <span className={cn(
            "ml-3 text-xs font-semibold whitespace-nowrap",
            isActive ? "text-white" : "text-gray-400"
          )}>
            {label}
          </span>
          {badge && (
            <span className="ml-auto text-[8px] font-black bg-electric-blue/20 text-electric-blue px-1.5 py-0.5 rounded-sm">
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
            className="bg-[#1A1D21] border border-white/10 px-3 py-1.5 text-[10px] text-white font-bold uppercase tracking-wider shadow-2xl z-[60] rounded-sm"
          >
            {label}
            <Tooltip.Arrow className="fill-[#1A1D21]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return content;
});
