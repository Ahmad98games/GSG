'use client'

import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useInView,
  useScroll,
  useTransform,
  LayoutGroup,
} from 'framer-motion'
import { springs, stagger, fadeUp } from '@/lib/animations'

const inViewOpts = { once: true, margin: '-80px' as const }

export const CHAMPAGNE = '#C5A059'
export const CHAMPAGNE_LIGHT = '#E8D5B5'
export const CYAN_ACCENT = '#00E5FF'
export const OBSIDIAN = '#08090A'

const easeLuxury = [0.16, 1, 0.3, 1] as const

/* ─── Ambient backdrop: drifting grid + champagne aurora ─── */
export function LandingBackdrop() {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 800], [0, reduce ? 0 : 120])
  const y2 = useTransform(scrollY, [0, 800], [0, reduce ? 0 : -80])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#08090A]" />
      <div
        className="absolute inset-0 opacity-[0.35] noxis-grid-drift"
        style={{
          backgroundImage: `
            linear-gradient(rgba(197,160,89,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(197,160,89,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          animation: reduce ? 'none' : 'noxis-grid-drift 24s linear infinite',
        }}
      />
      <motion.div
        style={{ y: y1, background: CHAMPAGNE }}
        className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[min(900px,120vw)] h-[420px] rounded-full blur-[130px] opacity-[0.09]"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 50, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[12%] left-[10%] w-[350px] h-[350px] rounded-full bg-[#C5A059]/5 blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -60, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-[20%] right-[15%] w-[450px] h-[450px] rounded-full bg-[#E8D5B5]/4 blur-[140px] pointer-events-none"
      />
      <motion.div
        style={{ y: y2, background: CYAN_ACCENT }}
        className="absolute top-[45%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#12101a]/50 via-transparent to-[#08090A]" />
    </div>
  )
}

/* ─── Signature logo: conic ring + EKG pulse + brand lockup ─── */
type LogoSize = 'nav' | 'hero' | 'footer' | 'splash'

const logoPixels: Record<LogoSize, number> = {
  nav: 40,
  hero: 112,
  footer: 36,
  splash: 128,
}

export function BrandLogo({
  size = 'nav',
  showWordmark = true,
  className = '',
}: {
  size?: LogoSize
  showWordmark?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  const logoRef = useRef<HTMLDivElement>(null)
  const logoInView = useInView(logoRef, { once: false, margin: '40px' })
  const px = logoPixels[size]
  const ringInset = size === 'hero' ? -18 : -10
  const animateLogo = !reduce && logoInView && (size === 'hero' || size === 'splash')

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.div
        ref={logoRef}
        className="relative shrink-0"
        style={{ width: px, height: px }}
        whileHover={reduce ? {} : { scale: 1.04 }}
        transition={springs.snappy}
      >
        {animateLogo && (
          <motion.div
            className="absolute rounded-2xl"
            style={{
              inset: ringInset,
              background: `conic-gradient(from 0deg, transparent 0%, ${CHAMPAGNE}88 25%, transparent 50%, ${CYAN_ACCENT}66 75%, transparent 100%)`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          />
        )}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden border border-white/[0.12] bg-[#0a0c10] shadow-[0_0_40px_rgba(0,229,255,0.12),0_0_60px_rgba(197,160,89,0.08)]"
        >
          <Image
            src="/logos/noxis.png"
            alt="Noxis ERP"
            width={px}
            height={px}
            priority={size === 'hero' || size === 'splash' || size === 'nav'}
            className="w-full h-full object-contain p-[8%]"
          />
        </div>
        {animateLogo && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            viewBox="0 0 100 100"
            aria-hidden
          >
            <motion.path
              d="M 8 50 H 32 M 68 50 H 92"
              fill="none"
              stroke={CYAN_ACCENT}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray="8 120"
              initial={{ strokeDashoffset: 128, opacity: 0.3 }}
              animate={{ strokeDashoffset: 0, opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d="M 50 8 V 32 M 50 68 V 92"
              fill="none"
              stroke={CHAMPAGNE}
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeDasharray="6 100"
              initial={{ strokeDashoffset: 106 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'linear', delay: 0.6 }}
            />
          </svg>
        )}
      </motion.div>

      {showWordmark && (
        <div className="flex flex-col min-w-0">
          <span
            className={`font-bold tracking-[0.22em] text-white leading-none ${
              size === 'hero' ? 'text-lg sm:text-xl' : size === 'splash' ? 'text-xl' : 'text-sm'
            }`}
          >
            NOXIS
          </span>
          <span className="text-[8px] sm:text-[9px] tracking-[0.18em] text-[#64748B] font-semibold uppercase mt-0.5 truncate">
            {size === 'hero' ? 'Industrial ERP · Omnora Labs' : 'Enterprise ERP'}
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── First-visit intro: logo draw-on + fade (session once) ─── */
export function LandingIntro({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (reduce) {
      onDone()
      return
    }
    const t = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => onDone(), 2400),
    ]
    return () => t.forEach(clearTimeout)
  }, [onDone, reduce])

  if (reduce) return null

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: OBSIDIAN }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase >= 3 ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0.72, opacity: 0, filter: 'blur(8px)' }}
        animate={
          phase >= 1
            ? { scale: 1, opacity: 1, filter: 'blur(0px)' }
            : {}
        }
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        <BrandLogo size="splash" showWordmark />
      </motion.div>
      <motion.p
        className="mt-8 text-[10px] tracking-[0.35em] uppercase text-[#64748B] font-mono"
        initial={{ opacity: 0, y: 8 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
      >
        Initializing floor systems
      </motion.p>
      <motion.div
        className="mt-6 h-[2px] w-32 bg-white/10 overflow-hidden rounded-full"
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : {}}
      >
        <motion.div
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${CYAN_ACCENT}, ${CHAMPAGNE})` }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, ease: easeLuxury }}
        />
      </motion.div>
    </motion.div>
  )
}

