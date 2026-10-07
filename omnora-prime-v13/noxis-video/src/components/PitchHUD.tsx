
export function PitchHUD({
  badge = 'FEATURE SPOTLIGHT',
  title,
  explanation,
  roiPoints = [],
  accentColor = '#06B6D4',
  position = 'bottom',
}: {
  badge?: string
  title: string
  explanation: string
  roiPoints?: string[]
  accentColor?: string
  position?: 'bottom' | 'top'
}) {
  return (
    <div
      className={`absolute left-0 right-0 z-40 px-8 py-3.5 pointer-events-none select-none flex items-center justify-between ${
        position === 'bottom' ? 'bottom-0 border-t' : 'top-0 border-b'
      } border-white/10 bg-[#06090E]/95 backdrop-blur-md shadow-2xl font-sans`}
    >
      <div className="flex items-center gap-4">
        {/* Category Pill */}
        <div
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded-sm border font-mono shrink-0"
          style={{
            borderColor: `${accentColor}40`,
            background: `${accentColor}12`,
          }}
        >
          <span
            className="text-[8px] font-black uppercase tracking-[0.2em]"
            style={{ color: accentColor }}
          >
            PITCH DECK
          </span>
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            {badge}
          </span>
        </div>

        {/* Feature Title & Explanation */}
        <div className="space-y-0.5">
          <h4 className="text-sm font-black font-mono tracking-wider text-white uppercase flex items-center gap-2">
            <span>{title}</span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.2 rounded font-mono"
              style={{
                color: accentColor,
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}40`,
              }}
            >
              INDUSTRIAL GRADE
            </span>
          </h4>
          <p className="text-xs text-gray-300 font-medium max-w-4xl leading-tight">
            {explanation}
          </p>
        </div>
      </div>

      {/* Value Proposition Pills on the Right */}
      {roiPoints.length > 0 && (
        <div className="flex items-center gap-2 font-mono shrink-0">
          {roiPoints.map((pt) => (
            <div
              key={pt}
              className="px-2.5 py-1 rounded-sm bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold text-gray-200 flex items-center gap-1.5"
            >
              <span className="text-emerald-400 font-black">✓</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
