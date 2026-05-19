'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { useNoxisLocale } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  isBeta?: boolean
}

const LANGUAGES: Record<string, Language[]> = {
  latin: [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isBeta: true },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', isBeta: true },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', isBeta: true },
  ],
  rtl: [
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isBeta: true },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', isBeta: true },
  ],
  asian: [
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', isBeta: true },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', isBeta: true },
  ]
}

export default function LanguageSwitcher() {
  const { locale, changeLocale } = useNoxisLocale()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentLang = Object.values(LANGUAGES).flat().find(l => l.code === locale) || LANGUAGES.latin[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-1.5 bg-noxis-overlay border border-noxis-border rounded-sm hover:bg-noxis-overlay-hover transition-all group"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-noxis-text hidden md:block">
          {currentLang.code}
        </span>
        <ChevronDown size={14} className={cn("text-gray-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-64 bg-noxis-surface border border-noxis-border shadow-2xl z-[100] overflow-hidden rounded-sm"
          >
            <div className="p-2 border-b border-noxis-border bg-noxis-overlay">
              <p className="text-[9px] font-black uppercase tracking-widest text-noxis-text-muted flex items-center">
                <Globe size={10} className="mr-2" />
                Select Platform Language
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar p-1">
              {Object.entries(LANGUAGES).map(([group, list]) => (
                <div key={group} className="mb-2 last:mb-0">
                  <div className="px-3 py-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-noxis-text-muted">
                      {group} Script
                    </p>
                  </div>
                  {list.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLocale(lang.code)
                        setIsOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-left hover:bg-noxis-overlay transition-colors group",
                        locale === lang.code && "bg-electric-blue/10"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{lang.flag}</span>
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-[11px] font-bold text-noxis-text",
                            lang.code === 'ur' && "font-urdu"
                          )}>
                            {lang.nativeName}
                          </span>
                          <span className="text-[9px] text-noxis-text-muted uppercase tracking-tighter">
                            {lang.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {lang.isBeta && (
                          <span className="px-1 py-0.5 bg-amber-500/10 text-amber-500 text-[7px] font-black rounded-[1px] border border-amber-500/20">
                            BETA
                          </span>
                        )}
                        {locale === lang.code && (
                          <Check size={12} className="text-electric-blue" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
