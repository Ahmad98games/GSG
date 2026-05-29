'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView, animate } from 'framer-motion'

// ─── ANIMATED COUNTER ──────────────────────────────────────────────────────────

interface AnimatedCounterProps {
  to: number
  from?: number
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
  decimals?: number
}

export function AnimatedCounter({
  to,
  from = 0,
  duration = 1.5,
  suffix = '',
  prefix = '',
  className = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null)
  const inView = useInView(nodeRef, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!inView || !nodeRef.current) return
    const node = nodeRef.current
    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(value) {
        node.textContent = prefix + value.toFixed(decimals) + suffix
      },
    })
    return () => controls.stop()
  }, [inView, from, to, duration, prefix, suffix, decimals])

  return (
    <span ref={nodeRef} className={className}>
      {prefix}{from.toFixed(decimals)}{suffix}
    </span>
  )
}

// ─── SCROLL PROGRESS BAR ───────────────────────────────────────────────────────

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX, transformOrigin: 'left' }}
    />
  )
}

// ─── FLOATING ORB ──────────────────────────────────────────────────────────────

interface FloatingOrbProps {
  color?: string
  size?: number
  x?: string
  y?: string
  delay?: number
  blur?: number
  opacity?: number
}

export function FloatingOrb({
  color = 'rgba(96,165,250,0.06)',
  size = 500,
  x = '50%',
  y = '50%',
  delay = 0,
  blur = 120,
  opacity = 1,
}: FloatingOrbProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <div
        className="absolute pointer-events-none select-none"
        style={{
          left: x,
          top: y,
          width: size * 0.7,
          height: size * 0.7,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${color} 0%, transparent 75%)`,
          filter: `blur(${Math.min(blur, 40)}px)`,
          opacity: opacity * 0.8,
        }}
      />
    )
  }

  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity,
      }}
      animate={{
        scale: [1, 1.15, 0.95, 1],
        x: [0, 20, -10, 0],
        y: [0, -15, 8, 0],
      }}
      transition={{
        duration: 8 + delay,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// ─── PARTICLE FIELD ────────────────────────────────────────────────────────────

interface ParticleFieldProps {
  count?: number
  color?: string
  className?: string
}

export function ParticleField({ count = 20, color = '#60A5FA', className = '' }: ParticleFieldProps) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 5,
    duration: 6 + Math.random() * 6,
  }))

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: color,
          }}
          animate={{
            y: [0, -80, 0],
            opacity: [0, 0.7, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── SECTION REVEAL ────────────────────────────────────────────────────────────

interface SectionRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'none'
}

export function SectionReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: SectionRevealProps) {
  const ref = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const inView = useInView(ref, { once: true, margin: isMobile ? '-15px' : '-80px' })

  const initial = {
    opacity: 0,
    y: direction === 'up' ? (isMobile ? 25 : 50) : 0,
    x: direction === 'left' ? -50 : direction === 'right' ? 50 : 0,
    scale: direction === 'none' ? 0.95 : 1,
  }

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, y: 0, x: 0, scale: 1 } : initial}
      transition={{
        duration: isMobile ? 0.4 : 0.7,
        delay: isMobile ? delay * 0.5 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── STAGGER LIST ──────────────────────────────────────────────────────────────

interface StaggerListProps {
  children: React.ReactNode[]
  className?: string
  childClassName?: string
  delay?: number
  staggerDelay?: number
}

export function StaggerList({
  children,
  className = '',
  childClassName = '',
  delay = 0.1,
  staggerDelay = 0.08,
}: StaggerListProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay, delayChildren: delay },
        },
      }}
      className={className}
    >
      {children.map((child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
          }}
          className={childClassName}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── MAGNETIC BUTTON ──────────────────────────────────────────────────────────

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  strength?: number
  onClick?: () => void
}

export function MagneticButton({ children, className = '', strength = 0.3, onClick }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    setPos({
      x: (e.clientX - cx) * strength,
      y: (e.clientY - cy) * strength,
    })
  }

  const handleMouseLeave = () => setPos({ x: 0, y: 0 })

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── PARALLAX SECTION ─────────────────────────────────────────────────────────

interface ParallaxProps {
  children: React.ReactNode
  speed?: number
  className?: string
}

export function ParallaxSection({ children, speed = 0.3, className = '' }: ParallaxProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-15%', '15%'])

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  )
}

// ─── MARQUEE TICKER ───────────────────────────────────────────────────────────

interface MarqueeTickerProps {
  items: string[]
  speed?: number
  className?: string
  itemClassName?: string
  separator?: string
}

export function MarqueeTicker({
  items,
  speed = 25,
  className = '',
  itemClassName = '',
  separator = '·',
}: MarqueeTickerProps) {
  const doubled = [...items, ...items]

  return (
    <div className={`overflow-hidden flex whitespace-nowrap ${className}`}>
      <div
        className="flex animate-marquee"
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {doubled.map((item, i) => (
          <span key={i} className={`px-6 ${itemClassName}`}>
            {item}
            <span className="mx-6 opacity-30">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── GLOWING CARD ─────────────────────────────────────────────────────────────

interface GlowCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  delay?: number
}

export function GlowCard({ children, className = '', glowColor = 'rgba(96,165,250,0.1)', delay = 0 }: GlowCardProps) {
  const ref = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const inView = useInView(ref, { once: true, margin: isMobile ? '-15px' : '-60px' })
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: isMobile ? 15 : 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: isMobile ? 15 : 30 }}
      transition={{ duration: isMobile ? 0.4 : 0.6, delay: isMobile ? delay * 0.5 : delay, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => !isMobile && setIsHovered(true)}
      onHoverEnd={() => !isMobile && setIsHovered(false)}
      whileHover={isMobile ? undefined : { y: -6, scale: 1.01 }}
      className={`relative cursor-default ${className}`}
    >
      {/* Animated glow */}
      {!isMobile && (
        <motion.div
          className="absolute inset-0 rounded-inherit pointer-events-none"
          animate={{
            boxShadow: isHovered
              ? `0 0 40px ${glowColor}, 0 20px 60px rgba(0,0,0,0.4)`
              : '0 0 0 transparent',
          }}
          transition={{ duration: 0.4 }}
          style={{ borderRadius: 'inherit' }}
        />
      )}
      {children}
    </motion.div>
  )
}

// ─── TYPED TEXT ───────────────────────────────────────────────────────────────

interface TypedTextProps {
  phrases: string[]
  className?: string
  speed?: number
  pauseTime?: number
}

export function TypedText({ phrases, className = '', speed = 80, pauseTime = 1800 }: TypedTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)

  useEffect(() => {
    const phrase = phrases[phraseIdx]

    if (isWaiting) return

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayed.length < phrase.length) {
          setDisplayed(phrase.slice(0, displayed.length + 1))
        } else {
          setIsWaiting(true)
          setTimeout(() => {
            setIsWaiting(false)
            setIsDeleting(true)
          }, pauseTime)
        }
      } else {
        if (displayed.length > 0) {
          setDisplayed(displayed.slice(0, -1))
        } else {
          setIsDeleting(false)
          setPhraseIdx((i) => (i + 1) % phrases.length)
        }
      }
    }, isDeleting ? speed / 2 : speed)

    return () => clearTimeout(timeout)
  }, [displayed, isDeleting, phraseIdx, phrases, isWaiting, speed, pauseTime])

  return (
    <span className={className}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-0.5 h-[1em] bg-current ml-0.5 align-middle"
      />
    </span>
  )
}