/* ─── Scroll reveal wrapper ─── */
export function Reveal({
  children,
  className = '',
  delay = 0,
  variant = 'up',
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  variant?: 'up' | 'scale' | 'left' | 'right'
}) {
  const ref = useRef(null)
  const inView = useInView(ref, inViewOpts)
  const reduce = useReducedMotion()

  const hidden =
    variant === 'scale'
      ? { opacity: 0, scale: 0.92, y: 24 }
      : variant === 'left'
        ? { opacity: 0, x: -48 }
        : variant === 'right'
          ? { opacity: 0, x: 48 }
          : { opacity: 0, y: 40 }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? false : hidden}
      animate={inView || reduce ? { opacity: 1, x: 0, y: 0, scale: 1 } : hidden}
      transition={{ duration: 0.75, delay, ease: easeLuxury }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Stagger container for children with fadeUp ─── */
export function RevealStagger({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, inViewOpts)
  const reduce = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={stagger(0.08)}
      initial="hidden"
      animate={inView || reduce ? 'show' : 'hidden'}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  )
}

/* ─── Split headline: per-line mask reveal ─── */
export function SplitHeadline({ lines }: { lines: { text: string; accent?: boolean }[] }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <h1 ref={ref} className="text-4xl sm:text-6xl lg:text-[4.25rem] font-bold tracking-tight leading-[1.05] text-white">
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            className="block"
            style={
              line.accent
                ? {
                    backgroundImage: `linear-gradient(135deg, ${CHAMPAGNE_LIGHT} 0%, ${CHAMPAGNE} 30%, #FFFFFF 50%, ${CHAMPAGNE} 70%, ${CHAMPAGNE_LIGHT} 100%)`,
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }
                : {}
            }
            initial={reduce ? false : { y: '110%', opacity: 0 }}
            animate={
              inView || reduce
                ? {
                    y: 0,
                    opacity: 1,
                    backgroundPosition: reduce ? '0% center' : ['0% center', '200% center'],
                  }
                : { y: '110%', opacity: 0 }
            }
            transition={
              line.accent
                ? {
                    y: { duration: 0.85, delay: i * 0.12, ease: easeLuxury },
                    opacity: { duration: 0.85, delay: i * 0.12, ease: easeLuxury },
                    backgroundPosition: { duration: 8, repeat: Infinity, ease: 'linear' },
                  }
                : { duration: 0.85, delay: i * 0.12, ease: easeLuxury }
            }
          >
            {line.text}
          </motion.span>
        </span>
      ))}
    </h1>
  )
}

