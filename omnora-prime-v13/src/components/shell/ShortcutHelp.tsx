'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], desc: 'Search anything' },
  { keys: ['Ctrl', 'N'], desc: 'New Invoice' },
  { keys: ['Ctrl', 'D'], desc: 'Dashboard' },
  { keys: ['Ctrl', 'I'], desc: 'Inventory' },
  { keys: ['Ctrl', 'P'], desc: 'Parties' },
  { keys: ['Alt', '1-5'], desc: 'Navigate sections' },
  { keys: ['Esc'], desc: 'Close modal / search' },
]

export function ShortcutHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) {
          setOpen(prev => !prev)
        }
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-[#0F1114] border border-white/10 rounded-sm p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-white mb-4">
          Keyboard Shortcuts
        </h3>
        <div className="space-y-3">
          {SHORTCUTS.map(s => (
            <div key={s.desc} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {s.desc}
              </span>
              <div className="flex gap-1">
                {s.keys.map(k => (
                  <kbd key={k} className="text-[10px] font-mono bg-white/8 border border-white/12 px-1.5 py-0.5 rounded text-gray-300">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-700 mt-4 text-center">
          Press ? to toggle this panel
        </p>
      </div>
    </div>,
    document.body
  )
}
