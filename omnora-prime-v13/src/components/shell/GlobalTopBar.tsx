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
    const interval = setInterval(check, 15000)
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

  return (
    <>
      <header className={cn(
        "h-14 border-b border-noxis-border flex items-center px-6 bg-noxis-bg/80 backdrop-blur-[20px] sticky z-40 w-full",
        isElectron ? "top-10" : "top-0"
      )}>
        {/* LEFT: Search */}
        <div className="flex-1 flex items-center">
          <div className="relative group w-[240px]" data-tour="search-bar">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-noxis-text-muted group-focus-within:text-noxis-accent transition-colors" />
            <input 
              type="text"
              placeholder="Search anything..."
              onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
              readOnly
              className="w-full h-9 pl-9 pr-4 bg-noxis-overlay border border-noxis-border rounded-full text-[11px] text-noxis-text placeholder:text-noxis-text-muted focus:outline-none focus:border-noxis-accent transition-all cursor-pointer"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-noxis-border bg-noxis-overlay text-[9px] text-noxis-text-muted font-mono">
              Ctrl+K
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.dispatchEvent(new CustomEvent('sentinel:open'))}
            className="ml-4 p-2 bg-noxis-overlay border border-noxis-border rounded-full text-noxis-accent hover:bg-noxis-accent/10 transition-all group relative"
            title="Sentinel AI Assistant (Ctrl+Shift+S)"
          >
            <Mic size={14} className="group-hover:animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-noxis-accent rounded-full border border-noxis-bg animate-ping" />
          </motion.button>
        </div>

        {/* CENTER: The Pulse */}
        <div className="flex items-center space-x-8" data-tour="hub-status">
          {/* Hub Connection */}
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center justify-center w-1.5 h-1.5 flex-shrink-0">
              <div className={cn("w-1.5 h-1.5 rounded-full z-10 transition-all duration-300", isOnline ? "bg-[#39FF14] shadow-[0_0_8px_#39FF14]" : "bg-red-500 shadow-[0_0_8px_#EF4444]")} />
              {isOnline && (
                <motion.div 
                  animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0.2, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-[#39FF14] rounded-full"
                />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-noxis-text-muted">
              {isOnline ? 'Hub Online' : 'Hub Offline'}
            </span>
          </div>

          {/* Connected Devices */}
          <div className="flex items-center space-x-2 px-6 border-x border-noxis-border">
            <Smartphone size={14} className="text-gray-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-noxis-text">
              {bridgeDeviceCount !== null ? bridgeDeviceCount : deviceCount} {(bridgeDeviceCount !== null ? bridgeDeviceCount : deviceCount) === 1 ? 'Device' : 'Devices'}
            </span>
          </div>

          {/* Sync Status */}
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center justify-center w-1.5 h-1.5 flex-shrink-0">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full z-10 transition-all duration-300", 
                syncState === 'synced' ? 'bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]' : 
                syncState === 'syncing' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-red-500 shadow-[0_0_8px_#EF4444]'
              )} />
              {syncState === 'synced' && (
                <motion.div 
                  animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0.2, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-[#00E5FF] rounded-full"
                />
              )}
              {syncState === 'syncing' && (
                <motion.div 
                  animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0.2, 0.8] }}
                  transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-amber-400 rounded-full"
                />
              )}
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              syncState === 'synced' ? 'text-[#00E5FF]' : 
              syncState === 'syncing' ? 'text-amber-500' : 'text-red-500'
            )}>
              {syncState === 'synced' ? 'Synced' : syncState === 'syncing' ? 'Syncing...' : 'Offline'}
            </span>
          </div>

          <CloudSyncIndicator />

          {updateReady && (
            <Link href="/settings/updates">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold animate-pulse hover:bg-emerald-500/25 transition-colors cursor-pointer ml-3">
                <Zap size={10} />
                v{updateVersion} ready
              </div>
            </Link>
          )}
        </div>

        {/* RIGHT: Notifications & User */}
        <div className="flex-1 flex items-center justify-end space-x-4">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10 transition-colors"
            title="Share feedback"
          >
            ★ Feedback
          </button>

          <NotificationBell />

          <div className="h-6 w-[1px] bg-noxis-border mx-2" />

          <LanguageSwitcher />

          <div className="h-6 w-[1px] bg-noxis-border mx-2" />

          {branches.length > 1 && (
            <div className="relative flex items-center">
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
                className="bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-1.5 outline-none focus:border-[#60A5FA]/40 cursor-pointer rounded-sm"
              >
                <option value="all">
                  All Branches
                </option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.is_headquarters ? ' (HQ)' : ''}
                  </option>
                ))}
              </select>
              <div className="h-6 w-[1px] bg-noxis-border mx-2" />
            </div>
          )}

          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              data-tour="user-menu"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              {(() => {
                const initials = (() => {
                  const name = (profile as any)?.owner_name?.trim() || profile?.business_name?.trim() || 'N';
                  const parts = name.split(/\s+/).filter(Boolean);
                  if (parts.length >= 2) {
                    return (parts[0][0] + parts[1][0]).toUpperCase();
                  }
                  return name.substring(0, Math.min(name.length, 2)).toUpperCase();
                })();

                if (profile?.avatar_type === 'custom' && profile?.avatar_url) {
                  return (
                    <div className="w-8 h-8 rounded-full border border-noxis-border bg-noxis-overlay overflow-hidden flex items-center justify-center relative">
                      <Image src={profile.avatar_url} alt="Profile" width={32} height={32} className="w-full h-full object-cover" />
                    </div>
                  );
                }

                // Fallback to preset
                const presetId = Number(profile?.avatar_preset_id || 1);
                const preset = PRESET_AVATARS.find(p => p.id === presetId) || PRESET_AVATARS[0];

                return (
                  <div 
                    style={{ borderColor: preset.border }}
                    className="w-8 h-8 rounded-full border flex items-center justify-center overflow-hidden bg-black/40 shadow-[0_0_8px_rgba(34,211,238,0.2)] relative"
                  >
                    <Image src={preset.src} alt="Preset Avatar" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                );
              })()}
              <div className="text-left hidden md:block">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-noxis-text uppercase tracking-tight truncate max-w-[120px]">
                    {profile?.business_name || 'Noxis Hub'}
                  </p>
                  <TierBadge />
                </div>
                <p className="text-[9px] text-noxis-text-muted font-bold uppercase tracking-widest">Administrator</p>
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
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-noxis-surface border border-noxis-border rounded-sm shadow-2xl z-50 py-1"
                  >
                    <div className="px-4 py-2 border-b border-noxis-border">
                      <p className="text-[10px] font-bold text-noxis-text uppercase tracking-tight truncate">
                        {profile?.business_name || 'Noxis Hub'}
                      </p>
                      <p className="text-[8px] text-noxis-text-muted font-mono uppercase tracking-widest mt-0.5">
                        Administrator
                      </p>
                    </div>
                    
                    <Link 
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center w-full px-4 py-2 text-[10px] font-bold text-noxis-text-muted hover:text-noxis-text hover:bg-noxis-overlay transition-colors uppercase tracking-wider"
                    >
                      <Settings className="w-3.5 h-3.5 mr-2" />
                      Settings
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
                      className="flex items-center w-full px-4 py-2 text-[10px] font-bold text-noxis-danger hover:bg-noxis-danger/10 transition-colors text-left uppercase tracking-wider border-t border-noxis-border"
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
