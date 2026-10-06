'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'

export default React.memo(function TitleBar() {
  const pathname = usePathname()
  const [isMaximized, setIsMaximized] = useState(false)
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    // Detect Electron
    if (typeof window !== 'undefined' && (window as any).electronWindow) {
      const electron = (window as any).electronWindow
      setIsElectron(true)
      setIsMaximized(electron.isMaximized())
      
      const cleanup = electron.onMaximizeChange((max: boolean) => {
        setIsMaximized(max)
      })
      return cleanup
    }
  }, [])

  const handleMinimize = () => (window as any).electronWindow?.minimize()
  const handleMaximize = () => (window as any).electronWindow?.maximize()
  const handleClose = () => (window as any).electronWindow?.close()

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    const parts = pathname.split('/').filter(Boolean)
    return parts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
    ).join(' › ')
  }

  return (
    <div 
      className="h-10 w-full border-b flex items-center justify-between z-[100] select-none sticky top-0 transition-colors duration-200"
      style={{ 
        backgroundColor: 'var(--color-topbar-bg, #0B0E14)',
        borderColor: 'var(--color-card-border, rgba(255,255,255,0.06))'
      }}
    >
      {/* Draggable Area */}
      <div 
        className="flex-1 h-full flex items-center px-4 space-x-4 cursor-default"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center space-x-3">
          <Image src="/logos/noxis.png" alt="Noxis" width={24} height={24} />
          <span 
            className="text-[11px] font-black tracking-[0.25em]"
            style={{ color: 'var(--color-text, #ffffff)' }}
          >
            NOXIS
          </span>
        </div>
        
        <div 
          className="h-4 w-[1px] mx-2"
          style={{ backgroundColor: 'var(--color-card-border, rgba(255,255,255,0.1))' }}
        />
        
        <span 
          className="text-[10px] font-bold uppercase tracking-widest truncate"
          style={{ color: 'var(--color-text-muted, #94a3b8)' }}
        >
          {getPageTitle()}
        </span>
      </div>

      {/* Help & About */}
      <div className="flex items-center space-x-4 px-4 h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <Link 
          href="/settings/about"
          className="w-8 h-full flex items-center justify-center transition-all opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 rounded-[3px]"
          style={{ color: 'var(--color-text-muted, #94a3b8)' }}
          title="Help & About Noxis"
        >
          <span className="text-[11px] font-black font-mono">?</span>
        </Link>
      </div>

      {/* Window Controls */}
      {isElectron && (
        <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button 
            onClick={handleMinimize}
            className="w-10 h-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-text, #cbd5e1)' }}
            title="Minimize"
          >
            <span className="text-lg">−</span>
          </button>
          
          <button 
            onClick={handleMaximize}
            className="w-10 h-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-text, #cbd5e1)' }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <span className="text-sm">{isMaximized ? '❐' : '□'}</span>
          </button>
          
          <button 
            onClick={handleClose}
            className="w-10 h-full flex items-center justify-center hover:bg-[#EF4444] hover:text-white transition-colors"
            style={{ color: 'var(--color-text, #cbd5e1)' }}
            title="Close"
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      )}
    </div>
  )
});
