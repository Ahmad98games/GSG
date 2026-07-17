'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useNotificationStore, AppNotification } from '@/stores/notificationStore'
import { Bell, Check, Trash, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const router = useRouter()
  const { notifications, markRead, markAllRead, remove, clearAll } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleNotificationClick = (n: AppNotification) => {
    markRead(n.id)
    setOpen(false)
    if (n.route) {
      router.push(n.route)
    }
  }

  const getTypeStyles = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
          bg: 'bg-emerald-500/10 border-emerald-500/20',
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
          bg: 'bg-amber-500/10 border-amber-500/20',
        }
      case 'error':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
          bg: 'bg-red-500/10 border-red-500/20',
        }
      default:
        return {
          icon: <Info className="w-3.5 h-3.5 text-blue-400" />,
          bg: 'bg-blue-500/10 border-blue-500/20',
        }
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 relative hover:bg-white/5 rounded-full transition-all duration-200 focus:outline-none"
        title="Notifications"
      >
        <Bell size={18} className="text-gray-400 hover:text-white transition-colors" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-red-500 text-[9px] font-black text-white flex items-center justify-center rounded-full border border-black shadow-lg"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 max-h-[480px] bg-[#0E1114]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50 flex flex-col rounded-sm overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-white">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <Check size={10} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-[350px] p-2 space-y-2 custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((n) => {
                  const styles = getTypeStyles(n.type)
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "p-3 rounded-sm border cursor-pointer transition-all duration-200 hover:bg-white/[0.04]",
                        n.read ? "bg-black/20 border-white/5 opacity-60" : "bg-white/[0.02] border-white/10",
                        n.read ? "" : "shadow-md shadow-black/20"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-1.5 rounded-sm border shrink-0 mt-0.5", styles.bg)}>
                          {styles.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={cn("text-[10px] font-bold uppercase truncate", n.read ? "text-gray-400" : "text-white")}>
                              {n.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                remove(n.id)
                              }}
                              className="text-gray-600 hover:text-red-400 transition-colors p-0.5"
                              title="Delete notification"
                            >
                              <Trash size={10} />
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1 leading-normal break-words">
                            {n.message}
                          </p>
                          <span className="text-[8px] text-gray-600 font-mono mt-2 block uppercase">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 opacity-25">
                  <Bell size={28} className="text-gray-500" strokeWidth={1.5} />
                  <p className="text-[9px] uppercase font-black tracking-widest text-center">No notifications yet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/10 flex justify-between">
                <button
                  onClick={clearAll}
                  className="text-[9px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest"
                >
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
