'use client'
import React, { useState, useMemo } from 'react'

export function useTableSort<T extends Record<string, any>>(
  data: T[],
  defaultKey?: string,
  defaultDir: 'asc' | 'desc' = 'desc'
) {
  const [sortKey, setSortKey] = useState<string | null>(defaultKey || null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultDir)

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey || !data) return data || []
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === bv) return 0
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  return { sorted, sortKey, sortDir, toggleSort }
}

interface SortableHeaderProps {
  label: string
  sortKey: string
  currentKey: string | null | any
  direction: 'asc' | 'desc'
  onClick: (key: any) => void
  className?: string
}

export function SortableHeader({
  label,
  sortKey,
  currentKey,
  direction,
  onClick,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentKey === sortKey
  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors ${className}`}
    >
      <span>{label}</span>
      <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        {direction === 'asc' ? '↑' : '↓'}
      </span>
    </button>
  )
}
