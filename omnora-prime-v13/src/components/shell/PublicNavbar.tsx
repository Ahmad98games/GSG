'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, Download, ShieldCheck, ArrowRight } from 'lucide-react'
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#040608]/90 backdrop-blur-xl border-b border-white/[0.06] h-[72px] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#C5A059]/50 group-hover:bg-[#C5A059]/10 transition-all shadow-lg">
              <Image
                src="/logos/noxis.png"
                alt="Noxis Logo"
                width={22}
                height={22}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold tracking-wider leading-none text-base group-hover:text-[#E8D5B5] transition-colors">
                NOXIS<span className="text-[#60A5FA]">HUB</span>
              </span>
              <span className="text-[8px] text-gray-400 font-mono tracking-widest uppercase mt-0.5">
                Industrial Factory ERP
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
                  prefetch={true}
                  className={`text-xs font-bold uppercase tracking-[0.16em] transition-all relative py-1 ${
                    active
                      ? 'text-white font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C5A059] to-[#60A5FA]"
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
              className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-4 py-2 rounded-sm border border-white/10 hover:border-white/20 bg-white/5 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/download"
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black bg-gradient-to-r from-[#C5A059] via-[#E8D5B5] to-[#C5A059] px-4 py-2 rounded-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(197,160,89,0.25)]"
            >
              <Download size={14} />
              <span>Download .EXE</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-sm bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all"
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
            className="fixed inset-x-0 top-[72px] bottom-0 z-40 bg-[#040608]/98 backdrop-blur-2xl border-b border-white/10 p-6 flex flex-col justify-between overflow-y-auto lg:hidden"
          >
            <div className="space-y-3 pt-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-3">
                Navigation Menu
              </div>
              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3.5 rounded-sm border text-sm font-bold uppercase tracking-wider transition-all ${
                      active
                        ? 'bg-[#C5A059]/15 border-[#C5A059]/30 text-white'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={16} className={active ? 'text-[#C5A059]' : 'opacity-30'} />
                  </Link>
                )
              })}
            </div>

            <div className="space-y-3 pt-8 pb-4 border-t border-white/10">
              <Link
                href="/download"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-black bg-[#C5A059] py-3.5 rounded-sm"
              >
                <Download size={16} />
                <span>Download Noxis PC (.exe)</span>
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 bg-white/5 border border-white/10 py-3 rounded-sm"
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
