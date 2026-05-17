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
    <div className="h-10 w-full bg-[#0A0C0F] border-b border-white/5 flex items-center justify-between z-[100] select-none sticky top-0">
      {/* Draggable Area */}
      <div 
        className="flex-1 h-full flex items-center px-4 space-x-4 cursor-default"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center space-x-3">
          <Image src="/logos/noxis.png" alt="Noxis" width={24} height={24} />
          <span className="text-[11px] font-black tracking-[0.25em] text-white">NOXIS</span>
        </div>
        
        <div className="h-4 w-[1px] bg-white/10 mx-2" />
        
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
          {getPageTitle()}
        </span>
      </div>

      {/* Help & About */}
      <div className="flex items-center space-x-4 px-4 h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>

        
        <Link 
          href="/settings/about"
          className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-white/5 hover:text-white transition-all"
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
            className="w-10 h-full flex items-center justify-center text-gray-400 hover:bg-[#1A1D21] hover:text-white transition-colors"
            title="Minimize"
          >
            <span className="text-lg">−</span>
          </button>
          
          <button 
            onClick={handleMaximize}
            className="w-10 h-full flex items-center justify-center text-gray-400 hover:bg-[#1A1D21] hover:text-white transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <span className="text-sm">{isMaximized ? '❐' : '□'}</span>
          </button>
          
          <button 
            onClick={handleClose}
            className="w-10 h-full flex items-center justify-center text-gray-400 hover:bg-[#EF4444] hover:text-white transition-colors"
            title="Close"
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      )}
    </div>
  )
});
