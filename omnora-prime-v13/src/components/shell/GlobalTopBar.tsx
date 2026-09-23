'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Bell, Smartphone, Cloud, 
  ChevronRight, AlertTriangle, CheckCircle2,
  Settings, User, LogOut, Info, ShieldAlert,
  Wifi, WifiOff, Mic, Zap
} from 'lucide-react'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useBranchStore } from '@/stores/branchStore'
import { usePersona } from '@/hooks/usePersona'
import { createClient } from '@/lib/supabase/client'
import { resetAllStores } from '@/stores'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'
import LanguageSwitcher from './LanguageSwitcher'
import { useNoxisLocale } from '@/hooks/useLocale'
import { useTranslations } from 'next-intl'
import { TierBadge } from '../ui/TierBadge'
import { FeedbackModal } from '@/components/ui/FeedbackModal'
import Image from 'next/image'
import { CloudSyncIndicator } from './CloudSyncIndicator'
import { NotificationBell } from './NotificationBell'

export default React.memo(function GlobalTopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { profile } = useBusinessProfile()
  const { businessId } = usePersona()
  const { locale, isRTL } = useNoxisLocale()
  const t = useTranslations()
  const supabase = createClient()

  const [updateReady, setUpdateReady] = useState(false)
  const [updateVersion, setUpdateVersion] = useState('')

  useEffect(() => {
    if (!(window as any).electronAPI) return

    const cleanup = (window as any).electronAPI.onUpdateStatus((data: any) => {
      if (data.status === 'ready') {
        setUpdateReady(true)
        setUpdateVersion(data.version || '')
      }
    })

    return cleanup
  }, [])

  const { currentBranchId, currentBranchName, setBranch, clearBranch } = useBranchStore()

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('branches')
        .select('*')
        .eq('business_id', profile!.id)
        .eq('is_active', true)
        .order('name')
      return data || []
    },
    enabled: !!profile?.id,
    staleTime: 10 * 60 * 1000,
  })
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [statusFlyoutOpen, setStatusFlyoutOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 1. Connected Devices Query
  const { data: deviceCount = 0 } = useQuery({
    queryKey: ['connected-devices', businessId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tcp_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'online')
      if (error) return 0
      return count || 0
    },
    enabled: !!businessId,
  })

  const [bridgeDeviceCount, setBridgeDeviceCount] = useState<number | null>(null);

  const refreshDeviceCount = async () => {
    if ((window as any).electronAPI && typeof (window as any).electronAPI.getBridgeStatus === 'function') {
      try {
        const status = await (window as any).electronAPI.getBridgeStatus();
        if (status && typeof status.paired === 'number') {
          setBridgeDeviceCount(status.paired);
        }
      } catch (err) {
        console.error('Failed to get bridge status:', err);
      }
    }
  };

  useEffect(() => {
    refreshDeviceCount();
    if (!(window as any).electronAPI || typeof (window as any).electronAPI.on !== 'function') return;

    const handleBridgeEvent = (_: any, payload: { event: string; data: any }) => {
      if (payload.event === 'ATTENDANCE_LOGGED' || payload.event === 'PRODUCTION_LOGGED') {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
      refreshDeviceCount();
    };

    (window as any).electronAPI.on('bridge-event', handleBridgeEvent);
    return () => {
      (window as any).electronAPI.off('bridge-event', handleBridgeEvent);
    };
  }, [queryClient]);

  // 2. Sync Status Local Polling
  const [localQueueCount, setLocalQueueCount] = useState(0)

  useEffect(() => {
    const { getQueuedCount } = require('@/lib/sync/offlineQueue')
    const check = () => {
      setLocalQueueCount(getQueuedCount())
    }
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [])

  // 3. Alerts Query
  const { data: alerts = [] } = useQuery({
    queryKey: ['unresolved-alerts', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anomaly_alerts')
        .select('*')
        .eq('business_id', businessId)
        .eq('resolved', false)
        .order('created_at', { ascending: false })
      if (error) return []
      return data
    },
    enabled: !!businessId,
  })

  const syncState = !isOnline ? 'offline' : (localQueueCount > 0 ? 'syncing' : 'synced')

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const isElectron = typeof window !== 'undefined' && !!(window as any).electronWindow;

  const activeDeviceCount = bridgeDeviceCount !== null ? bridgeDeviceCount : deviceCount;

  return (
    <>
      <header 
        className={cn(
          "h-12 border-b border-white/[0.06] flex items-center justify-between px-4 sticky z-40 w-full select-none font-inter transition-colors duration-200",
          isElectron ? "top-10" : "top-0"
        )}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-bg, #0B0E14) 95%, #000000)'
        }}
      >
        {/* ── ZONE 1 (LEFT): Search & Shortcut Trigger ── */}
        <div className="flex items-center gap-2">
          <div className="relative group w-[220px]" data-tour="search-bar">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-slate-200 transition-colors" />
            <input 
              type="text"
              placeholder="Search anything..."
              onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
              readOnly
              className="w-full h-8 pl-8 pr-12 bg-[#131823] border border-white/[0.08] rounded-[4px] text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-white/[0.16] transition-colors cursor-pointer"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.2 rounded-[2px] border border-white/[0.08] bg-white/[0.03] text-[9px] text-slate-400 font-mono">
              Ctrl+K
            </div>
          </div>
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('sentinel:open'))}
            className="h-8 w-8 flex items-center justify-center bg-[#131823] border border-white/[0.08] rounded-[4px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors relative cursor-pointer"
            title="Sentinel AI Assistant (Ctrl+Shift+S)"
          >
            <Mic size={14} />
          </button>
        </div>

        {/* ── ZONE 2 (CENTER): Consolidated Operational Status Pill ── */}
        <div className="relative" data-tour="hub-status">
          <button
            onClick={() => setStatusFlyoutOpen(!statusFlyoutOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-[#131823] border border-white/[0.08] hover:border-white/[0.14] transition-colors text-xs cursor-pointer select-none"
          >
            <span className={cn(
              "w-1.5 h-1.5 rounded-full flex-shrink-0",
              !isOnline ? "bg-red-400" : syncState === 'syncing' ? "bg-amber-400" : "bg-emerald-400"
            )} />
            <span className="font-medium text-slate-200 text-[12px]">
              {!isOnline ? 'Offline Mode' : syncState === 'syncing' ? 'Syncing...' : 'All Systems Normal'}
            </span>
            <span className="text-slate-600 font-mono text-[11px]">|</span>
            <span className="text-slate-400 font-mono text-[11px]">
              {activeDeviceCount} {activeDeviceCount === 1 ? 'Device' : 'Devices'}
            </span>
            <span className="text-slate-600 font-mono text-[11px]">|</span>
            <span className={cn(
              "font-mono text-[11px]",
              syncState === 'synced' ? "text-emerald-400/90" : syncState === 'syncing' ? "text-amber-400" : "text-red-400"
            )}>
              {syncState === 'synced' ? 'Sync 100%' : syncState === 'syncing' ? `Queue ${localQueueCount}` : 'Offline'}
            </span>
          </button>

          {/* Interactive Popover for Detailed Telemetry */}
          <AnimatePresence>
            {statusFlyoutOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setStatusFlyoutOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  className="absolute left-1/2 -translate-x-1/2 mt-1.5 w-72 bg-[#131823] border border-white/[0.08] rounded-[6px] shadow-2xl z-50 p-3 space-y-2.5 text-xs select-none"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">System Telemetry</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-[3px] border border-emerald-500/20">
                      Operational
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Hub Connectivity</span>
                      <span className="font-mono text-slate-200">{isOnline ? 'Active (WebSocket Mesh)' : 'Disconnected'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Paired Hardware</span>
                      <span className="font-mono text-slate-200">{activeDeviceCount} Online Nodes</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Local Buffer Queue</span>
                      <span className="font-mono text-slate-200">{localQueueCount} pending items</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Cloud Sync Engine</span>
                      <span className="font-mono text-slate-200">{syncState === 'synced' ? 'Synchronized (0ms latency)' : 'Sync In Progress'}</span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* ── ZONE 3 (RIGHT): System Telemetry, Notifications & User ── */}
        <div className="flex items-center gap-2.5">
          {updateReady && (
            <Link href="/settings/updates" prefetch={true}>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono hover:bg-blue-500/15 transition-colors cursor-pointer">
                <Zap size={11} />
                <span>v{updateVersion} ready</span>
              </div>
            </Link>
          )}

          <NotificationBell />

          <div className="h-4 w-[1px] bg-white/[0.08]" />

          <LanguageSwitcher />

          {branches.length > 1 && (
            <>
              <div className="h-4 w-[1px] bg-white/[0.08]" />
              <select
                value={currentBranchId || 'all'}
                onChange={e => {
                  const id = e.target.value
                  if (id === 'all') {
                    clearBranch()
                  } else {
                    const branch = branches.find((b: any) => b.id === id)
                    if (branch) {
                      setBranch(
                        branch.id,
                        branch.name,
                        branch.is_headquarters
                      )
                    }
                  }
                }}
                className="bg-[#131823] border border-white/[0.08] text-slate-300 text-xs px-2 py-1 outline-none focus:border-white/[0.16] cursor-pointer rounded-[4px]"
              >
                <option value="all">All Branches</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.is_headquarters ? ' (HQ)' : ''}
                  </option>
                ))}
              </select>
            </>
          )}

          <div className="h-4 w-[1px] bg-white/[0.08]" />

          {/* User Workspace Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              data-tour="user-menu"
              className="flex items-center gap-2 p-1 rounded-[4px] hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.06] cursor-pointer"
            >
              <div className="w-6 h-6 rounded-[4px] bg-slate-900 border border-white/[0.08] flex items-center justify-center text-[10px] font-mono text-slate-300 overflow-hidden flex-shrink-0">
                {(profile?.logo_url || profile?.avatar_url) ? (
                  <img
                    src={profile.logo_url || profile.avatar_url}
                    alt="Brand"
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  (profile?.owner_name || profile?.business_name || 'G')[0].toUpperCase()
                )}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-[12px] font-medium text-slate-200 truncate max-w-[120px]">
                  {profile?.business_name || 'Gold She Garments'}
                </p>
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsProfileOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-1.5 w-48 bg-[#131823] border border-white/[0.08] rounded-[6px] shadow-2xl z-50 py-1"
                  >
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                      <p className="text-[12px] font-medium text-slate-200 truncate">
                        {profile?.business_name || 'Gold She Garments'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {profile?.owner_name || 'Administrator'}
                      </p>
                    </div>
                    
                    <Link 
                      href="/settings"
                      prefetch={true}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      Settings & Hub
                    </Link>
                    <button 
                      onClick={async () => {
                        setIsProfileOpen(false);
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
                      className="flex items-center w-full px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left border-t border-white/[0.06] cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2" />
                      Log Out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>


      
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        trigger="manual"
      />
    </>
  )
})
