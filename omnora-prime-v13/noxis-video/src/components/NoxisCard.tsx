import React from 'react'

export function NoxisCard({
  children,
  className = '',
  glowColor = '#60A5FA',
}: {
  children: React.ReactNode
  className?: string
  glowColor?: string
}) {
  return (
    <div
      className={`
        bg-[#0F1114] border
        border-white/7 rounded-sm
        ${className}
      `}
      style={{
        boxShadow:
          `0 0 0 1px rgba(255,255,255,0.04),
           0 4px 24px rgba(0,0,0,0.4)`,
      }}
    >
      {children}
    </div>
  )
}
