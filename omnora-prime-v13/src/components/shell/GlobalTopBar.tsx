'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Bell, Smartphone, Cloud, 
  ChevronRight, AlertTriangle, CheckCircle2,
  Settings, User, LogOut, Info, ShieldAlert,
  Wifi, WifiOff, Mic
} from 'lucide-react'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { usePersona } from '@/hooks/usePersona'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'
import LanguageSwitcher from './LanguageSwitcher'
import { useNoxisLocale } from '@/hooks/useLocale'
import { useTranslations } from 'next-intl'
import { TierBadge } from '../ui/TierBadge'

const PRESET_AVATARS = [
  { id: 1, bg: '#1e3a5f', border: '#60A5FA' },
  { id: 2, bg: '#1a2e1a', border: '#10B981' },
  { id: 3, bg: '#3d1a00', border: '#C5A059' },
  { id: 4, bg: '#2d1515', border: '#EF4444' },
  { id: 5, bg: '#1a1a2e', border: '#8B5CF6' },
  { id: 6, bg: '#0d2626', border: '#06B6D4' },
  { id: 7, bg: '#2e2a1a', border: '#F59E0B' },
  { id: 8, bg: '#1e1a2e', border: '#EC4899' },
  { id: 9, bg: '#141414', border: '#6B7280' },
  { id: 10, bg: '#1a1a1a', border: '#FFFFFF' },
];

export default React.memo(function GlobalTopBar() {
  const pathname = usePathname()
  const { profile } = useBusinessProfile()
  const { businessId } = usePersona()
  const { locale, isRTL } = useNoxisLocale()
  const t = useTranslations()
  const supabase = createClient()
  
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
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
    refetchInterval: 30000
  })

  // 2. Sync Status Query
  const { data: syncData, isError: isSyncError } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const res = await fetch('/api/sync/status')
      if (!res.ok) throw new Error('Sync Status API Error')
      return res.json()
    },
    refetchInterval: 10000,
    retry: 1
  })

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
    refetchInterval: 15000
  })

  const syncState = !isOnline ? 'offline' : (isSyncError ? 'error' : (syncData?.pending_count > 0 ? 'syncing' : 'synced'))

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
          <div className="relative group w-[240px]">
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
        <div className="flex items-center space-x-8">
          {/* Hub Connection */}
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center justify-center">
              <div className={cn("w-2 h-2 rounded-full z-10", isOnline ? "bg-emerald-500" : "bg-red-500")} />
              {isOnline && (
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-emerald-500 rounded-full"
                />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              {isOnline ? 'Hub Online' : 'Hub Offline'}
            </span>
          </div>

          {/* Connected Devices */}
          <div className="flex items-center space-x-2 px-6 border-x border-noxis-border">
            <Smartphone size={14} className="text-gray-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">
              {deviceCount} {deviceCount === 1 ? 'Device' : 'Devices'}
            </span>
          </div>

          {/* Sync Status */}
          <div className="flex items-center space-x-2">
            <Cloud size={14} className={cn(
              syncState === 'synced' ? 'text-emerald-500' : 
              syncState === 'syncing' ? 'text-amber-500 animate-pulse' : 'text-red-500'
            )} />
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              syncState === 'synced' ? 'text-emerald-500' : 
              syncState === 'syncing' ? 'text-amber-500' : 'text-red-500'
            )}>
              {syncState === 'synced' ? 'Synced' : syncState === 'syncing' ? 'Syncing...' : syncState === 'error' ? 'Sync Error' : 'Offline'}
            </span>
          </div>
        </div>

        {/* RIGHT: Notifications & User */}
        <div className="flex-1 flex items-center justify-end space-x-4">
          <button 
            onClick={() => setIsNotificationPanelOpen(true)}
            className="p-2 relative hover:bg-noxis-overlay rounded-full transition-colors"
          >
            <Bell size={18} className="text-noxis-text-muted" />
            {alerts.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-noxis-danger text-[9px] font-black text-white flex items-center justify-center rounded-full border-2 border-noxis-bg">
                {alerts.length}
              </span>
            )}
          </button>

          <div className="h-6 w-[1px] bg-noxis-border mx-2" />

          <LanguageSwitcher />

          <div className="h-6 w-[1px] bg-noxis-border mx-2" />

          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
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
                  <div className="w-8 h-8 rounded-full border border-noxis-border bg-noxis-overlay overflow-hidden flex items-center justify-center">
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                );
              }

              // Fallback to preset
              const presetId = Number(profile?.avatar_preset_id || 1);
              const preset = PRESET_AVATARS.find(p => p.id === presetId) || PRESET_AVATARS[0];

              return (
                <div 
                  style={{ backgroundColor: preset.bg, borderColor: preset.border }}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black text-white font-mono overflow-hidden"
                >
                  {initials}
                </div>
              );
            })()}
            <div className="text-left hidden md:block">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-white uppercase tracking-tight truncate max-w-[120px]">
                  {profile?.business_name || 'Noxis Hub'}
                </p>
                <TierBadge />
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Administrator</p>
            </div>
          </button>
        </div>
      </header>

      {/* Notification Panel */}
      <AnimatePresence>
        {isNotificationPanelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationPanelOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className={cn(
                "fixed top-0 right-0 h-full w-[320px] bg-noxis-surface border-l border-noxis-border z-[101] flex flex-col shadow-2xl",
                isElectron ? "top-10" : "top-0"
              )}
            >
              <div className="h-14 border-b border-noxis-border flex items-center justify-between px-6">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white">Notifications</h3>
                <button className="text-[9px] font-bold text-electric-blue uppercase tracking-widest hover:underline">Mark all read</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {alerts.length > 0 ? alerts.map((alert: any) => (
                  <div key={alert.id} className="p-4 bg-noxis-overlay border border-noxis-border hover:bg-noxis-overlay-hover transition-all cursor-pointer group rounded-sm">
                    <div className="flex space-x-3">
                      <div className={cn(
                        "p-2 rounded-sm h-fit",
                        alert.severity === 'critical' ? 'bg-noxis-danger/10 text-noxis-danger' : 'bg-noxis-financial/10 text-noxis-financial'
                      )}>
                        <ShieldAlert size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-noxis-text uppercase leading-tight">{alert.alert_type.replace(/_/g, ' ')}</p>
                        <p className="text-[9px] text-noxis-text-muted mt-1 line-clamp-2">{alert.payload?.message || "Operational variance detected."}</p>
                        <p className="text-[8px] text-noxis-text-muted mt-2 font-mono uppercase">{new Date(alert.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                    <CheckCircle2 size={40} strokeWidth={1} />
                    <p className="text-[10px] uppercase font-black tracking-widest text-center">No alerts — all systems normal ✓</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  )
});
