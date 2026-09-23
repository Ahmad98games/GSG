'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import * as Tooltip from '@radix-ui/react-tooltip'
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
  ChevronDown,
  ChevronsUpDown,
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
  BookOpen,
  Database,
  Cpu,
  Video,
  MessageCircle,
  Smartphone,
  Brain,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  Building2,
  Wallet,
  Thermometer,
  Sparkles,
} from 'lucide-react'

import { usePersona } from '@/hooks/usePersona'
import { useStaff } from '@/hooks/useStaff'
import { useTranslation } from '@/hooks/useTranslation'
import { useIndustryConfig } from '@/hooks/useIndustryConfig'
import { useSidebarState } from '@/hooks/useSidebarState'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { createClient } from '@/lib/supabase/client'
import { resetAllStores } from '@/stores'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import QuickProductionModal from '@/components/production/QuickProductionModal'
import { TierBadge } from '../ui/TierBadge'
import { TrialCountdownBanner } from '@/components/trial/TrialCountdownBanner'

interface SidebarNavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  badge?: string
  shortcut?: string
}

interface SidebarNavGroup {
  id: string
  title: string
  items: SidebarNavItem[]
}

export default React.memo(function IndustrialSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isCollapsed, toggle } = useSidebarState()
  const { t } = useTranslation()
  const { profile } = useBusinessProfile()
  const { businessId } = usePersona()
  const { role } = useStaff(businessId)
  const { nav, features, industry } = useIndustryConfig()
  const [mounted, setMounted] = useState(false)
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false)
  const supabase = createClient()

  // Tenant monogram fallback (e.g., "GS" for "Gold She Garments")
  const clientMonogram = useMemo(() => {
    const name = profile?.business_name?.trim() || 'Gold She Garments'
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }, [profile?.business_name])

  // Collapsible sections state (persisted)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    operations: false,
    finance: false,
    system: false,
  })

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('noxis_sidebar_collapsed_sections')
      if (stored) {
        setCollapsedSections(JSON.parse(stored))
      }
    } catch {}
  }, [])

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] }
      try {
        localStorage.setItem('noxis_sidebar_collapsed_sections', JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  // Global Keyboard Shortcut: [N] for Quick Production
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (
        e.key &&
        e.key.toLowerCase() === 'n' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault()
        setIsProductionModalOpen(true)
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [])

  // ── REFINED LOGICAL GROUPING ──────────────────────────────────────────
  const navigationGroups: SidebarNavGroup[] = useMemo(() => {
    // 1. OPERATIONS MODULE
    const operationsItems: SidebarNavItem[] = [
      {
        id: 'dashboard',
        label: nav.dashboard || 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'pos',
        label: 'POS Counter',
        href: '/pos',
        icon: ShoppingCart,
      },
      {
        id: 'production',
        label: nav.production || 'Production Grid',
        href: industry.key === 'textile' || industry.key === 'garment' ? '/production/grid' : '/production',
        icon: Zap,
        shortcut: 'N',
      },
      {
        id: 'inventory',
        label: nav.inventory || 'Inventory & Stock',
        href: '/inventory',
        icon: Package,
      },
      {
        id: 'workers',
        label: nav.workers || 'Workers & Floor',
        href: '/karigars',
        icon: Users,
      },
      {
        id: 'dispatch',
        label: nav.dispatch || 'Dispatch & Shipping',
        href: '/dispatch',
        icon: Truck,
      },
      {
        id: 'foresight',
        label: 'Foresight AI',
        href: '/foresight',
        icon: Brain,
        badge: 'AI',
      },
    ]

    if (industry.key === 'rice' || industry.key === 'food') {
      operationsItems.splice(2, 0, {
        id: 'weight-entry',
        label: 'Weight Entry',
        href: '/weight-entry',
        icon: Calculator,
      })
    }

    if (features.expiryManagement) {
      operationsItems.push({
        id: 'expiry',
        label: 'Expiry Alerts',
        href: industry.key === 'medical' ? '/expiry' : '/inventory/expiry',
        icon: AlertTriangle,
      })
    }

    if (features.batchTracking) {
      operationsItems.push({
        id: 'batch-recall',
        label: 'Batch Tracking',
        href: industry.key === 'medical' ? '/expiry?status=recalled' : '/production/batches',
        icon: AlertOctagon,
      })
    }

    if (features.yieldTracking) {
      operationsItems.push({
        id: 'yield',
        label: 'Yield Tracking',
        href: '/production/yield',
        icon: TrendingUp,
      })
    }

    if (features.coldChainLogging) {
      operationsItems.push({
        id: 'cold-chain',
        label: 'Cold Chain Log',
        href: '/cold-chain',
        icon: Thermometer,
      })
    }

    // 2. ADMINISTRATION & FINANCE MODULE
    const financeItems: SidebarNavItem[] = [
      {
        id: 'khata',
        label: 'Khata Ledger',
        href: '/khata',
        icon: BookOpen,
      },
      {
        id: 'invoices',
        label: nav.invoices || 'Invoices & Billing',
        href: '/invoices',
        icon: FileText,
      },
      {
        id: 'parties',
        label: nav.parties || 'Parties & Accounts',
        href: '/parties',
        icon: Building2,
      },
      {
        id: 'purchase',
        label: nav.purchase || 'Purchases',
        href: '/purchase',
        icon: ShoppingCart,
      },
      {
        id: 'payroll',
        label: nav.payroll || 'Payroll & Wages',
        href: '/payroll',
        icon: Wallet,
      },
      {
        id: 'finance',
        label: 'Expense & Finance',
        href: '/finance',
        icon: Banknote,
      },
      {
        id: 'sales',
        label: 'CRM & Pipeline',
        href: '/sales',
        icon: TrendingUp,
      },
      {
        id: 'compliance',
        label: 'Tax & Compliance',
        href: '/compliance',
        icon: ShieldCheck,
      },
    ]

    // 3. SYSTEM & TELEMETRY MODULE
    const systemItems: SidebarNavItem[] = [
      {
        id: 'cctv',
        label: 'CCTV Feeds',
        href: '/cctv',
        icon: Video,
      },
      {
        id: 'messaging',
        label: 'Messaging Hub',
        href: '/messaging',
        icon: MessageCircle,
      },
      {
        id: 'reports',
        label: nav.reports || 'Analytics & Reports',
        href: '/reports',
        icon: BarChart3,
      },
      {
        id: 'workflows',
        label: 'Workflows',
        href: '/workflows',
        icon: Layers,
      },
      {
        id: 'audit',
        label: 'Audit Trail',
        href: '/audit',
        icon: ClipboardList,
      },
      {
        id: 'pairing',
        label: 'Device Pairing',
        href: '/pairing',
        icon: Smartphone,
      },
      {
        id: 'file-morph',
        label: 'File Conversion',
        href: '/file-morph',
        icon: ArrowLeftRight,
      },
      {
        id: 'configuration',
        label: 'System Settings',
        href: '/settings',
        icon: Settings,
      },
    ]

    return [
      { id: 'operations', title: 'Operations', items: operationsItems },
      { id: 'finance', title: 'Finance & Admin', items: financeItems },
      { id: 'system', title: 'System & Telemetry', items: systemItems },
    ]
  }, [nav, features, industry])

  const isElectron = typeof window !== 'undefined' && !!(window as any).electronWindow

  const handleLogout = async () => {
    try {
      resetAllStores()
      await supabase.auth.signOut().catch(() => {})
      localStorage.clear()
      document.cookie = 'noxis_license_active=; path=/; max-age=0; SameSite=Strict'
      queryClient.clear()
      window.location.href = '/login'
    } catch {
      window.location.href = '/login'
    }
  }

  if (!mounted) return null

  return (
    <Tooltip.Provider delayDuration={150}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        className={cn(
          'fixed bottom-0 start-0 border-r border-white/[0.06] z-[60] flex flex-col select-none text-slate-300 font-inter antialiased',
          isElectron ? 'top-10' : 'top-0'
        )}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-bg, #0B0E14) 95%, #000000)'
        }}
      >
        {/* ── 1. PLATFORM ANCHOR & TENANT WORKSPACE SELECTOR ── */}
        <div className="flex-shrink-0 border-b border-white/[0.06] bg-[#090D14]/80">
          {/* Top-Left Master Anchor: Minimal NOXIS Engine Identity */}
          <div className="h-8 px-3 flex items-center justify-between border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="w-[18px] h-[18px] rounded-[3px] bg-white/[0.08] border border-white/[0.12] flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-mono font-semibold text-slate-300">N</span>
              </div>
              {!isCollapsed && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono font-medium tracking-widest text-slate-400 uppercase">NOXIS</span>
                  <span className="text-[9px] font-mono text-slate-600 tracking-wider">CORE</span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[9px] font-mono text-slate-500 bg-white/[0.03] px-1 py-0.2 rounded-[2px] border border-white/[0.06]">
                v13.1.14
              </span>
            )}
          </div>

          {/* Client Workspace Tile: Tenant Selector Component */}
          <div className="p-1.5">
            <button
              onClick={() => setIsProductionModalOpen(true)}
              title="Switch Workspace / Quick Production (N)"
              className="flex items-center gap-2.5 min-w-0 text-left w-full group rounded-[6px] p-1.5 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-colors cursor-pointer"
            >
              {/* Brand Logo Slot: Dynamic 28px x 28px square with rounded-[6px] border border-white/[0.08] bg-slate-900 hosting client logo/monogram */}
              <div className="w-7 h-7 rounded-[6px] bg-slate-900 border border-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                {(profile?.logo_url || profile?.avatar_url) ? (
                  <img
                    src={profile?.logo_url || profile?.avatar_url}
                    alt={profile?.business_name || "Brand Logo"}
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-slate-200 tracking-wider font-mono">
                      {clientMonogram}
                    </span>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <>
                  <div className="min-w-0 flex-1 flex flex-col leading-tight">
                    <span className="text-[13px] font-medium text-slate-100 truncate group-hover:text-white transition-colors">
                      {profile?.business_name || 'Gold She Garments'}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate font-mono">
                      {industry.displayName || 'Garment Factory'} ERP
                    </span>
                  </div>
                  <ChevronsUpDown size={14} className="text-slate-500 group-hover:text-slate-300 flex-shrink-0 transition-colors" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── 2. SCROLLABLE NAVIGATION SECTIONS ── */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3 space-y-4">
          {navigationGroups.map((group) => {
            const isGroupCollapsed = collapsedSections[group.id] && !isCollapsed

            return (
              <div key={group.id} className="space-y-0.5">
                {/* Section Header (Subtle, Tracked, Non-Aggressive) */}
                {!isCollapsed && (
                  <button
                    onClick={() => toggleSection(group.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold tracking-wider text-slate-400 hover:text-slate-300 uppercase transition-colors group cursor-pointer"
                  >
                    <span>{group.title}</span>
                    <ChevronDown
                      size={12}
                      className={cn(
                        'text-slate-500 transition-transform duration-200 group-hover:text-slate-400',
                        isGroupCollapsed && '-rotate-90'
                      )}
                    />
                  </button>
                )}

                {/* Section Items */}
                <AnimatePresence initial={false}>
                  {!isGroupCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-0.5 overflow-hidden"
                    >
                      {group.items.map((item) => {
                        const isActive =
                          item.href === '/settings'
                            ? pathname.startsWith('/settings')
                            : item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname === item.href || pathname.startsWith(item.href + '/')

                        return (
                          <EnterpriseSidebarItem
                            key={item.id}
                            item={item}
                            isCollapsed={isCollapsed}
                            isActive={isActive}
                          />
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        {/* ── 3. USER PROFILE & FOOTER ── */}
        <div className="border-t border-slate-800/80 bg-[#090D14] p-2 space-y-1.5 flex-shrink-0">
          <TrialCountdownBanner isCollapsed={isCollapsed} />

          {/* User Tile */}
          <div
            className={cn(
              'flex items-center rounded-md p-1.5 transition-colors',
              isCollapsed ? 'justify-center' : 'justify-between hover:bg-white/[0.03]'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-200 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(profile?.owner_name || profile?.business_name || 'A')[0].toUpperCase()}</span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-[#0B0F17]" />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex flex-col leading-tight">
                  <span className="text-[12px] font-medium text-slate-200 truncate">
                    {profile?.owner_name || 'Ahmad Mahboob'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-400 capitalize">
                      {role || 'Administrator'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <TierBadge />
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded-md transition-colors cursor-pointer"
              >
                <LogOut size={15} strokeWidth={1.75} />
              </button>
            )}
          </div>

          {/* Collapse Trigger Button */}
          <button
            onClick={toggle}
            className="w-full h-8 flex items-center justify-center gap-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors text-[11px] font-medium cursor-pointer"
          >
            <ChevronRight
              size={14}
              strokeWidth={1.75}
              className={cn('transition-transform duration-200', !isCollapsed && 'rotate-180')}
            />
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </motion.aside>

      <QuickProductionModal
        isOpen={isProductionModalOpen}
        onClose={() => setIsProductionModalOpen(false)}
      />
    </Tooltip.Provider>
  )
})

// ── REFINED ENTERPRISE SIDEBAR ITEM COMPONENT ──────────────────────────
const EnterpriseSidebarItem = React.memo(function EnterpriseSidebarItem({
  item,
  isCollapsed,
  isActive,
}: {
  item: SidebarNavItem
  isCollapsed: boolean
  isActive: boolean
}) {
  const Icon = item.icon

  const linkContent = (
    <Link
      href={item.href}
      prefetch={true}
      className={cn(
        'group relative flex items-center rounded-md px-2.5 py-1.5 text-[13px] font-normal transition-colors duration-150 ease-in-out cursor-pointer',
        isCollapsed ? 'justify-center px-0' : 'gap-2.5',
        isActive
          ? 'text-white font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
          : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
      )}
      style={isActive ? {
        backgroundColor: 'color-mix(in srgb, var(--color-primary, #3b82f6) 12%, rgba(255,255,255,0.04))',
      } : undefined}
    >
      {/* Refined 2px Left Accent Indicator for Active Item */}
      {isActive && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
          style={{ backgroundColor: 'var(--color-primary, #3b82f6)' }}
          aria-hidden="true"
        />
      )}

      {/* Standardized 16px Icon with 1.75 Stroke */}
      <span
        className={cn(
          'flex-shrink-0 flex items-center justify-center transition-colors duration-150',
          !isActive && 'text-slate-400 group-hover:text-slate-200'
        )}
        style={isActive ? { color: 'var(--color-primary, #60a5fa)' } : undefined}
      >
        <Icon
          size={16}
          strokeWidth={1.75}
        />
      </span>

      {!isCollapsed && (
        <>
          <span className="truncate flex-1 tracking-[-0.01em]">{item.label}</span>

          {item.shortcut && (
            <kbd className="hidden group-hover:inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] rounded">
              {item.shortcut}
            </kbd>
          )}

          {item.badge && (
            <span 
              className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-primary, #3b82f6) 12%, transparent)',
                color: 'var(--color-primary, #60a5fa)',
                borderColor: 'color-mix(in srgb, var(--color-primary, #3b82f6) 25%, transparent)',
              }}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{linkContent}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="z-[70] rounded-md bg-[#0F141F] border border-slate-700/80 px-2.5 py-1 text-[12px] font-medium text-slate-100 shadow-xl"
          >
            {item.label}
            {item.shortcut && (
              <span className="ml-1.5 text-[10px] font-mono text-slate-400">[{item.shortcut}]</span>
            )}
            <Tooltip.Arrow className="fill-[#0F141F]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  }

  return linkContent
})
