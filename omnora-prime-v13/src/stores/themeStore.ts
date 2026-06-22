import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Theme, ThemeId, themes,
  getThemeForIndustry } from '@/lib/themes/themes'

export type ThemeMode = 'dark' | 'light' | 'auto'

interface ThemeStore {
  activeThemeId: ThemeId
  activeTheme: Theme
  mode: ThemeMode
  isPanelOpen: boolean
  customAccentColor: string | null
  customFinancialColor: string | null
  setTheme: (themeId: ThemeId, enableTransition?: boolean) => void
  setMode: (mode: ThemeMode) => void
  setThemeByIndustry: (industry: string, enableTransition?: boolean) => void
  setIsPanelOpen: (isOpen: boolean) => void
  setCustomColors: (accent: string | null, financial: string | null, enableTransition?: boolean) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      activeThemeId: 'electric-slate',
      activeTheme: themes.find(t => t.id === 'electric-slate') || themes[0],
      mode: 'dark',
      isPanelOpen: false,
      customAccentColor: null,
      customFinancialColor: null,
      
      setTheme: (themeId, enableTransition = true) => {
        const theme = themes.find(t => t.id === themeId)
          || themes[0]
        set({ activeThemeId: themeId, activeTheme: theme })
        applyThemeToDOM(theme, get().customAccentColor, get().customFinancialColor, enableTransition)
      },

      setMode: (mode) => {
        set({ mode })
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const effectiveThemeId = mode === 'auto' 
          ? (systemPrefersDark ? 'electric-slate' : 'light-slate')
          : (mode === 'dark' ? 'electric-slate' : 'light-slate')
        
        get().setTheme(effectiveThemeId as ThemeId, true)
      },
      
      setThemeByIndustry: (industry, enableTransition = true) => {
        const theme = getThemeForIndustry(industry)
        set({
          activeThemeId: theme.id,
          activeTheme: theme
        })
        applyThemeToDOM(theme, get().customAccentColor, get().customFinancialColor, enableTransition)
      },

      setIsPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),

      setCustomColors: (accent, financial, enableTransition = true) => {
        set({ customAccentColor: accent, customFinancialColor: financial })
        applyThemeToDOM(get().activeTheme, accent, financial, enableTransition)
      }
    }),
    { 
      name: 'noxis-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Setup system listener if mode is auto
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handler = (e: MediaQueryListEvent) => {
            if (state.mode === 'auto') {
              const themeId = e.matches ? 'electric-slate' : 'light-slate'
              state.setTheme(themeId as ThemeId, true)
            }
          }
          mediaQuery.addEventListener('change', handler)

          // Initial apply
          if (state.mode === 'auto') {
            const themeId = mediaQuery.matches ? 'electric-slate' : 'light-slate'
            state.setTheme(themeId as ThemeId, false)
          } else {
            applyThemeToDOM(state.activeTheme, state.customAccentColor, state.customFinancialColor, false)
          }
        }
      }
    }
  )
)

export function applyThemeToDOM(
  theme: Theme, 
  customAccent?: string | null, 
  customFinancial?: string | null,
  enableTransition: boolean = false
) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  
  if (enableTransition) {
    // Add temporary transition class to root
    root.classList.add('theme-transitioning')
  }
  
  root.style.setProperty('--color-bg', theme.colors.background)
  root.style.setProperty('--color-surface', theme.colors.surface)
  root.style.setProperty('--color-primary', customAccent || theme.colors.primary)
  root.style.setProperty('--color-financial', customFinancial || theme.colors.financial)
  root.style.setProperty('--color-success', theme.colors.success)
  root.style.setProperty('--color-danger', theme.colors.danger)
  root.style.setProperty('--color-text', theme.colors.text)
  root.style.setProperty('--color-text-muted', theme.colors.textMuted)
  root.style.setProperty('--color-border', theme.colors.border)
  root.style.setProperty('--color-noxis-accent', theme.colors.primary)

  // Toggle Dark/Light Classes for Framework Consistency
  if (theme.id === 'light-slate') {
    root.classList.remove('dark')
    root.classList.add('light')
  } else {
    root.classList.remove('light')
    root.classList.add('dark')
  }

  // Font Switching
  if (theme.uiFont && theme.uiFont !== 'Inter') {
    root.style.setProperty('--font-ui', theme.uiFont)
  } else {
    root.style.removeProperty('--font-ui')
  }

  if (enableTransition) {
    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 500)
  }
}
