'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, Download, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PublicNavbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Docs & Guide', href: '/docs' },
    { label: 'Reviews', href: '/reviews' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Download', href: '/download' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030712]/90 backdrop-blur-xl border-b border-[#08EBF6]/20 h-[76px] transition-all shadow-[0_4px_30px_rgba(8,235,246,0.08)]">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <Link href="/" prefetch={false} className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-md bg-black/60 border border-[#08EBF6]/40 flex items-center justify-center group-hover:border-[#08EBF6] group-hover:shadow-[0_0_20px_rgba(8,235,246,0.4)] transition-all">
              <Image
                src="/logos/noxis.png"
                alt="Noxis Logo"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black tracking-wider leading-none text-lg group-hover:text-[#08EBF6] transition-colors flex items-center gap-1">
                NOXIS<span className="text-[#08EBF6]">HUB</span>
              </span>
              <span className="text-[9px] text-[#5FA5FA] font-mono tracking-widest uppercase mt-1 font-bold">
                Offline-First Industrial ERP
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className={`text-xs font-bold uppercase tracking-[0.16em] transition-all relative py-1.5 ${
                    active
                      ? 'text-[#08EBF6] font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#5FA5FA] via-[#08EBF6] to-[#FFFFFF] shadow-[0_0_12px_#08EBF6]"
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop Right CTAs */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/login"
              prefetch={false}
              className="text-xs font-bold uppercase tracking-wider text-white hover:text-[#08EBF6] px-4 py-2.5 rounded-md border border-white/15 hover:border-[#08EBF6]/50 bg-white/5 hover:bg-[#08EBF6]/10 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/download"
              prefetch={false}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black bg-gradient-to-r from-[#08EBF6] via-[#FFFFFF] to-[#5FA5FA] px-5 py-2.5 rounded-md hover:brightness-110 transition-all shadow-[0_0_25px_rgba(8,235,246,0.35)]"
            >
              <Download size={15} />
              <span>Download .EXE</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-md bg-black/60 border border-[#08EBF6]/30 text-[#08EBF6] hover:text-white transition-all"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[76px] bottom-0 z-40 bg-[#030712]/98 backdrop-blur-2xl border-b border-[#08EBF6]/20 p-6 flex flex-col justify-between overflow-y-auto lg:hidden"
          >
            <div className="space-y-3 pt-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#5FA5FA] mb-4 px-3">
                Navigation Menu
              </div>
              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3.5 rounded-md border text-sm font-bold uppercase tracking-wider transition-all ${
                      active
                        ? 'bg-[#08EBF6]/15 border-[#08EBF6]/40 text-[#08EBF6] shadow-[0_0_15px_rgba(8,235,246,0.2)]'
                        : 'bg-white/[0.02] border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={16} className={active ? 'text-[#08EBF6]' : 'opacity-30'} />
                  </Link>
                )
              })}
            </div>

            <div className="space-y-3 pt-8 pb-4 border-t border-white/10">
              <Link
                href="/download"
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-black bg-gradient-to-r from-[#08EBF6] to-[#5FA5FA] py-3.5 rounded-md shadow-[0_0_20px_rgba(8,235,246,0.3)]"
              >
                <Download size={16} />
                <span>Download Noxis PC (.exe)</span>
              </Link>
              <Link
                href="/login"
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-white/5 border border-white/15 py-3 rounded-md"
              >
                <span>Client Login</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
