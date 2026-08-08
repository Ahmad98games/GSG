'use client'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, CheckCheck, ExternalLink, ShieldAlert, Smartphone, DollarSign, Package, BrainCircuit } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface NotificationItem {
  id: string
  type: 'mobile_sync' | 'financial' | 'inventory_alert' | 'security' | 'intelligence'
  title: string
  description: string
  icon?: string
  severity?: 'critical' | 'warning' | 'info'
  timestamp: string
  read: boolean
  action?: {
    label: string
    href: string
  }
}

// Global Event Emitter for notify()
const NOTIFICATION_EVENT = 'noxis_notify_event'

export function notify(payload: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) {
  const newNotification: NotificationItem = {
    ...payload,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: newNotification }))
  }
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'mobile_sync',
      title: 'Attendance Synced',
      description: '47 karigars marked via Mobile Companion',
      icon: '📱',
      timestamp: '2 min ago',
      read: false,
      action: { label: 'View Attendance', href: '/karigars' },
    },
    {
      id: 'notif-2',
      type: 'inventory_alert',
      title: 'Low Stock Warning',
      description: 'Sufi Fabric below reorder level (2 meters remaining)',
      icon: '📦',
      severity: 'warning',
      timestamp: '15 min ago',
      read: false,
      action: { label: 'Reorder', href: '/inventory?filter=low-stock' },
    },
    {
      id: 'notif-[#]',
      type: 'financial',
      title: 'Overdue Invoice',
      description: 'Al-Hameed Textile — PKR 45,000 overdue by 35 days',
      icon: '💰',
      severity: 'critical',
      timestamp: '1 hour ago',
      read: false,
      action: { label: 'Send Reminder', href: '/parties' },
    },
  ])

  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)

  // Listen for incoming notify() events
  useEffect(() => {
    const handleNewNotif = (e: Event) => {
      const detail = (e as CustomEvent<NotificationItem>).detail
      if (detail) {
        setNotifications(prev => [detail, ...prev])
      }
    }
    window.addEventListener(NOTIFICATION_EVENT, handleNewNotif)
    return () => window.removeEventListener(NOTIFICATION_EVENT, handleNewNotif)
  }, [])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const TYPE_ICONS: Record<string, { bg: string; border: string; text: string }> = {
    mobile_sync: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
    financial: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    inventory_alert: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    security: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
    intelligence: { bg: 'bg-[#C5A059]/10', border: 'border-[#C5A059]/20', text: 'text-[#C5A059]' },
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
        title="Notification Center"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-in Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0A0C0F] border border-white/10 rounded-sm shadow-2xl z-50 overflow-hidden"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#0F1114]">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-[#60A5FA]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[9px] bg-[#60A5FA]/20 text-[#60A5FA] px-1.5 py-0.5 rounded font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck size={12} />
                    <span>Mark read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-white p-1"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-white/4">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-600 text-xs">
                  No new notifications
                </div>
              ) : (
                notifications.map(item => {
                  const style = TYPE_ICONS[item.type] || TYPE_ICONS.intelligence
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 transition-colors relative group ${
                        item.read ? 'opacity-60 bg-transparent' : 'bg-white/[0.015]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Type Icon Badge */}
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-sm border ${style.bg} ${style.border}`}>
                          {item.icon || '⚡'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p className="text-xs font-bold text-white truncate">
                              {item.title}
                            </p>
                            <span className="text-[9px] text-gray-600 whitespace-nowrap">
                              {item.timestamp}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-400 leading-snug">
                            {item.description}
                          </p>

                          {/* Action Button */}
                          {item.action && (
                            <button
                              onClick={() => {
                                router.push(item.action!.href)
                                setIsOpen(false)
                              }}
                              className="mt-2 text-[10px] font-bold text-[#60A5FA] hover:underline flex items-center gap-1"
                            >
                              <span>{item.action.label}</span>
                              <ExternalLink size={9} />
                            </button>
                          )}
                        </div>

                        {/* Dismiss X */}
                        <button
                          onClick={() => dismiss(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 p-1 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
