import React from 'react'

// Error state — network or server failure
export function ErrorState({
  message = 'Something went wrong',
  onRetry,
  detail,
}: {
  message?: string
  onRetry?: () => void
  detail?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xl mb-4 font-mono font-bold">
        !
      </div>
      <p className="text-sm font-medium text-white mb-1">
        {message}
      </p>
      {detail && (
        <p className="text-xs text-gray-500 mb-4 max-w-xs">
          {detail}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-[#60A5FA] hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          ↺ Try again
        </button>
      )}
    </div>
  )
}

// Empty state — no data yet
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description?: string
  action?: { label: string, href?: string, onClick?: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="text-4xl mb-4 opacity-40">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-gray-300 mb-1">
        {title}
      </p>
      {description && (
        <p className="text-xs text-gray-600 mb-4 max-w-xs">
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <a href={action.href}
            className="text-xs font-medium text-[#60A5FA] hover:text-blue-300 transition-colors">
            {action.label} →
          </a>
        ) : (
          <button onClick={action.onClick}
            className="text-xs font-medium text-[#60A5FA] hover:text-blue-300 transition-colors cursor-pointer">
            {action.label} →
          </button>
        )
      )}
    </div>
  )
}

// Inline field error (form inputs)
export function FieldError({
  message
}: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-xs text-red-400 mt-1 flex items-center gap-1 font-medium">
      <span>⚠</span>
      {message}
    </p>
  )
}

// Toast with action (upgrade existing toast)
export function ActionToast({
  message,
  type = 'success',
  action,
}: {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  action?: { label: string, onClick: () => void }
}) {
  const colors = {
    success: 'border-emerald-500/30 text-emerald-400',
    error: 'border-red-500/30 text-red-400',
    info: 'border-blue-500/30 text-[#60A5FA]',
    warning: 'border-amber-500/30 text-amber-400',
  }
  return (
    <div className={`flex items-center justify-between gap-4 px-4 py-3 bg-[#111418] border rounded-sm ${colors[type]}`}>
      <span className="text-sm text-white">
        {message}
      </span>
      {action && (
        <button
          onClick={action.onClick}
          className="text-xs font-semibold text-[#60A5FA] hover:text-blue-300 whitespace-nowrap transition-colors cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
