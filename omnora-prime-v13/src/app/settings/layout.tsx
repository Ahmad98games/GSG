'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Monitor,
  Building2,
  Globe,
  Activity,
  Shield,
  Network,
  Bell,
  Lock,
  Users,
  DollarSign,
  Zap,
  Database,
  Download,
  RefreshCw,
  Info,
  ChevronLeft,
  Share2,
  MessageSquare,
  Key,
  Layers,
  Sparkles,
  Cpu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
  badge?: string
  badgeColor?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const SETTINGS_SECTIONS: NavSection[] = [
  {
    title: 'Core Configuration',
    items: [
      { id: 'profile', label: 'Business Profile', href: '/settings?tab=profile', icon: Building2 },
      { id: 'general', label: 'General System', href: '/settings/general', icon: Monitor },
      { id: 'localization', label: 'Regional & Currency', href: '/settings/localization', icon: Globe },
      { id: 'appearance', label: 'Themes & UI', href: '/settings?tab=appearance', icon: Activity },
    ],
  },
  {
    title: 'Maintenance & System',
    items: [
      { id: 'updates', label: 'Software Updates', href: '/settings/updates', icon: RefreshCw, badge: 'v13.0.7', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      { id: 'backup', label: 'Backup & Restore', href: '/settings/backup', icon: Download },
      { id: 'data', label: 'Data Management', href: '/settings?tab=data', icon: Database },
      { id: 'devices', label: 'Devices & Bridges', href: '/settings/devices', icon: Cpu },
    ],
  },
  {
    title: 'Security & Access',
    items: [
      { id: 'security', label: 'Security & Master PIN', href: '/settings/security', icon: Lock },
      { id: 'users', label: 'Staff & Roles', href: '/settings/users', icon: Users },
      { id: 'license', label: 'License & Subscription', href: '/settings/license', icon: Shield },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'opening-balances', label: 'Opening Balances', href: '/settings/opening-balances', icon: DollarSign },
      { id: 'branches', label: 'Factory Branches', href: '/settings/branches', icon: Layers },
      { id: 'exchange-rates', label: 'Exchange Rates', href: '/settings/exchange-rates', icon: Globe },
      { id: 'import', label: 'Import Wizard', href: '/settings/import', icon: Download },
    ],
  },
  {
    title: 'Integrations & Info',
    items: [
      { id: 'whatsapp', label: 'WhatsApp Alerts', href: '/settings/whatsapp', icon: MessageSquare },
      { id: 'webhooks', label: 'Automations & Webhooks', href: '/settings/webhooks', icon: Share2 },
      { id: 'api', label: 'Developer API Keys', href: '/settings/api', icon: Key },
      { id: 'network', label: 'TCP & Network Mesh', href: '/settings?tab=network', icon: Network },
      { id: 'hardware', label: 'Industrial Hardware', href: '/settings?tab=hardware', icon: Zap },
      { id: 'about', label: 'About Noxis Hub', href: '/settings/about', icon: Info },
    ],
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams?.get('tab') || 'profile'
  const [updateAvailable, setUpdateAvailable] = useState(false)

  // Listen for background update status
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      ;(window as any).electronAPI.getUpdateStatus?.().then((s: any) => {
        if (s?.updateAvailable || s?.updateDownloaded) {
          setUpdateAvailable(true)
        }
      })
      const unsub = (window as any).electronAPI.onUpdateStatus?.((s: any) => {
        if (s?.status === 'available' || s?.status === 'ready') {
          setUpdateAvailable(true)
        }
      })
      return () => {
        if (typeof unsub === 'function') unsub()
      }
    }
  }, [])

  const isItemActive = (item: NavItem) => {
    if (item.href.startsWith('/settings?tab=')) {
      const targetTab = item.href.split('tab=')[1]
      return pathname === '/settings' && currentTab === targetTab
    }
    return pathname === item.href || pathname?.startsWith(item.href + '/')
  }

  return (
    <div 
      className="flex h-screen w-full overflow-hidden font-inter select-none transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-bg, #0B0E14)',
        color: 'var(--color-text, #e2e8f0)'
      }}
    >
      {/* ── SECONDARY SUB-NAVIGATION DRAWER (195px) ── */}
      <aside 
        className="w-[195px] flex-shrink-0 flex flex-col h-full overflow-hidden z-20 border-r transition-colors duration-200"
        style={{
          backgroundColor: 'var(--color-sidebar-bg, #0D121D)',
          borderColor: 'var(--color-card-border, rgba(255, 255, 255, 0.06))'
        }}
      >
        {/* Top Header & Back to Dashboard */}
        <div 
          className="p-3 border-b"
          style={{
            borderColor: 'var(--color-card-border, rgba(255, 255, 255, 0.06))',
            backgroundColor: 'color-mix(in srgb, var(--color-sidebar-bg, #0D121D) 85%, #000000 15%)'
          }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/[0.04] transition-colors mb-2 w-full"
            style={{ color: 'var(--color-text-muted, #94a3b8)' }}
          >
            <ChevronLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="truncate">Back to Dashboard</span>
          </Link>

          <div className="flex items-center justify-between pt-1">
            <div className="min-w-0">
              <h1 
                className="text-xs font-medium tracking-tight"
                style={{ color: 'var(--color-text, #e2e8f0)' }}
              >
                System Settings
              </h1>
              <p 
                className="text-[10px] truncate font-mono"
                style={{ color: 'var(--color-text-muted, #64748b)' }}
              >
                Parameters & Hub
              </p>
            </div>
            <span 
              className="text-[9px] font-mono px-1.5 py-0.5 rounded-[4px]"
              style={{
                color: 'var(--color-text-muted, #94a3b8)',
                backgroundColor: 'var(--color-input-bg, rgba(255, 255, 255, 0.04))',
                borderColor: 'var(--color-card-border, rgba(255, 255, 255, 0.08))',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              v13.0.7
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Sections */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-3.5 custom-scrollbar">
          {SETTINGS_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <p 
                className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5"
                style={{ color: 'var(--color-text-muted, #64748b)' }}
              >
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isItemActive(item)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between px-2 py-1.5 rounded-[4px] text-xs transition-colors duration-100 ease-out group',
                        active
                          ? 'font-medium'
                          : 'hover:bg-black/5 dark:hover:bg-white/[0.04]'
                      )}
                      style={{
                        backgroundColor: active ? 'color-mix(in srgb, var(--color-primary, #3b82f6) 15%, rgba(255,255,255,0.05))' : undefined,
                        color: active ? 'var(--color-text, #ffffff)' : 'var(--color-text-muted, #94a3b8)',
                        borderLeft: active ? '2px solid var(--color-primary, #3b82f6)' : '2px solid transparent'
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon
                          size={13}
                          className="flex-shrink-0 transition-colors"
                          style={{
                            color: active ? 'var(--color-primary, #60a5fa)' : 'inherit'
                          }}
                        />
                        <span className="truncate text-[12px]">{item.label}</span>
                      </div>

                      {/* Badges */}
                      {item.id === 'updates' && updateAvailable ? (
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" />
                      ) : item.badge ? (
                        <span
                          className={cn(
                            'text-[9px] font-mono px-1 py-0.2 rounded-[3px] border',
                            item.badgeColor || 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                          )}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div 
          className="p-2.5 border-t text-[10px] flex items-center justify-between"
          style={{
            borderColor: 'var(--color-card-border, rgba(255, 255, 255, 0.06))',
            backgroundColor: 'color-mix(in srgb, var(--color-sidebar-bg, #0D121D) 85%, #000000 15%)',
            color: 'var(--color-text-muted, #64748b)'
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span 
              className="font-mono text-[10px]"
              style={{ color: 'var(--color-text-muted, #94a3b8)' }}
            >
              Cloud Synced
            </span>
          </div>
          <span 
            className="font-mono text-[9px]"
            style={{ color: 'var(--color-text-muted, #64748b)' }}
          >
            Noxis Core
          </span>
        </div>
      </aside>

      {/* ── DYNAMIC SETTINGS CONTENT VIEWPORT ── */}
      <main 
        className="flex-1 h-full overflow-y-auto custom-scrollbar relative"
        style={{
          backgroundColor: 'var(--color-bg, #0B0E14)',
          color: 'var(--color-text, #e2e8f0)'
        }}
      >
        <div className="min-h-full w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
