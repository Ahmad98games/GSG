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
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, margin: '100px' })

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
      ref={ref}
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
      animate={
        inView
          ? { scale: [1, 1.15, 0.95, 1], x: [0, 20, -10, 0], y: [0, -15, 8, 0] }
          : { scale: 1, x: 0, y: 0 }
      }
      transition={{
        duration: 8 + delay,
        delay,
        repeat: inView ? Infinity : 0,
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
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, margin: '80px' })
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 5,
    duration: 6 + Math.random() * 6,
  }))

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {inView &&
        particles.map((p) => (
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

// ─── PARTICLE CANVAS (RAF — must cancel on unmount) ───────────────────────────

interface ParticleCanvasProps {
  count?: number
  color?: string
  className?: string
}

export function ParticleCanvas({ count = 48, color = '#60A5FA', className = '' }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inView = useInView(canvasRef, { once: false, margin: '80px' })

  useEffect(() => {
    if (!inView) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let alive = true
    const particles = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0008,
      vy: (Math.random() - 0.5) * 0.0008,
      r: Math.random() * 1.5 + 0.5,
    }))

    const onResize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      if (!alive) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > 1) p.vx *= -1
        if (p.y < 0 || p.y > 1) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.globalAlpha = 0.35
        ctx.fill()
      }
      ctx.globalAlpha = 1
      frame = requestAnimationFrame(draw)
    }

    onResize()
    window.addEventListener('resize', onResize)
    frame = requestAnimationFrame(draw)

    return () => {
      alive = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [inView, count, color])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden
    />
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
  const ref = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [shineX, setShineX] = useState(50)
  const [shineY, setShineY] = useState(50)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const inView = useInView(ref, { once: true, margin: isMobile ? '-15px' : '-60px' })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !ref.current) return
    const card = ref.current
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const xc = rect.width / 2
    const yc = rect.height / 2

    const rX = ((yc - y) / yc) * 8
    const rY = ((x - xc) / xc) * 8
    setRotateX(rX)
    setRotateY(rY)

    const sX = (x / rect.width) * 100
    const sY = (y / rect.height) * 100
    setShineX(sX)
    setShineY(sY)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotateX(0)
    setRotateY(0)
  }

  const handleMouseEnter = () => {
    if (!isMobile) setIsHovered(true)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: isMobile ? 15 : 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: isMobile ? 15 : 30 }}
      transition={{ duration: isMobile ? 0.4 : 0.6, delay: isMobile ? delay * 0.5 : delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        transform: isMobile 
          ? 'none' 
          : `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${isHovered ? -6 : 0}px)`,
        transition: isHovered 
          ? 'transform 0.08s ease-out' 
          : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`relative cursor-default ${className}`}
    >
      {/* Specular Shine Overlay */}
      {!isMobile && isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-inherit mix-blend-overlay opacity-30 z-10"
          style={{
            borderRadius: 'inherit',
            background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.22) 0%, transparent 60%)`,
            transition: 'background 0.05s ease-out',
          }}
        />
      )}

      {/* Animated glow */}
      {!isMobile && (
        <motion.div
          className="absolute inset-0 rounded-inherit pointer-events-none"
          animate={{
            boxShadow: isHovered
              ? `0 0 45px ${glowColor}, 0 25px 50px rgba(0,0,0,0.5)`
              : '0 0 0 transparent',
          }}
          transition={{ duration: 0.4 }}
          style={{ borderRadius: 'inherit' }}
        />
      )}
      
      <div style={{ transform: isMobile ? 'none' : 'translateZ(15px)', transformStyle: 'preserve-3d' }}>
        {children}
      </div>
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

// ─── 3D SCROLL REVEAL WRAPPER (SENIOR-WEB STANDARD) ───────────────────────────

interface ScrollReveal3DProps {
  children: React.ReactNode
  className?: string
  delay?: number
  intensity?: number
}

export function ScrollReveal3D({
  children,
  className = '',
  delay = 0,
  intensity = 18,
}: ScrollReveal3DProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Butter-smooth spring interpolation for GPU layers
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: isMobile ? 120 : 80,
    damping: isMobile ? 28 : 25,
    restDelta: 0.001,
  })

  // Transform states: settle fully by progress 0.35/0.45 and stay static
  const rotateX = useTransform(smoothProgress, [0, 0.22, 0.42, 1], [intensity, intensity * 0.4, 0, 0])
  const scale = useTransform(smoothProgress, [0, 0.22, 0.42, 1], [0.92, 0.96, 1, 1])
  const y = useTransform(smoothProgress, [0, 0.22, 0.42, 1], [80, 24, 0, 0])
  const opacity = useTransform(smoothProgress, [0, 0.12, 0.32, 1], [0, 0.65, 1, 1])

  return (
    <motion.div
      ref={ref}
      style={{
        y,
        scale,
        rotateX,
        opacity,
        transformPerspective: 1200,
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── PREMIUM 60FPS VECTOR MORPHING CANVAS ──────────────────────────────────────

interface MorphingCanvasProps {
  activeIndex: number
  activeColor?: string
  className?: string
}

export function MorphingCanvas({
  activeIndex,
  activeColor = '#00E5FF',
  className = '',
}: MorphingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000, tx: -1000, ty: -1000 })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let alive = true
    const count = 120 // Perfectly uniform count across shapes
    
    // Setup canvas size
    const onResize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    onResize()
    window.addEventListener('resize', onResize)

    // Helper: generate coordinate templates for shapes
    const generateShapes = () => {
      const shapes: Array<Array<{ x: number; y: number; z: number }>> = []

      // 1. GLOBE (Concentric Rings with Spiral)
      const globe: Array<{ x: number; y: number; z: number }> = []
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count)
        const theta = Math.sqrt(count * Math.PI) * phi
        globe.push({
          x: Math.sin(phi) * Math.cos(theta) * 0.72,
          y: Math.sin(phi) * Math.sin(theta) * 0.72,
          z: Math.cos(phi) * 0.72,
        })
      }
      shapes.push(globe)

      // 2. NEURAL BRAIN (Double-lobes cluster)
      const brain: Array<{ x: number; y: number; z: number }> = []
      for (let i = 0; i < count; i++) {
        const isLeft = i < count / 2
        const t = ((i % (count / 2)) / (count / 2)) * Math.PI * 2
        const r = 0.35 + 0.3 * Math.sin(t * 3)
        const xOffset = isLeft ? -0.32 : 0.32
        brain.push({
          x: xOffset + Math.cos(t) * r * 0.52,
          y: Math.sin(t) * r * 0.72,
          z: (Math.random() - 0.5) * 0.2,
        })
      }
      shapes.push(brain)

      // 3. CONCENTRIC FINTECH RINGS
      const rings: Array<{ x: number; y: number; z: number }> = []
      for (let i = 0; i < count; i++) {
        const ring = i % 3
        const t = (Math.floor(i / 3) / (count / 3)) * Math.PI * 2
        const r = ring === 0 ? 0.8 : ring === 1 ? 0.55 : 0.3
        const angle = ring === 0 ? 0.35 : ring === 1 ? -0.2 : 0.5
        const rawX = Math.cos(t) * r
        const rawY = Math.sin(t) * r * 0.35
        rings.push({
          x: rawX * Math.cos(angle) - rawY * Math.sin(angle),
          y: rawX * Math.sin(angle) + rawY * Math.cos(angle),
          z: Math.sin(t * 2) * 0.15,
        })
      }
      shapes.push(rings)

      // 4. ISOMETRIC WIREFRAME DATA CUBE
      const cube: Array<{ x: number; y: number; z: number }> = []
      const V = [
        [-0.45, -0.45, -0.45], [0.45, -0.45, -0.45], [0.45, 0.45, -0.45], [-0.45, 0.45, -0.45],
        [-0.45, -0.45, 0.45], [0.45, -0.45, 0.45], [0.45, 0.45, 0.45], [-0.45, 0.45, 0.45]
      ]
      const E = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Bottom face
        [4, 5], [5, 6], [6, 7], [7, 4], // Top face
        [0, 4], [1, 5], [2, 6], [3, 7]  // Connectors
      ]
      const pointsPerEdge = Math.floor(count / E.length) // 10 points per edge
      for (let e = 0; e < E.length; e++) {
        const v1 = V[E[e][0]]
        const v2 = V[E[e][1]]
        for (let p = 0; p < pointsPerEdge; p++) {
          const t = p / (pointsPerEdge - 1)
          cube.push({
            x: v1[0] + (v2[0] - v1[0]) * t,
            y: v1[1] + (v2[1] - v1[1]) * t,
            z: v1[2] + (v2[2] - v1[2]) * t,
          })
        }
      }
      // Fill remaining points to match EXACT count
      while (cube.length < count) {
        cube.push({ ...cube[cube.length - 1] })
      }
      shapes.push(cube)

      // 5. SYMMETRICAL SECURITY SHIELD
      const shield: Array<{ x: number; y: number; z: number }> = []
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2
        const rawX = Math.sin(t) * 0.72
        const rawY = -Math.cos(t) * 0.52 + Math.abs(rawX) * 0.35
        shield.push({
          x: rawX,
          y: rawY - 0.08,
          z: (Math.random() - 0.5) * 0.1,
        })
      }
      shapes.push(shield)

      return shapes
    }

    const shapes = generateShapes()

    // Initialize particle states
    const particles = Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 2,
      vx: 0,
      vy: 0,
      vz: 0,
    }))

    let rotationAngle = 0
    let lastActiveIndex = activeIndex

    // Color interpolation
    let currentRgb = { r: 0, g: 229, b: 255 }
    const hexToRgb = (hex: string) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
      const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b)
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 229, b: 255 }
    }

    const draw = () => {
      if (!alive) return
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      ctx.clearRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) * 0.42

      // Ease current active index shape templates
      const activeShape = shapes[activeIndex] || shapes[0]

      // Interpolate colors
      const targetRgb = hexToRgb(activeColor)
      currentRgb.r += (targetRgb.r - currentRgb.r) * 0.1
      currentRgb.g += (targetRgb.g - currentRgb.g) * 0.1
      currentRgb.b += (targetRgb.b - currentRgb.b) * 0.1

      const activeColorString = `rgb(${Math.round(currentRgb.r)}, ${Math.round(currentRgb.g)}, ${Math.round(currentRgb.b)})`

      // Rotate angle continuously
      rotationAngle += 0.008

      // Gentle interactive mouse inertia
      const mouse = mouseRef.current
      mouse.x += (mouse.tx - mouse.x) * 0.08
      mouse.y += (mouse.ty - mouse.y) * 0.08

      // Update and project particles
      const projected: Array<{ x: number; y: number; originalIdx: number; z: number }> = []

      for (let i = 0; i < count; i++) {
        const p = particles[i]
        const target = activeShape[i]

        // 3D rotation templates on target point to give it dynamic float
        const rotY_x = target.x * Math.cos(rotationAngle) - target.z * Math.sin(rotationAngle)
        const rotY_z = target.x * Math.sin(rotationAngle) + target.z * Math.cos(rotationAngle)

        const rotX_y = target.y * Math.cos(rotationAngle * 0.4) - rotY_z * Math.sin(rotationAngle * 0.4)
        const rotX_z = target.y * Math.sin(rotationAngle * 0.4) + rotY_z * Math.cos(rotationAngle * 0.4)

        // Interpolation towards target
        const morphSpeed = lastActiveIndex !== activeIndex ? 0.05 : 0.095
        p.x += (rotY_x - p.x) * morphSpeed
        p.y += (rotX_y - p.y) * morphSpeed
        p.z += (rotX_z - p.z) * morphSpeed

        // Screen space conversion
        let screenX = centerX + p.x * radius
        let screenY = centerY + p.y * radius

        // Mouse interactive deflection ("thrilled")
        const dx = screenX - mouse.x
        const dy = screenY - mouse.y
        const dist = Math.hypot(dx, dy)
        if (dist < 100) {
          const force = (100 - dist) / 100 * 32
          screenX += (dx / dist) * force
          screenY += (dy / dist) * force
        }

        projected.push({
          x: screenX,
          y: screenY,
          originalIdx: i,
          z: p.z,
        })
      }

      // Sync active index change triggers
      if (lastActiveIndex !== activeIndex) {
        lastActiveIndex = activeIndex
      }

      // Draw wireframe network connections
      if (!isMobile) {
        ctx.lineWidth = 0.42
        ctx.strokeStyle = `rgba(${Math.round(currentRgb.r)}, ${Math.round(currentRgb.g)}, ${Math.round(currentRgb.b)}, 0.12)`
        
        // Draw mesh wireframe for close points
        for (let i = 0; i < count; i++) {
          const a = projected[i]
          for (let j = i + 1; j < count; j++) {
            const b = projected[j]
            const d = Math.hypot(a.x - b.x, a.y - b.y)
            if (d < 50) {
              ctx.beginPath()
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(b.x, b.y)
              ctx.stroke()
            }
          }
        }
      }

      // Draw glow points
      projected.forEach((p) => {
        // Perspective sizing
        const size = (p.z + 1.5) * (isMobile ? 1.8 : 2.5)
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0.8, size), 0, Math.PI * 2)
        
        // High fidelity glow shadow
        ctx.shadowBlur = isMobile ? 3 : 8
        ctx.shadowColor = activeColorString
        ctx.fillStyle = activeColorString
        ctx.fill()
        
        // Clear shadow for next iterations to save CPU/GPU cycles
        ctx.shadowBlur = 0
      })

      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)

    // Handle mouse/touch movement for thrilled effects
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.tx = e.clientX - rect.left
      mouseRef.current.ty = e.clientY - rect.top
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect()
        mouseRef.current.tx = e.touches[0].clientX - rect.left
        mouseRef.current.ty = e.touches[0].clientY - rect.top
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current.tx = -1000
      mouseRef.current.ty = -1000
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('touchmove', handleTouchMove)
    canvas.addEventListener('touchend', handleMouseLeave)

    return () => {
      alive = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleMouseLeave)
    }
  }, [activeIndex, activeColor, isMobile])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block bg-transparent pointer-events-auto transition-[filter] duration-500 ${className}`}
      style={{ willChange: 'transform' }}
    />
  )
}

