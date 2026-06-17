'use client'
import { useEffect } from 'react'
import { useThemeStore, applyThemeToDOM } from '@/stores/themeStore'

export function ThemeInitializer() {
  const { activeTheme, customAccentColor, customFinancialColor } = useThemeStore()
  
  useEffect(() => {
    applyThemeToDOM(activeTheme, customAccentColor, customFinancialColor)
  }, [activeTheme, customAccentColor, customFinancialColor])

  useEffect(() => {
    if (typeof window !== 'undefined' && ((window as any).electronAPI || (window as any).electronWindow)) {
      document.body.classList.add('electron-env')
    }
  }, [])
  
  return null
}