/* ─── Infinite marquee (CSS + duplicate track) ─── */
export function SignatureMarquee({ items }: { items: string[] }) {
  const reduce = useReducedMotion()
  const track = [...items, ...items]

  if (reduce) {
    return (
      <div className="flex flex-wrap justify-center gap-4 px-6 py-5 text-[10px] font-bold tracking-[0.2em] uppercase text-[#64748B]">
        {items.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    )
  }

  return (
    <div className="border-y border-white/[0.04] bg-white/[0.015] py-4 overflow-hidden">
      <div className="flex w-max noxis-marquee-track gap-12 px-6">
        {track.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#64748B] whitespace-nowrap flex items-center gap-12"
          >
            {label}
            <span className="w-1 h-1 rounded-full bg-[#C9A962]/40" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── Feature card: depth tilt on desktop, spring on tap ─── */
export function FeatureCard({
  href,
  icon: Icon,
  title,
  desc,
  index,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  title: string
  desc: string
  index: number
}) {
  const reduce = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <Reveal delay={index * 0.06} variant="scale">
      <motion.div
        whileHover={
          reduce || isMobile
            ? {}
            : {
                y: -10,
                scale: 1.02,
                transition: springs.snappy,
              }
        }
        style={{ perspective: 1200 }}
      >
        <Link
          href={href}
          className="group block p-8 rounded-xl border border-white/[0.05] bg-[#0A0B0D]/80 backdrop-blur-md hover:border-[#C5A059]/40 transition-all duration-300 relative overflow-hidden"
          style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.4)' }}
        >
          {/* Animated luxury glow hover border */}
          <div className="absolute inset-0 border border-transparent group-hover:border-[#C5A059]/20 rounded-xl transition-colors duration-300" />
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(400px circle at var(--mx,50%) var(--my,50%), ${CHAMPAGNE}18, transparent 50%)`,
            }}
          />
          <div className="relative">
            <motion.div
              className="w-11 h-11 rounded-lg flex items-center justify-center border border-[#C5A059]/30 bg-[#C5A059]/10 mb-6 group-hover:bg-[#C5A059]/20 transition-all duration-300"
              whileHover={reduce ? {} : { rotate: [0, -6, 6, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Icon size={20} style={{ color: CHAMPAGNE }} />
            </motion.div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 group-hover:text-[#E8D5B5] transition-colors">{title}</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed font-medium">{desc}</p>
          </div>
        </Link>
      </motion.div>
    </Reveal>
  )
}

/* ─── Cockpit tab with shared layoutId indicator ─── */
export function CockpitTabs({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: { id: string; label: string; icon: React.ReactNode }[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <LayoutGroup>
      <aside className="lg:col-span-3 bg-[#070708] border-b lg:border-b-0 lg:border-r border-white/[0.04] p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none">
        {tabs.map((tab) => {
          const isActive = activeId === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={`relative flex-none lg:w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-[10px] font-bold uppercase tracking-[0.12em] transition-colors snap-start ${
                isActive ? 'text-[#08090A]' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="cockpit-tab-pill"
                  className="absolute inset-0 rounded-lg shadow-lg"
                  style={{ background: CHAMPAGNE }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                {tab.icon}
                <span className="whitespace-nowrap">{tab.label}</span>
              </span>
            </button>
          )
        })}
      </aside>
    </LayoutGroup>
  )
}

/* ─── Nav bar brand link ─── */
export function NavBrand() {
  return (
    <Link href="/" className="group">
      <BrandLogo size="nav" />
    </Link>
  )
}

/* ─── Typewriter console lines ─── */
export function TypewriterConsole({ lines }: { lines: string[] }) {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(() => (reduce ? lines.length : 0))

  useEffect(() => {
    if (reduce) return
    let i = 0
    const id = setInterval(() => {
      i += 1
      setVisible(i)
      if (i >= lines.length) clearInterval(id)
    }, 280)
    return () => clearInterval(id)
  }, [lines.length, reduce])

  return (
    <div className="flex-1 p-4 rounded-lg border border-white/[0.04] bg-black/50 font-mono text-[11px] space-y-1.5 overflow-y-auto max-h-[320px]">
      {lines.slice(0, visible).map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className={
            line.includes('SUCCESS') || line.includes('STABILITY')
              ? 'text-[#10B981]'
              : line.includes('OFFLINE')
                ? 'text-[#C5A059]'
                : 'text-gray-500'
          }
        >
          {line}
        </motion.p>
      ))}
    </div>
  )
}

export { AnimatePresence, motion, LayoutGroup }
