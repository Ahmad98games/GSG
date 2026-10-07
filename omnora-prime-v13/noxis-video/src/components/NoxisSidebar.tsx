import { useCurrentFrame, interpolate } from 'remotion'

export interface NavSection {
  title: string
  items: {
    id: string
    label: string
    icon: string
    badge?: string
    badgeColor?: string
    activeColor?: string
  }[]
}

export const SIDEBAR_SECTIONS: NavSection[] = [
  {
    title: 'OPERATIONS',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '🔲', activeColor: '#06B6D4' },
      { id: 'pos', label: 'POS Counter', icon: '🛒', activeColor: '#10B981' },
      { id: 'stitching', label: 'Stitching', icon: '🧵', activeColor: '#60A5FA' },
      { id: 'fabric', label: 'Fabric / Stock', icon: '📦', activeColor: '#F59E0B' },
      { id: 'karigars', label: 'Karigars', icon: '👥', activeColor: '#10B981' },
      { id: 'shipment', label: 'Shipment', icon: '🚚', activeColor: '#60A5FA' },
      { id: 'foresight', label: 'Foresight AI', icon: '🧠', badge: 'AI', badgeColor: '#06B6D4', activeColor: '#06B6D4' },
      { id: 'batches', label: 'Batch Tracking', icon: '🏷️', activeColor: '#C5A059' },
    ],
  },
  {
    title: 'FINANCE & ADMIN',
    items: [
      { id: 'khata', label: 'Khata Ledger', icon: '📖', activeColor: '#C5A059' },
      { id: 'invoices', label: 'Invoices', icon: '📄', activeColor: '#60A5FA' },
      { id: 'parties', label: 'Buyers & Suppliers', icon: '🏢', activeColor: '#8B5CF6' },
      { id: 'purchase', label: 'Fabric Purchase', icon: '🛍️', activeColor: '#F59E0B' },
      { id: 'wages', label: 'Wages', icon: '💼', activeColor: '#10B981' },
      { id: 'finance', label: 'Expense & Finance', icon: '💵', activeColor: '#10B981' },
      { id: 'crm', label: 'CRM & Pipeline', icon: '📈', activeColor: '#60A5FA' },
      { id: 'compliance', label: 'Tax & Compliance', icon: '🛡️', activeColor: '#06B6D4' },
    ],
  },
  {
    title: 'SYSTEM & TELEMETRY',
    items: [
      { id: 'cctv', label: 'CCTV Feeds', icon: '📹', activeColor: '#EF4444' },
      { id: 'messaging', label: 'Messaging Hub', icon: '💬', activeColor: '#10B981' },
      { id: 'reports', label: 'Reports', icon: '📊', activeColor: '#F59E0B' },
      { id: 'workflows', label: 'Workflows', icon: '⚡', activeColor: '#8B5CF6' },
      { id: 'audit', label: 'Audit Trail', icon: '📋', activeColor: '#60A5FA' },
      { id: 'pairing', label: 'Device Pairing', icon: '📱', activeColor: '#06B6D4' },
      { id: 'file-morph', label: 'File Conversion', icon: '🔄', activeColor: '#C5A059' },
      { id: 'settings', label: 'System Settings', icon: '⚙️', activeColor: '#9CA3AF' },
    ],
  },
]

const INDEX_TO_ID: Record<number, string> = {
  0: 'pos',
  1: 'dashboard',
  2: 'fabric',
  3: 'karigars',
  4: 'invoices',
  5: 'parties',
  6: 'khata',
  7: 'wages',
  8: 'shipment',
  9: 'reports',
}

export function NoxisSidebar({
  activeId,
  activeIndex,
  accentColor = '#06B6D4',
}: {
  activeId?: string
  activeIndex?: number
  accentColor?: string
}) {
  const frame = useCurrentFrame()
  const resolvedActiveId = activeId || (activeIndex !== undefined ? INDEX_TO_ID[activeIndex] : 'dashboard')

  return (
    <div
      className="w-56 h-full bg-[#080B10] border-r border-white/[0.06] flex flex-col justify-between select-none shrink-0"
    >
      {/* ── Scrollable Navigation List ── */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-4">
        {SIDEBAR_SECTIONS.map((section, sIdx) => (
          <div key={section.title} className="space-y-1">
            {/* Section Header */}
            <div className="px-2.5 py-1">
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-500 font-mono">
                {section.title}
              </span>
            </div>

            {/* Nav items */}
            <div className="space-y-0.5">
              {section.items.map((item, iIdx) => {
                const isActive = item.id === resolvedActiveId
                const delay = sIdx * 4 + iIdx * 2
                const opacity = interpolate(frame, [delay, delay + 6], [0, 1], {
                  extrapolateRight: 'clamp',
                })

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-sm transition-all"
                    style={{
                      opacity,
                      background: isActive
                        ? `${accentColor}18`
                        : 'transparent',
                      borderLeft: isActive
                        ? `3px solid ${accentColor}`
                        : '3px solid transparent',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs shrink-0">{item.icon}</span>
                      <span
                        className="text-[11px] font-semibold truncate tracking-tight"
                        style={{
                          color: isActive ? accentColor : '#94A3B8',
                          fontWeight: isActive ? 700 : 500,
                        }}
                      >
                        {item.label}
                      </span>
                    </div>

                    {item.badge && (
                      <span
                        className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-sm font-mono shrink-0"
                        style={{
                          color: item.badgeColor || accentColor,
                          background: `${item.badgeColor || accentColor}22`,
                          border: `1px solid ${item.badgeColor || accentColor}40`,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer Profile & Collapse ── */}
      <div className="p-2.5 border-t border-white/[0.06] bg-[#07090D] space-y-2">
        <div className="flex items-center justify-between px-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-[10px] font-bold text-cyan-300">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-white leading-none">
                Ahmad
              </span>
              <span className="text-[8px] text-gray-500 font-mono mt-0.5">
                Administrator
              </span>
            </div>
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 font-mono">
            ELITE
          </span>
        </div>

        <div className="text-[9px] text-gray-500 hover:text-gray-400 px-1.5 flex items-center gap-1 cursor-pointer font-mono">
          <span>‹</span>
          <span>Collapse Sidebar</span>
        </div>
      </div>
    </div>
  )
}