// ─── STRETCHING 3D CYBERNET GRID CANVAS ────────────────────────────────────────

interface StretchingGridCanvasProps {
  progress: number
  activeIndex: number
  activeColor: string
  className?: string
}

export function StretchingGridCanvas({
  progress,
  activeIndex,
  activeColor,
  className = '',
}: StretchingGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000, tx: -1000, ty: -1000 })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let alive = true
    const count = isMobile ? 64 : 144

    const onResize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    onResize()
    window.addEventListener('resize', onResize)

    // Generate 3D grid net coordinates
    const particles = Array.from({ length: count }, (_, i) => {
      // Sphere spiral coordinates (Compact state)
      const phi = Math.acos(-1 + (2 * i) / count)
      const theta = Math.sqrt(count * Math.PI) * phi
      const sphereX = Math.sin(phi) * Math.cos(theta) * 0.45
      const sphereY = Math.sin(phi) * Math.sin(theta) * 0.45
      const sphereZ = Math.cos(phi) * 0.45

      // Grid coordinates (Stretched state)
      const cols = Math.floor(Math.sqrt(count))
      const row = Math.floor(i / cols)
      const col = i % cols
      const gridX = (col / (cols - 1) - 0.5) * 1.5
      const gridY = (row / (cols - 1) - 0.5) * 1.5
      const gridZ = (Math.sin(col * 0.5) * Math.cos(row * 0.5)) * 0.25

      return {
        x: sphereX,
        y: sphereY,
        z: sphereZ,
        sphereX,
        sphereY,
        sphereZ,
        gridX,
        gridY,
        gridZ,
      }
    })

    let rotationAngle = 0
    let currentRgb = { r: 124, g: 58, b: 237 } // Purple starting color

    const hexToRgb = (hex: string) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
      const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b)
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 124, g: 58, b: 237 }
    }

    const draw = () => {
      if (!alive) return
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      ctx.clearRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2
      const radius = Math.min(w, h) * 0.5

      // Dynamic stretch interpolation bound to progress
      // Expands sphere into full screen net as progress goes from 0 to 0.4
      const stretchVal = Math.min(1, progress * 2.5)
      const morphFactor = Math.sin(stretchVal * Math.PI / 2) // smooth easeOut

      // Rotate grid continuously in 3D
      rotationAngle += 0.003 + (1 - morphFactor) * 0.005

      // Dynamic active index color mapping
      const targetRgb = hexToRgb(activeColor || '#7C3AED')
      currentRgb.r += (targetRgb.r - currentRgb.r) * 0.08
      currentRgb.g += (targetRgb.g - currentRgb.g) * 0.08
      currentRgb.b += (targetRgb.b - currentRgb.b) * 0.08
      const strokeColor = `rgba(${Math.round(currentRgb.r)}, ${Math.round(currentRgb.g)}, ${Math.round(currentRgb.b)}, ${0.08 + morphFactor * 0.08})`
      const pointColor = `rgba(${Math.round(currentRgb.r)}, ${Math.round(currentRgb.g)}, ${Math.round(currentRgb.b)}, ${0.4 + morphFactor * 0.4})`

      const mouse = mouseRef.current
      mouse.x += (mouse.tx - mouse.x) * 0.1
      mouse.y += (mouse.ty - mouse.y) * 0.1

      const projected: Array<{ x: number; y: number; z: number; size: number }> = []

      particles.forEach((p) => {
        // Linearly interpolate between sphere and grid layouts
        const targetX = p.sphereX + (p.gridX - p.sphereX) * morphFactor
        const targetY = p.sphereY + (p.gridY - p.sphereY) * morphFactor
        const targetZ = p.sphereZ + (p.gridZ - p.sphereZ) * morphFactor

        // Rotate in 3D space
        const cosY = Math.cos(rotationAngle)
        const sinY = Math.sin(rotationAngle)
        const cosX = Math.cos(rotationAngle * 0.4)
        const sinX = Math.sin(rotationAngle * 0.4)

        const rx = targetX * cosY - targetZ * sinY
        const rz = targetX * sinY + targetZ * cosY
        const ry = targetY * cosX - rz * sinX
        const finalZ = targetY * sinX + rz * cosX

        // 3D projection sizing
        let screenX = cx + rx * radius
        let screenY = cy + ry * radius

        // Interactive mouse deflection
        const dx = screenX - mouse.x
        const dy = screenY - mouse.y
        const dist = Math.hypot(dx, dy)
        if (dist < 120) {
          const force = (120 - dist) / 120 * 25
          screenX += (dx / dist) * force
          screenY += (dy / dist) * force
        }

        projected.push({
          x: screenX,
          y: screenY,
          z: finalZ,
          size: (finalZ + 1.2) * (isMobile ? 1.5 : 2.5),
        })
      })

      // Draw cybernet grid connection lines
      ctx.lineWidth = 0.5
      ctx.strokeStyle = strokeColor
      
      const cols = Math.floor(Math.sqrt(count))
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols)
        const col = i % cols

        // Connect to right neighbor
        if (col < cols - 1 && i + 1 < count) {
          ctx.beginPath()
          ctx.moveTo(projected[i].x, projected[i].y)
          ctx.lineTo(projected[i + 1].x, projected[i + 1].y)
          ctx.stroke()
        }
        // Connect to bottom neighbor
        if (row < cols - 1 && i + cols < count) {
          ctx.beginPath()
          ctx.moveTo(projected[i].x, projected[i].y)
          ctx.lineTo(projected[i + cols].x, projected[i + cols].y)
          ctx.stroke()
        }
      }

      // Draw grid joints as glowing particles
      projected.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0.6, p.size), 0, Math.PI * 2)
        ctx.fillStyle = pointColor
        ctx.shadowBlur = isMobile ? 2 : 6
        ctx.shadowColor = strokeColor
        ctx.fill()
        ctx.shadowBlur = 0
      })

      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.tx = e.clientX - rect.left
      mouseRef.current.ty = e.clientY - rect.top
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect()
        mouseRef.current.tx = e.touches[0].clientX - rect.left
        mouseRef.current.ty = e.touches[0].clientY - rect.top
      }
    }
    const handleMouseLeave = () => {
      mouseRef.current.tx = -1000
      mouseRef.current.ty = -1000
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('touchmove', handleTouchMove)
    canvas.addEventListener('touchend', handleMouseLeave)

    return () => {
      alive = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleMouseLeave)
    }
  }, [progress, activeIndex, activeColor, isMobile])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block bg-transparent pointer-events-auto ${className}`}
      style={{ willChange: 'transform' }}
    />
  )
}


