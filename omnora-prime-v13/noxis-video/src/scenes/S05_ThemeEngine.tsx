import {
  AbsoluteFill,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from 'remotion'
import { NoxisWindowFrame } from '../components/NoxisWindowFrame'
import { NoxisSidebar } from '../components/NoxisSidebar'
import { Windows11Cursor, CursorWaypoint } from '../components/Windows11Cursor'
import { PitchHUD } from '../components/PitchHUD'

const THEMES = [
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan & Deep Obsidian',
    accent: '#06B6D4',
    bg: '#060708',
    card: '#0B0E14',
    border: 'rgba(6, 182, 212, 0.25)',
    tag: 'Default High-Contrast',
  },
  {
    id: 'textile-gold',
    name: 'Textile Gold & Obsidian',
    accent: '#C5A059',
    bg: '#070706',
    card: '#12110D',
    border: 'rgba(197, 160, 89, 0.3)',
    tag: 'Textile & Garment Mills',
  },
  {
    id: 'emerald-forge',
    name: 'Emerald Forge & Carbon',
    accent: '#10B981',
    bg: '#050807',
    card: '#09120E',
    border: 'rgba(16, 185, 129, 0.3)',
    tag: 'Industrial Wholesale',
  },
]

// Calibrated 1920x1080 screen coordinates
const THEME_WAYPOINTS: CursorWaypoint[] = [
  { frame: 0, x: 1000, y: 200, type: 'arrow' },
  { frame: 45, x: 1646, y: 210, type: 'pointer', click: true, label: 'Select: Cyber Cyan' },
  { frame: 95, x: 1646, y: 270, type: 'pointer', click: true, label: 'Select: Textile Gold' },
  { frame: 170, x: 1646, y: 330, type: 'pointer', click: true, label: 'Select: Emerald Forge' },
  { frame: 240, x: 1646, y: 330, type: 'arrow' },
]


export const S05_ThemeEngine: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  // Determine active theme strictly synchronized with cursor clicks!
  let activeThemeIndex = 0
  if (f >= 95 && f < 170) activeThemeIndex = 1
  else if (f >= 170) activeThemeIndex = 2

  const activeTheme = THEMES[activeThemeIndex]

  // Theme modal entrance spring
  const modalScale = spring({
    frame: f - 15,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.7 },
  })

  return (
    <AbsoluteFill style={{ background: activeTheme.bg }}>
      <NoxisWindowFrame pageTitle="SYSTEM SETTINGS · UNIVERSAL THEMES" activeThemeAccent={activeTheme.accent}>
        <NoxisSidebar activeId="settings" accentColor={activeTheme.accent} />

        <div className="flex-1 flex overflow-hidden relative p-7 font-sans pb-20">
          {/* Main settings background view */}
          <div className="flex-1 flex flex-col space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <span>🎨</span>
                  <span>UNIVERSAL VISUAL THEME ENGINE</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Dynamic multi-theme synchronization across TitleBar, Sidebar, KPI Cards, POS, and Modals.
                </p>
              </div>

              <div
                className="px-3 py-1.5 rounded-sm border font-mono text-xs font-bold transition-all"
                style={{
                  color: activeTheme.accent,
                  borderColor: activeTheme.border,
                  background: `${activeTheme.accent}12`,
                }}
              >
                <span>Active: {activeTheme.name}</span>
              </div>
            </div>

            {/* Preview Sample Cards showing theme responsiveness */}
            <div className="grid grid-cols-3 gap-4">
              <div
                className="p-4 rounded-sm border"
                style={{
                  background: activeTheme.card,
                  borderColor: activeTheme.border,
                  transition: 'background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease',
                }}
              >
                <span className="text-[10px] font-mono uppercase text-gray-400">Total Monthly Revenue</span>
                <p
                  className="text-2xl font-black font-mono mt-1"
                  style={{
                    color: activeTheme.accent,
                    transition: 'color 0.4s ease',
                  }}
                >
                  PKR 284,500
                </p>
                <span className="text-[9px] text-gray-500 font-mono">100% theme token aligned</span>
              </div>

              <div
                className="p-4 rounded-sm border"
                style={{
                  background: activeTheme.card,
                  borderColor: activeTheme.border,
                  transition: 'background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease',
                }}
              >
                <span className="text-[10px] font-mono uppercase text-gray-400">Active Karigar Floor</span>
                <p
                  className="text-2xl font-black font-mono mt-1"
                  style={{
                    color: activeTheme.accent,
                    transition: 'color 0.4s ease',
                  }}
                >
                  87 Present
                </p>
                <span className="text-[9px] text-gray-500 font-mono">Automatic contrast adjustment</span>
              </div>

              <div
                className="p-4 rounded-sm border"
                style={{
                  background: activeTheme.card,
                  borderColor: activeTheme.border,
                  transition: 'background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease',
                }}
              >
                <span className="text-[10px] font-mono uppercase text-gray-400">Database Integrity</span>
                <p
                  className="text-2xl font-black font-mono mt-1"
                  style={{
                    color: activeTheme.accent,
                    transition: 'color 0.4s ease',
                  }}
                >
                  WAL Synced
                </p>
                <span className="text-[9px] text-gray-500 font-mono">Zero layout bleed</span>
              </div>
            </div>
          </div>

          {/* Floating Theme Switcher Modal [Ctrl+T] */}
          <div
            className="absolute top-16 right-16 w-[420px] bg-[#0E121A] border rounded-lg p-5 shadow-2xl space-y-4"
            style={{
              borderColor: activeTheme.border,
              transform: `scale(${modalScale})`,
              boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 30px ${activeTheme.accent}20`,
            }}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🎨</span>
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Select Visual Theme [Ctrl+T]
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                23 Themes
              </span>
            </div>

            <div className="space-y-2">
              {THEMES.map((t, idx) => {
                const isSelected = idx === activeThemeIndex

                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-sm border flex items-center justify-between transition-all cursor-pointer"
                    style={{
                      background: isSelected ? `${t.accent}15` : 'rgba(255,255,255,0.02)',
                      borderColor: isSelected ? t.accent : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                        style={{
                          background: t.accent,
                          borderColor: isSelected ? '#FFFFFF' : 'transparent',
                        }}
                      />
                      <div>
                        <p
                          className="text-xs font-bold font-mono leading-tight"
                          style={{ color: isSelected ? t.accent : '#D1D5DB' }}
                        >
                          {t.name}
                        </p>
                        <p className="text-[9px] text-gray-500 font-mono mt-0.5">{t.tag}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <span
                        className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
                        style={{
                          background: `${t.accent}25`,
                          color: t.accent,
                        }}
                      >
                        ACTIVE ✓
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>Universal CSS Variable Injection</span>
              <span className="text-emerald-400 font-bold">100% Surface Coverage</span>
            </div>
          </div>

        </div>
      </NoxisWindowFrame>

      {/* Windows 11 Native Cursor (Screen Level) */}
      <Windows11Cursor waypoints={THEME_WAYPOINTS} />

      {/* Customer Pitch HUD */}
      <PitchHUD
        badge="05 · ADAPTIVE SHELL"
        title="23 UNIVERSAL THEMES · PERFECT CONTRAST ACROSS 100% OF SCREENS"
        explanation="Every single window, sidebar, modal, dialog, and KPI card dynamically recalculates contrast tokens in real time, so operators never suffer eye strain."
        roiPoints={['Zero Theme Bleed', 'Instant Hot Reload', 'High-Contrast Factory Mode']}
        accentColor={activeTheme.accent}
      />
    </AbsoluteFill>
  )
}
