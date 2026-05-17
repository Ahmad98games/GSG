'use client'
import { useEffect } from 'react'
import { useThemeStore, applyThemeToDOM } from '@/stores/themeStore'

export function ThemeInitializer() {
  const { activeTheme, customAccentColor, customFinancialColor } = useThemeStore()
  
  useEffect(() => {
    applyThemeToDOM(activeTheme, customAccentColor, customFinancialColor)
  }, [activeTheme, customAccentColor, customFinancialColor])
  
  return null
}
