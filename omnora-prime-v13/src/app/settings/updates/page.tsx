'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCcw, CheckCircle2, AlertCircle, History, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function UpdatesPage() {
  const [checking, setChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<string | null>(null)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'available' | 'up-to-date' | 'error'>('idle')
  const [version, setVersion] = useState('13.0.0') // Default or from package.json
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [logContent, setLogContent] = useState<string[]>([])

  useEffect(() => {
    // Load last check time from localStorage
    const savedLastCheck = localStorage.getItem('noxis_last_update_check')
    if (savedLastCheck) setLastCheck(savedLastCheck)

    // Load auto-update setting
    const savedAutoUpdate = localStorage.getItem('noxis_auto_update_enabled')
    if (savedAutoUpdate !== null) setAutoUpdate(savedAutoUpdate === 'true')

    // Get version from electron if available
    if ((window as any).electronWindow) {
      // Version is usually injected or can be fetched
      // For now we use the one from package.json
    }
  }, [])

  const checkForUpdates = async () => {
    if (checking) return
    setChecking(true)
    setUpdateStatus('idle')

    try {
      if ((window as any).electronWindow) {
        const result = await (window as any).electronWindow.checkForUpdates()
        // result.updateInfo exists if update available
        if (result?.updateInfo) {
          setUpdateStatus('available')
        } else {
          setUpdateStatus('up-to-date')
        }
      } else {
        // Mock for web dev
        await new Promise(r => setTimeout(r, 2000))
        setUpdateStatus('up-to-date')
      }
      
      const now = new Date().toLocaleString()
      setLastCheck(now)
      localStorage.setItem('noxis_last_update_check', now)
    } catch (err) {
      setUpdateStatus('error')
    } finally {
      setChecking(false)
    }
  }

  const toggleAutoUpdate = (val: boolean) => {
    setAutoUpdate(val)
    localStorage.setItem('noxis_auto_update_enabled', String(val))
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-green-500" />
          Software Updates
        </h1>
        <p className="text-gray-400 text-sm">
          Manage your Noxis Hub version and update preferences.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="bg-[#121417] border border-white/5 rounded-xl p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Current Version</span>
              <div className="text-2xl font-mono text-white">v{version}</div>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight",
              updateStatus === 'up-to-date' ? "bg-green-500/10 text-green-500" :
              updateStatus === 'available' ? "bg-blue-500/10 text-blue-500" :
              updateStatus === 'error' ? "bg-amber-500/10 text-amber-500" :
              "bg-white/5 text-gray-400"
            )}>
              {updateStatus === 'up-to-date' ? 'Up to date' :
               updateStatus === 'available' ? 'Update Available' :
               updateStatus === 'error' ? 'Connection / Dev Mode' : 'Ready'}
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={checkForUpdates}
              disabled={checking}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={cn("w-4 h-4", checking && "animate-spin")} />
              {checking ? 'Checking...' : 'Check for Updates'}
            </button>
            
            <div className="text-[10px] text-center text-gray-500">
              Last checked: {lastCheck || 'Never'}
            </div>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-[#121417] border border-white/5 rounded-xl p-6 space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RefreshCcw className="w-4 h-4 text-gray-400" />
            Update Settings
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <div className="text-sm font-medium text-white">Automatic Updates</div>
                <div className="text-[10px] text-gray-500">Check and download updates in background</div>
              </div>
              <button
                onClick={() => toggleAutoUpdate(!autoUpdate)}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative",
                  autoUpdate ? "bg-green-600" : "bg-gray-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                  autoUpdate ? "right-1" : "left-1"
                )} />
              </button>
            </div>

            <div className="p-4 border border-blue-500/20 bg-blue-500/5 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-[11px] text-blue-300 leading-relaxed">
                Noxis checks for updates every 4 hours. Critical security patches are prioritized.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Update History / Logs */}
      <div className="bg-[#121417] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            Update History & Diagnostics
          </h3>
        </div>
        <div className="p-4 font-mono text-[10px] text-gray-500 h-64 overflow-y-auto bg-black/20">
          {logContent.length > 0 ? (
            logContent.map((line, i) => <div key={i} className="py-0.5">{line}</div>)
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-50 italic">
              <History className="w-8 h-8 mb-2" />
              Logs will appear here after the first update check
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
