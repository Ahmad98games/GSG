'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface SettingsBackButtonProps {
  label?: string
  href?: string
  className?: string
}

export default function SettingsBackButton({
  label = 'Back to Settings',
  href = '/settings',
  className = ''
}: SettingsBackButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 group shrink-0 ${className}`}
    >
      <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-[#60A5FA]" />
      <span>{label}</span>
    </Link>
  )
}
