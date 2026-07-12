export type ThemeId = 
  'electric-slate' |
  'textile-gold' |
  'pharma-clean' |
  'logistics-amber' |
  'carbon-dark' |
  'desert-sand' |
  'midnight-blue' |
  'emerald-forest' |
  'royal-purple' |
  'steel-industrial' |
  'crimson-power' |
  'ocean-teal' |
  'warm-ivory' |
  'neon-cyber' |
  'saffron-bazaar' |
  'rose-gold' |
  'arctic-white' |
  'volcanic-ash' |
  'deep-forest' |
  'chrome-silver' |
  'golden-onyx' |
  'midnight-emerald' |
  'light-slate'

export type Theme = {
  id: ThemeId
  name: string
  description: string
  industry: string[]
  colors: {
    background: string
    surface: string
    primary: string
    financial: string
    success: string
    danger: string
    text: string
    textMuted: string
    border: string
  }
  chartColors: string[]
  fontMono: string
  uiFont: string
  uiFont2?: string
}

export const themes: Theme[] = [
  {
    id: 'light-slate',
    name: 'Light Slate',
    description: 'High visibility light theme for factory floors',
    industry: ['default', 'wholesale', 'general'],
    colors: {
      background: '#F8F9FA',
      surface: '#FFFFFF',
      primary: '#2563EB',      // darker blue
      financial: '#92400E',    // dark gold
      success: '#059669',
      danger: '#DC2626',
      text: '#111827',
      textMuted: '#6B7280',
      border: 'rgba(0,0,0,0.08)',
    },
    chartColors: ['#2563EB','#059669','#92400E', '#8B5CF6','#F59E0B','#DC2626'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'electric-slate',
    name: 'Electric Slate',
    description: 'Default industrial dark theme',
    industry: ['default', 'wholesale', 'general'],
    colors: {
      background: '#121417',
      surface: '#1A1D21',
      primary: '#60A5FA',
      financial: '#C5A059',
      success: '#10B981',
      danger: '#EF4444',
      text: '#FFFFFF',
      textMuted: '#6B7280',
      border: 'rgba(255,255,255,0.05)',
    },
    chartColors: ['#60A5FA','#10B981','#C5A059', '#8B5CF6','#F59E0B','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'textile-gold',
    name: 'Textile Gold',
    description: 'Warm gold tones for fabric industry',
    industry: ['textile', 'fashion', 'leather'],
    colors: {
      background: '#0F0E0C',
      surface: '#1A1710',
      primary: '#C5A059',
      financial: '#E8C07D',
      success: '#10B981',
      danger: '#EF4444',
      text: '#F5F0E8',
      textMuted: '#8B7355',
      border: 'rgba(197,160,89,0.1)',
    },
    chartColors: ['#C5A059','#E8C07D','#8B7355', '#10B981','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'pharma-clean',
    name: 'Pharma Clean',
    description: 'Clinical white and teal for medical',
    industry: ['pharma', 'medical', 'hospital'],
    colors: {
      background: '#0A0F14',
      surface: '#111820',
      primary: '#06B6D4',
      financial: '#0EA5E9',
      success: '#10B981',
      danger: '#EF4444',
      text: '#E0F2FE',
      textMuted: '#64748B',
      border: 'rgba(6,182,212,0.1)',
    },
    chartColors: ['#06B6D4','#0EA5E9','#10B981', '#8B5CF6','#C5A059','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'logistics-amber',
    name: 'Logistics Amber',
    description: 'High visibility amber for transport',
    industry: ['logistics', 'transport', 'fleet'],
    colors: {
      background: '#0C0A00',
      surface: '#1A1500',
      primary: '#F59E0B',
      financial: '#FCD34D',
      success: '#10B981',
      danger: '#EF4444',
      text: '#FFFBEB',
      textMuted: '#78716C',
      border: 'rgba(245,158,11,0.1)',
    },
    chartColors: ['#F59E0B','#FCD34D','#D97706', '#10B981','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'carbon-dark',
    name: 'Carbon Dark',
    description: 'Pure black carbon for manufacturing',
    industry: ['manufacturing', 'auto_parts', 'metal', 'chemical'],
    colors: {
      background: '#050505',
      surface: '#0F0F0F',
      primary: '#9CA3AF',
      financial: '#D1D5DB',
      success: '#10B981',
      danger: '#EF4444',
      text: '#F9FAFB',
      textMuted: '#4B5563',
      border: 'rgba(255,255,255,0.08)',
    },
    chartColors: ['#9CA3AF','#D1D5DB','#6B7280', '#10B981','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'desert-sand',
    name: 'Desert Sand',
    description: 'Warm earth tones for retail/food',
    industry: ['retail', 'restaurant', 'food', 'agriculture', 'rice_mill'],
    colors: {
      background: '#0F0A06',
      surface: '#1A1208',
      primary: '#EA580C',
      financial: '#F97316',
      success: '#10B981',
      danger: '#EF4444',
      text: '#FEF3C7',
      textMuted: '#92400E',
      border: 'rgba(234,88,12,0.1)',
    },
    chartColors: ['#EA580C','#F97316','#B45309', '#10B981','#C5A059','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    description: 'Deep navy for professional services',
    industry: ['consulting', 'services', 'finance'],
    colors: {
      background: '#030712',
      surface: '#0F172A',
      primary: '#3B82F6',
      financial: '#93C5FD',
      success: '#10B981',
      danger: '#EF4444',
      text: '#F1F5F9',
      textMuted: '#64748B',
      border: 'rgba(59,130,246,0.15)',
    },
    chartColors: ['#3B82F6','#93C5FD','#1D4ED8', '#10B981','#C5A059','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest',
    description: 'Rich green for agriculture and food',
    industry: ['agriculture', 'food', 'organic'],
    colors: {
      background: '#052e16',
      surface: '#14532d',
      primary: '#22c55e',
      financial: '#86efac',
      success: '#4ade80',
      danger: '#EF4444',
      text: '#f0fdf4',
      textMuted: '#6b7280',
      border: 'rgba(34,197,94,0.2)',
    },
    chartColors: ['#22c55e','#86efac','#166534', '#C5A059','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Luxury tone for jewelry and fashion',
    industry: ['jewelry', 'luxury', 'fashion_boutique'],
    colors: {
      background: '#0a0015',
      surface: '#150025',
      primary: '#a855f7',
      financial: '#d8b4fe',
      success: '#10B981',
      danger: '#EF4444',
      text: '#faf5ff',
      textMuted: '#6b7280',
      border: 'rgba(168,85,247,0.15)',
    },
    chartColors: ['#a855f7','#d8b4fe','#7c3aed', '#10B981','#C5A059','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'steel-industrial',
    name: 'Steel Industrial',
    description: 'Raw steel grey for heavy industry',
    industry: ['steel', 'construction', 'mining', 'foundry'],
    colors: {
      background: '#111111',
      surface: '#1C1C1E',
      primary: '#8E8E93',
      financial: '#AEAEB2',
      success: '#10B981',
      danger: '#EF4444',
      text: '#F2F2F7',
      textMuted: '#636366',
      border: 'rgba(142,142,147,0.2)',
    },
    chartColors: ['#8E8E93','#AEAEB2','#636366', '#10B981','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'crimson-power',
    name: 'Crimson Power',
    description: 'Bold red energy for retail chains',
    industry: ['retail_chain', 'fast_food', 'franchise'],
    colors: {
      background: '#0c0000',
      surface: '#1a0000',
      primary: '#dc2626',
      financial: '#fca5a5',
      success: '#10B981',
      danger: '#b91c1c',
      text: '#fff1f2',
      textMuted: '#6b7280',
      border: 'rgba(220,38,38,0.15)',
    },
    chartColors: ['#dc2626','#fca5a5','#991b1b', '#10B981','#C5A059','#F59E0B'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'ocean-teal',
    name: 'Ocean Teal',
    description: 'Marine blue-green for exports/shipping',
    industry: ['shipping', 'export', 'import', 'port'],
    colors: {
      background: '#042f2e',
      surface: '#134e4a',
      primary: '#14b8a6',
      financial: '#5eead4',
      success: '#4ade80',
      danger: '#EF4444',
      text: '#f0fdfa',
      textMuted: '#6b7280',
      border: 'rgba(20,184,166,0.2)',
    },
    chartColors: ['#14b8a6','#5eead4','#0f766e', '#C5A059','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'warm-ivory',
    name: 'Warm Ivory',
    description: 'Soft warm tone for professional offices',
    industry: ['office', 'accounting', 'legal'],
    colors: {
      background: '#1a1612',
      surface: '#252018',
      primary: '#d97706',
      financial: '#fcd34d',
      success: '#10B981',
      danger: '#EF4444',
      text: '#fef9f0',
      textMuted: '#92400e',
      border: 'rgba(217,119,6,0.15)',
    },
    chartColors: ['#d97706','#fcd34d','#b45309', '#10B981','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    description: 'High contrast neon for tech companies',
    industry: ['technology', 'software', 'startup'],
    colors: {
      background: '#000000',
      surface: '#0a0a0a',
      primary: '#00ff88',
      financial: '#00ffcc',
      success: '#00ff88',
      danger: '#ff0040',
      text: '#ffffff',
      textMuted: '#444444',
      border: 'rgba(0,255,136,0.2)',
    },
    chartColors: ['#00ff88','#00ffcc','#00cc66', '#ff0040','#0088ff','#ffaa00'],
    fontMono: 'JetBrains Mono',
    uiFont: '"Space Grotesk", Inter',
  },
  {
    id: 'saffron-bazaar',
    name: 'Saffron Bazaar',
    description: 'Saffron and deep red — South Asian bazaar',
    industry: ['bazaar', 'wholesale_kiryana', 'general_store'],
    colors: {
      background: '#0f0800',
      surface: '#1a0f00',
      primary: '#f97316',
      financial: '#fb923c',
      success: '#10B981',
      danger: '#EF4444',
      text: '#fff7ed',
      textMuted: '#78350f',
      border: 'rgba(249,115,22,0.2)',
    },
    chartColors: ['#f97316','#fb923c','#c2410c', '#10B981','#C5A059','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    description: 'Elegant rose and gold for high-end retail',
    industry: ['jewelry', 'fashion', 'cosmetics'],
    colors: {
      background: '#1a1010',
      surface: '#2d1b1b',
      primary: '#fb7185',
      financial: '#f472b6',
      success: '#10B981',
      danger: '#EF4444',
      text: '#fff1f2',
      textMuted: '#9f1239',
      border: 'rgba(251,113,133,0.15)',
    },
    chartColors: ['#fb7185','#f472b6','#be123c', '#10B981','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'arctic-white',
    name: 'Arctic White',
    description: 'Clean, icy white for logistics and refrigeration',
    industry: ['refrigeration', 'cold_storage', 'ice_factory'],
    colors: {
      background: '#0f172a',
      surface: '#1e293b',
      primary: '#f8fafc',
      financial: '#94a3b8',
      success: '#10B981',
      danger: '#EF4444',
      text: '#f8fafc',
      textMuted: '#64748b',
      border: 'rgba(248,250,252,0.1)',
    },
    chartColors: ['#f8fafc','#94a3b8','#475569', '#10B981','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'volcanic-ash',
    name: 'Volcanic Ash',
    description: 'Deep ash grey for heavy machinery',
    industry: ['heavy_machinery', 'excavation', 'mining'],
    colors: {
      background: '#171717',
      surface: '#262626',
      primary: '#f59e0b',
      financial: '#d97706',
      success: '#10B981',
      danger: '#EF4444',
      text: '#fafafa',
      textMuted: '#737373',
      border: 'rgba(245,158,11,0.15)',
    },
    chartColors: ['#f59e0b','#d97706','#b45309', '#10B981','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'deep-forest',
    name: 'Deep Forest',
    description: 'Evergreen tones for timber and wood industry',
    industry: ['timber', 'wood', 'furniture'],
    colors: {
      background: '#022c22',
      surface: '#064e3b',
      primary: '#059669',
      financial: '#10b981',
      success: '#34d399',
      danger: '#EF4444',
      text: '#f0fdf4',
      textMuted: '#065f46',
      border: 'rgba(5,150,105,0.2)',
    },
    chartColors: ['#059669','#10b981','#047857', '#C5A059','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'chrome-silver',
    name: 'Chrome Silver',
    description: 'Polished silver for precision engineering',
    industry: ['engineering', 'watchmaking', 'robotics'],
    colors: {
      background: '#0a0a0a',
      surface: '#171717',
      primary: '#d4d4d4',
      financial: '#a3a3a3',
      success: '#10B981',
      danger: '#EF4444',
      text: '#ffffff',
      textMuted: '#525252',
      border: 'rgba(212,212,212,0.2)',
    },
    chartColors: ['#d4d4d4','#a3a3a3','#737373', '#10B981','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'golden-onyx',
    name: 'Golden Onyx',
    description: 'Bespoke premium theme with high-contrast gold and deep blacks',
    industry: ['admin', 'executive', 'luxury'],
    colors: {
      background: '#050505',
      surface: '#0A0A0A',
      primary: '#D4AF37',      // Metallic Gold
      financial: '#FFD700',    // Pure Gold
      success: '#10B981',
      danger: '#EF4444',
      text: '#FFFFFF',
      textMuted: '#525252',
      border: 'rgba(212,175,55,0.15)',
    },
    chartColors: ['#D4AF37','#FFD700','#856404', '#10B981','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
  {
    id: 'midnight-emerald',
    name: 'Midnight Emerald',
    description: 'Deep forest greens with sharp emerald accents',
    industry: ['precision', 'operations', 'premium'],
    colors: {
      background: '#020617',
      surface: '#0F172A',
      primary: '#10B981',      // Emerald
      financial: '#34D399',    // Light Emerald
      success: '#10B981',
      danger: '#EF4444',
      text: '#F8FAFC',
      textMuted: '#64748B',
      border: 'rgba(16,185,129,0.15)',
    },
    chartColors: ['#10B981','#34D399','#065F46', '#D4AF37','#60A5FA','#EF4444'],
    fontMono: 'JetBrains Mono',
    uiFont: 'Inter',
  },
]

export function getThemeForIndustry(industry: string): Theme {
  if (!industry) return themes[0]
  const theme = themes.find(t => t.industry && Array.isArray(t.industry) && t.industry.includes(industry))
  return theme || themes[0]
}
