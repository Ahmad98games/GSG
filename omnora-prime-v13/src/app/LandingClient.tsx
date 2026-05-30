'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence, animate } from 'framer-motion'
import { 
  Menu, X, ChevronRight, Sparkles, Layers, Smartphone, ShieldCheck,
  Check, BarChart4, Download, ArrowRight, Database, Globe2, Zap,
  KeyRound, BookOpen, Clock, Banknote
} from 'lucide-react'
import {
  FloatingOrb, ScrollProgressBar,
  SectionReveal, MarqueeTicker, GlowCard, TypedText
} from '@/components/ui/AnimatedComponents'

/* ─── shared easing ─── */
const ease = [0.16, 1, 0.3, 1] as const

/* ─── particle canvas ─── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const isMobile = window.innerWidth < 768
    const count = isMobile ? 15 : 60
    
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * (isMobile ? 0.25 : 0.4),
      vy: (Math.random() - 0.5) * (isMobile ? 0.25 : 0.4),
      r: Math.random() * 1.5 + (isMobile ? 0.3 : 0.5),
      a: Math.random(),
    }))
    let frame: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(96,165,250,${p.a * 0.35})`
        ctx.fill()
      })
      
      // draw connections - completely bypass on mobile to achieve solid 60fps
      if (!isMobile) {
        pts.forEach((a, i) => {
          pts.slice(i + 1).forEach(b => {
            const d = Math.hypot(a.x - b.x, a.y - b.y)
            if (d < 120) {
              ctx.beginPath()
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(b.x, b.y)
              ctx.strokeStyle = `rgba(96,165,250,${0.08 * (1 - d / 120)})`
              ctx.stroke()
            }
          })
        })
      }
      
      frame = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-50" />
}

// Decrypting Scrambler text decipher component
function DecryptingTicker({ text, active }: { text: string; active: boolean }) {
  const [displayedText, setDisplayedText] = useState("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (!active) {
      setDisplayedText("")
      return
    }

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;':\",./<>?₨"
    let iterations = 0
    const target = text

    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      setDisplayedText(
        target
          .split("")
          .map((char, index) => {
            if (char === " ") return " "
            if (index < iterations) {
              return target[index]
            }
            return chars[Math.floor(Math.random() * chars.length)]
          })
          .join("")
      )

      if (iterations >= target.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
      iterations += 1.5
    }, 24)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [text, active])

  return <span className="font-mono">{displayedText || text}</span>
}

// Cinematic Viewport Mask Section Switcher (Advanced 3D Responsive Stacking Deck)
function ScrollMorphSection({ isMobile }: { isMobile: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Smooth springs for tracking scroll progress
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 25, restDelta: 0.001 })

  // Ethereal viewport container mask transitions - expands to swallow the viewport
  const containerY = useTransform(smoothProgress, [0, 0.18], [280, 0])
  const containerScale = useTransform(smoothProgress, [0, 0.18, 0.72, 0.88], [0.85, 0.95, 0.95, 1.05])
  const containerRadius = useTransform(smoothProgress, [0, 0.18, 0.72, 0.88], ["32px", "24px", "24px", "0px"])
  const containerBorder = useTransform(smoothProgress, [0, 0.18, 0.72, 0.88], ["rgba(124,58,237,0.15)", "rgba(124,58,237,0.3)", "rgba(124,58,237,0.3)", "rgba(124,58,237,0)"])
  const containerBg = useTransform(smoothProgress, [0, 0.18, 0.72, 0.88], ["rgba(11,11,12,0.4)", "rgba(11,11,12,0.85)", "rgba(11,11,12,0.85)", "rgba(11,11,12,1)"])
  
  // Fast typographic fade/blur: central headline blurs and moves out instantly
  const titleOpacity = useTransform(smoothProgress, [0, 0.08, 0.15], [1, 0.5, 0])
  const titleScale = useTransform(smoothProgress, [0, 0.15], [1.05, 0.8])
  const titleBlur = useTransform(smoothProgress, [0, 0.15], ["blur(0px)", "blur(12px)"])
  const purpleBarScale = useTransform(smoothProgress, [0, 0.15], [1, 0.85])
  const purpleBarY = useTransform(smoothProgress, [0, 0.15], [0, 15])
  const textScale = useTransform(smoothProgress, [0, 0.15], [1, 0.88])

  // Cards content data
  const cards = [
    {
      id: 1,
      title: "Industry Intelligence Engine",
      subtitle: "REAL-TIME REGIONAL INDEXES",
      icon: <Sparkles className="text-[#00E5FF] w-6 h-6" />,
      desc: "Calculates average pieces-rates and commodity price benchmarks dynamically across major global hubs (Pakistan, UAE, Turkey, Bangladesh). Keeps workshop operations aligned with real-time regional trends.",
      color: "from-[#00E5FF]/10 via-[#7C3AED]/5 to-transparent",
      accent: "#00E5FF",
      stat: "₨ Piece Rate benchmark: +12% this month",
      metric: "Active in 10 Global Regions"
    },
    {
      id: 2,
      title: "Active Predictions Model",
      subtitle: "ON-DEVICE MACHINE LEARNING",
      icon: <Zap className="text-[#A3E635] w-6 h-6" />,
      desc: "Autonomously forecasts raw material stock-outs, identifies customer churn risks, and flags profit margin drops using localized on-device metrics. No server latencies or cloud subscription costs.",
      color: "from-[#A3E635]/10 via-[#7C3AED]/5 to-transparent",
      accent: "#A3E635",
      stat: "Inventory Alert: Bales stock-out risk in 4 days",
      metric: "94% Forecasting Precision"
    },
    {
      id: 3,
      title: "Working Capital Portal",
      subtitle: "EMBEDDED FACTORY FINTECH",
      icon: <Layers className="text-[#00E5FF] w-6 h-6" />,
      desc: "Evaluates standard credit scoring indexes (Grades A-D) directly from ledger accounts and work logs. Connects eligible factories to financial and loan institutions for frictionless liquidity flow.",
      color: "from-[#00E5FF]/10 via-[#7C3AED]/5 to-transparent",
      accent: "#00E5FF",
      stat: "Liquidity rating: Grade A (Highly Eligible)",
      metric: "₨ 50L Max Credit Limit"
    },
    {
      id: 4,
      title: "Open Developer APIs",
      subtitle: "ELITE B2B INTEGRATIONS",
      icon: <Database className="text-[#7C3AED] w-6 h-6" />,
      desc: "Provides secure cryptographically signed API keys and real-time webhook subscriptions for multi-branch ledger sync, inventory tracking, and custom third-party accounting integrations.",
      color: "from-[#7C3AED]/10 via-[#00E5FF]/5 to-transparent",
      accent: "#7C3AED",
      stat: "Webhook Dispatch: 0.04ms average response time",
      metric: "HMAC-SHA256 Signed Feeds"
    },
    {
      id: 5,
      title: "Verified Worker Identities",
      subtitle: "DIGITAL TALENT LEDGER",
      icon: <ShieldCheck className="text-[#A3E635] w-6 h-6" />,
      desc: "Empowers field staff and karigars with QR-verifiable digital identity profiles containing cumulative verified attendance metrics, skill classifications, and peshgi advances logs.",
      color: "from-[#A3E635]/10 via-[#7C3AED]/5 to-transparent",
      accent: "#A3E635",
      stat: "Verified: Hamid (Senior Weaver, 98% attendance)",
      metric: "Zero-Trust Verified Cards"
    }
  ]

  // Sequenced 3D kinetic transform positions for cards
  const card1Y = useTransform(smoothProgress, [0.15, 0.28, 0.28, 0.35], [300, 0, 0, 0])
  const card1Scale = useTransform(smoothProgress, [0.15, 0.28, 0.28, 0.35], [0.95, 1, 1, 0.92])
  const card1RotateX = useTransform(smoothProgress, [0.15, 0.28, 0.28, 0.35], [12, 0, 0, -12])
  const card1TranslateZ = useTransform(smoothProgress, [0.15, 0.28, 0.28, 0.35], [50, 0, 0, -80])
  const card1Opacity = useTransform(smoothProgress, [0.13, 0.18, 0.28, 0.35], [0, 1, 1, 0.22])
  const card1Blur = useTransform(smoothProgress, [0.28, 0.35], ["blur(0px)", "blur(4px)"])

  const card2Y = useTransform(smoothProgress, [0.28, 0.41, 0.41, 0.48], [300, 0, 0, 0])
  const card2Scale = useTransform(smoothProgress, [0.28, 0.41, 0.41, 0.48], [0.95, 1, 1, 0.92])
  const card2RotateX = useTransform(smoothProgress, [0.28, 0.41, 0.41, 0.48], [12, 0, 0, -12])
  const card2TranslateZ = useTransform(smoothProgress, [0.28, 0.41, 0.41, 0.48], [50, 0, 0, -80])
  const card2Opacity = useTransform(smoothProgress, [0.26, 0.31, 0.41, 0.48], [0, 1, 1, 0.22])
  const card2Blur = useTransform(smoothProgress, [0.41, 0.48], ["blur(0px)", "blur(4px)"])

  const card3Y = useTransform(smoothProgress, [0.41, 0.54, 0.54, 0.61], [300, 0, 0, 0])
  const card3Scale = useTransform(smoothProgress, [0.41, 0.54, 0.54, 0.61], [0.95, 1, 1, 0.92])
  const card3RotateX = useTransform(smoothProgress, [0.41, 0.54, 0.54, 0.61], [12, 0, 0, -12])
  const card3TranslateZ = useTransform(smoothProgress, [0.41, 0.54, 0.54, 0.61], [50, 0, 0, -80])
  const card3Opacity = useTransform(smoothProgress, [0.39, 0.44, 0.54, 0.61], [0, 1, 1, 0.22])
  const card3Blur = useTransform(smoothProgress, [0.54, 0.61], ["blur(0px)", "blur(4px)"])

  const card4Y = useTransform(smoothProgress, [0.54, 0.67, 0.67, 0.74], [300, 0, 0, 0])
  const card4Scale = useTransform(smoothProgress, [0.54, 0.67, 0.67, 0.74], [0.95, 1, 1, 0.92])
  const card4RotateX = useTransform(smoothProgress, [0.54, 0.67, 0.67, 0.74], [12, 0, 0, -12])
  const card4TranslateZ = useTransform(smoothProgress, [0.54, 0.67, 0.67, 0.74], [50, 0, 0, -80])
  const card4Opacity = useTransform(smoothProgress, [0.52, 0.57, 0.67, 0.74], [0, 1, 1, 0.22])
  const card4Blur = useTransform(smoothProgress, [0.67, 0.74], ["blur(0px)", "blur(4px)"])

  const card5Y = useTransform(smoothProgress, [0.67, 0.80], [300, 0])
  const card5Scale = useTransform(smoothProgress, [0.67, 0.80], [0.95, 1])
  const card5RotateX = useTransform(smoothProgress, [0.67, 0.80], [12, 0])
  const card5TranslateZ = useTransform(smoothProgress, [0.67, 0.80], [50, 0])
  const card5Opacity = useTransform(smoothProgress, [0.65, 0.72], [0, 1])

  // Progress dot tracker
  const [activeTab, setActiveTab] = useState(0)
  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      if (v < 0.22) setActiveTab(0)
      else if (v < 0.36) setActiveTab(1)
      else if (v < 0.50) setActiveTab(2)
      else if (v < 0.64) setActiveTab(3)
      else setActiveTab(4)
    })
  }, [scrollYProgress])

  return (
    <section ref={containerRef} className="relative h-[360vh] bg-[#0B0B0C] overflow-visible">
      
      {/* Cinematic neon purple lens blooms */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 lens-bloom opacity-50 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 lens-bloom opacity-45 pointer-events-none" />

      <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden">
        
        {/* Typography Headline - SIMPLE BY DESIGN / POWERFUL BY IMPACT */}
        <motion.div 
          style={{ opacity: titleOpacity, scale: titleScale, filter: titleBlur }}
          className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none z-10"
        >
          <div className="flex flex-col items-center justify-center text-center scale-75 md:scale-100 will-change-transform-opacity">
            <span className="text-[10px] md:text-xs font-bold text-[#7C3AED] tracking-widest uppercase mb-2 md:mb-4">ENGINEERED FOR MODERN WORKSHOPS</span>
            <h2 className="text-4xl md:text-8xl font-black tracking-tightest text-white uppercase leading-none font-sans">
              SIMPLE
            </h2>
            
            {/* Centered premium glowing lens bar */}
            <motion.div 
              style={{ scaleX: purpleBarScale, y: purpleBarY }}
              className="h-12 md:h-20 w-[85%] md:w-[80%] max-w-[580px] bg-gradient-to-r from-[#4C1D95] via-[#7C3AED] to-[#4C1D95] my-2 md:my-3 flex items-center justify-center rounded-full shadow-[0_0_50px_rgba(124,58,237,0.7)] border border-[#7C3AED]/35"
            >
              <motion.span 
                style={{ scale: textScale }}
                className="text-sm md:text-2xl font-black uppercase text-white tracking-widest leading-none font-sans"
              >
                BY DESIGN
              </motion.span>
            </motion.div>
            
            <h2 className="text-4xl md:text-8xl font-black tracking-tightest text-white uppercase leading-none font-sans mt-1 md:mt-2">
              POWERFUL
            </h2>
            <div className="text-[10px] md:text-sm font-bold text-[#94A3B8] tracking-[0.2em] uppercase mt-2 md:mt-4">
              BY IMPACT
            </div>
          </div>
        </motion.div>

        {/* Ethereal Viewport Mask Container - expanding to swallow the viewport */}
        <motion.div
          style={{
            y: containerY,
            scale: containerScale,
            borderRadius: containerRadius,
            borderColor: containerBorder,
            backgroundColor: containerBg,
            willChange: "transform, border-radius, border-color, background-color"
          }}
          className="w-[92%] md:w-full max-w-7xl mx-auto h-[80vh] border flex items-center justify-center p-4 md:p-12 relative overflow-hidden backdrop-blur-md transition-all duration-300 shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
        >
          {/* Satisfying Vector Coordinate Blueprint Grid backdrop */}
          <div className="absolute inset-0 holographic-grid pointer-events-none z-0 opacity-80" />
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7C3AED]/20 to-transparent" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#7C3AED]/20 to-transparent" />
          </div>

          {/* Top banner / active index indicator */}
          <div className="absolute top-4 md:top-6 left-6 md:left-12 right-6 md:right-12 flex justify-between items-center z-30">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-[9px] md:text-[10px] font-black tracking-widest text-[#7C3AED] uppercase">NOXIS ELITE FEATURES</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            
            {/* Scroll Indicator dots (hidden on mobile to clear room for bottom nav dock) */}
            <div className="hidden md:flex gap-1.5">
              {cards.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeTab === idx 
                      ? "w-6 bg-[#00E5FF]" 
                      : "w-1.5 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Scrolling Detail 3D Kinetic Stacking Cards Deck */}
          <div className="w-full max-w-4xl h-full flex flex-col justify-center items-center relative perspective-1200 z-10">
            
            {/* Card 1: Intelligence */}
            <motion.div
              style={{ 
                y: card1Y, 
                scale: card1Scale, 
                rotateX: card1RotateX, 
                transformPerspective: 1200,
                transformStyle: "preserve-3d",
                z: card1TranslateZ,
                opacity: card1Opacity, 
                filter: card1Blur,
                willChange: "transform, opacity, filter" 
              }}
              className="absolute w-full p-5 md:p-8 rounded-2xl border border-[#4C1D95]/20 bg-gradient-to-br from-[#00E5FF]/10 via-[#7C3AED]/5 to-transparent backdrop-blur-xl flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8 overflow-hidden preserve-3d"
            >
              {/* Dual-Axis Holographic Intersecting Scanlines Sweep */}
              {activeTab === 0 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  <div className="laser-scanner-sweep" />
                  <div className="laser-scanner-sweep-x" />
                </div>
              )}

              <div className="space-y-3 md:space-y-4 max-w-xl relative z-10 preserve-3d">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-white/5 rounded-lg border border-white/10">
                    {cards[0].icon}
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black tracking-widest text-[#00E5FF] uppercase font-mono">
                    {cards[0].subtitle}
                  </span>
                </div>
                <h3 className="text-lg md:text-3xl font-bold text-white tracking-tight leading-none">
                  {cards[0].title}
                </h3>
                <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed">
                  {cards[0].desc}
                </p>
                <div className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  {cards[0].metric}
                </div>
              </div>
              <div className="p-3 md:p-4 bg-black/60 border border-[#4C1D95]/25 rounded-lg flex-none w-full md:w-auto md:flex-1 md:max-w-[280px] relative z-10 preserve-3d">
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-1 md:mb-2">Live Floor Benchmarking</span>
                <p className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <DecryptingTicker text={cards[0].stat} active={activeTab === 0} />
                </p>
                <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-white/5 flex justify-between text-[9px] text-gray-500 font-mono">
                  <span>PKR AVERAGE</span>
                  <span className="text-white">₨ 1,240 / piece</span>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Predictions */}
            <motion.div
              style={{ 
                y: card2Y, 
                scale: card2Scale, 
                rotateX: card2RotateX, 
                transformPerspective: 1200,
                transformStyle: "preserve-3d",
                z: card2TranslateZ,
                opacity: card2Opacity, 
                filter: card2Blur,
                willChange: "transform, opacity, filter" 
              }}
              className="absolute w-full p-5 md:p-8 rounded-2xl border border-[#4C1D95]/20 bg-gradient-to-br from-[#A3E635]/10 via-[#7C3AED]/5 to-transparent backdrop-blur-xl flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8 overflow-hidden preserve-3d"
            >
              {/* Dual-Axis Holographic Intersecting Scanlines Sweep */}
              {activeTab === 1 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  <div className="laser-scanner-sweep" />
                  <div className="laser-scanner-sweep-x" />
                </div>
              )}

              <div className="space-y-3 md:space-y-4 max-w-xl relative z-10 preserve-3d">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-white/5 rounded-lg border border-white/10">
                    {cards[1].icon}
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black tracking-widest text-[#A3E635] uppercase font-mono">
                    {cards[1].subtitle}
                  </span>
                </div>
                <h3 className="text-lg md:text-3xl font-bold text-white tracking-tight leading-none">
                  {cards[1].title}
                </h3>
                <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed">
                  {cards[1].desc}
                </p>
                <div className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  {cards[1].metric}
                </div>
              </div>
              <div className="p-3 md:p-4 bg-black/60 border border-[#4C1D95]/25 rounded-lg flex-none w-full md:w-auto md:flex-1 md:max-w-[280px] relative z-10 preserve-3d">
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-1 md:mb-2">Automated Forecast Stream</span>
                <p className="text-xs font-mono font-bold text-[#A3E635] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
                  <DecryptingTicker text={cards[1].stat} active={activeTab === 1} />
                </p>
                <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-white/5 flex justify-between text-[9px] text-gray-500 font-mono">
                  <span>CONFIDENCE</span>
                  <span className="text-white">92% accuracy</span>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Finance */}
            <motion.div
              style={{ 
                y: card3Y, 
                scale: card3Scale, 
                rotateX: card3RotateX, 
                transformPerspective: 1200,
                transformStyle: "preserve-3d",
                z: card3TranslateZ,
                opacity: card3Opacity, 
                filter: card3Blur,
                willChange: "transform, opacity, filter" 
              }}
              className="absolute w-full p-5 md:p-8 rounded-2xl border border-[#4C1D95]/20 bg-gradient-to-br from-[#00E5FF]/10 via-[#7C3AED]/5 to-transparent backdrop-blur-xl flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8 overflow-hidden preserve-3d"
            >
              {/* Dual-Axis Holographic Intersecting Scanlines Sweep */}
              {activeTab === 2 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  <div className="laser-scanner-sweep" />
                  <div className="laser-scanner-sweep-x" />
                </div>
              )}

              <div className="space-y-3 md:space-y-4 max-w-xl relative z-10 preserve-3d">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-white/5 rounded-lg border border-white/10">
                    {cards[2].icon}
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black tracking-widest text-[#00E5FF] uppercase font-mono">
                    {cards[2].subtitle}
                  </span>
                </div>
                <h3 className="text-lg md:text-3xl font-bold text-white tracking-tight leading-none">
                  {cards[2].title}
                </h3>
                <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed">
                  {cards[2].desc}
                </p>
                <div className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  {cards[2].metric}
                </div>
              </div>
              <div className="p-3 md:p-4 bg-black/60 border border-[#4C1D95]/25 rounded-lg flex-none w-full md:w-auto md:flex-1 md:max-w-[280px] relative z-10 preserve-3d">
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-1 md:mb-2">Automated Credit Scoring</span>
                <p className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <DecryptingTicker text={cards[2].stat} active={activeTab === 2} />
                </p>
                <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-white/5 flex justify-between text-[9px] text-gray-500 font-mono">
                  <span>PARTNER BANK</span>
                  <span className="text-white">Habib Metropolitan</span>
                </div>
              </div>
            </motion.div>

            {/* Card 4: APIs */}
            <motion.div
              style={{ 
                y: card4Y, 
                scale: card4Scale, 
                rotateX: card4RotateX, 
                transformPerspective: 1200,
                transformStyle: "preserve-3d",
                z: card4TranslateZ,
                opacity: card4Opacity, 
                filter: card4Blur,
                willChange: "transform, opacity, filter" 
              }}
              className="absolute w-full p-5 md:p-8 rounded-2xl border border-[#4C1D95]/20 bg-gradient-to-br from-[#7C3AED]/10 via-[#00E5FF]/5 to-transparent backdrop-blur-xl flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8 overflow-hidden preserve-3d"
            >
              {/* Dual-Axis Holographic Intersecting Scanlines Sweep */}
              {activeTab === 3 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  <div className="laser-scanner-sweep" />
                  <div className="laser-scanner-sweep-x" />
                </div>
              )}

              <div className="space-y-3 md:space-y-4 max-w-xl relative z-10 preserve-3d">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-white/5 rounded-lg border border-white/10">
                    {cards[3].icon}
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black tracking-widest text-[#7C3AED] uppercase font-mono">
                    {cards[3].subtitle}
                  </span>
                </div>
                <h3 className="text-lg md:text-3xl font-bold text-white tracking-tight leading-none">
                  {cards[3].title}
                </h3>
                <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed">
                  {cards[3].desc}
                </p>
                <div className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  {cards[3].metric}
                </div>
              </div>
              <div className="p-3 md:p-4 bg-black/60 border border-[#4C1D95]/25 rounded-lg flex-none w-full md:w-auto md:flex-1 md:max-w-[280px] relative z-10 preserve-3d">
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-1 md:mb-2">Cryptographic API Console</span>
                <p className="text-xs font-mono font-bold text-[#7C3AED] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
                  <DecryptingTicker text={cards[3].stat} active={activeTab === 3} />
                </p>
                <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-white/5 flex justify-between text-[9px] text-gray-500 font-mono">
                  <span>PROTOCOL</span>
                  <span className="text-white">Webhooks v2.5</span>
                </div>
              </div>
            </motion.div>

            {/* Card 5: Identity */}
            <motion.div
              style={{ 
                y: card5Y, 
                scale: card5Scale, 
                rotateX: card5RotateX, 
                transformPerspective: 1200,
                transformStyle: "preserve-3d",
                z: card5TranslateZ,
                opacity: card5Opacity,
                willChange: "transform, opacity" 
              }}
              className="absolute w-full p-5 md:p-8 rounded-2xl border border-[#4C1D95]/20 bg-gradient-to-br from-[#A3E635]/10 via-[#7C3AED]/5 to-transparent backdrop-blur-xl flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8 overflow-hidden preserve-3d"
            >
              {/* Dual-Axis Holographic Intersecting Scanlines Sweep */}
              {activeTab === 4 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  <div className="laser-scanner-sweep" />
                  <div className="laser-scanner-sweep-x" />
                </div>
              )}

              <div className="space-y-3 md:space-y-4 max-w-xl relative z-10 preserve-3d">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-white/5 rounded-lg border border-white/10">
                    {cards[4].icon}
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black tracking-widest text-[#A3E635] uppercase font-mono">
                    {cards[4].subtitle}
                  </span>
                </div>
                <h3 className="text-lg md:text-3xl font-bold text-white tracking-tight leading-none">
                  {cards[4].title}
                </h3>
                <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed">
                  {cards[4].desc}
                </p>
                <div className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  {cards[4].metric}
                </div>
              </div>
              <div className="p-3 md:p-4 bg-black/60 border border-[#4C1D95]/25 rounded-lg flex-none w-full md:w-auto md:flex-1 md:max-w-[280px] relative z-10 preserve-3d">
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-1 md:mb-2">Worker Verification Profile</span>
                <p className="text-xs font-mono font-bold text-[#A3E635] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
                  <DecryptingTicker text={cards[4].stat} active={activeTab === 4} />
                </p>
                <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-white/5 flex justify-between text-[9px] text-gray-500 font-mono">
                  <span>LEDGER STATUS</span>
                  <span className="text-white">Verified Ledger</span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Floating mini quick-access navigation dock on mobile screens */}
          {isMobile && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 border border-[#7C3AED]/30 px-3 py-1.5 rounded-full flex gap-3.5 backdrop-blur-xl z-30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              {cards.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => {
                    const scrollMap = [0.22, 0.36, 0.50, 0.64, 0.78]
                    const targetY = containerRef.current!.offsetTop + (containerRef.current!.offsetHeight * scrollMap[idx])
                    window.scrollTo({ top: targetY, behavior: 'smooth' })
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold border transition-all duration-300 ${
                    activeTab === idx 
                      ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-[0_0_10px_rgba(124,58,237,0.5)] scale-110" 
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {c.id}
                </button>
              ))}
            </div>
          )}

        </motion.div>
      </div>
    </section>
  )
}

// (Animated stat counter removed to ensure 100% reliable, professional static numbers)

/* ─── main component ─── */
export default function LandingClient() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(() =>
    typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron')
  )
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [heroRotateX, setHeroRotateX] = useState(12)
  const [heroRotateY, setHeroRotateY] = useState(-18)
  const [heroIsHovered, setHeroIsHovered] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  
  const [testimonials, setTestimonials] = useState<any[]>([])

  useEffect(() => {
    async function fetchTestimonials() {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setTestimonials(data)
      }
    }
    fetchTestimonials()
  }, [supabase])

  // Parallax for hero
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, -80])
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const xc = rect.width / 2
    const yc = rect.height / 2

    const rX = 12 + ((yc - y) / yc) * 6
    const rY = -18 + ((x - xc) / xc) * 6
    setHeroRotateX(rX)
    setHeroRotateY(rY)
  }

  const handleHeroMouseEnter = () => {
    if (!isMobile) setHeroIsHovered(true)
  }

  const handleHeroMouseLeave = () => {
    setHeroIsHovered(false)
    setHeroRotateX(12)
    setHeroRotateY(-18)
  }

  useEffect(() => {
    const off = scrollY.on('change', v => setNavScrolled(v > 20))
    return off
  }, [scrollY])

  useEffect(() => {
    async function handleAuthRedirect() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: profile } = await supabase
            .from('business_profiles').select('id, onboarding_done')
            .eq('user_id', session.user.id).single()
          router.push(profile?.onboarding_done ? '/dashboard' : '/setup')
        } else {
          const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron')
          if (isElectron) router.push('/login')
          else setChecking(false)
        }
      } catch { setChecking(false) }
    }
    handleAuthRedirect()
  }, [supabase, router])

  if (checking) return (
    <div className="min-h-screen bg-[#070809] flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full"
      />
    </div>
  )

  const features = [
    { icon: <Database size={22} className="text-blue-400" />, title: 'Offline-First SQLite', desc: 'Double-ciphered local database that reconciles with cloud on reconnect. Zero reliance on continuous internet.', color: 'blue' },
    { icon: <Layers size={22} className="text-amber-400" />, title: 'Barcode & SKU Engine', desc: 'Scan, store, and manage raw bales, fabric yards, chemical batches. Auto-triggers reorder level alerts.', color: 'amber' },
    { icon: <Smartphone size={22} className="text-emerald-400" />, title: 'Mobile Floor Handhelds', desc: 'Workers log piece-rate counts and attendance from Android terminals paired via local WiFi instantly.', color: 'emerald' },
    { icon: <ShieldCheck size={22} className="text-red-400" />, title: 'AI Sentinel CCTV', desc: 'Draw virtual zone boundaries. Triggers instant local alerts for unauthorized entries — no cloud storage fees.', color: 'red' },
    { icon: <BarChart4 size={22} className="text-indigo-400" />, title: 'Double-Entry Accounting', desc: 'Log receipts, bank entries, and ledger credits. Generate P&L and aging accounts with one click.', color: 'indigo' },
    { icon: <Globe2 size={22} className="text-teal-400" />, title: 'Multilingual Scripts', desc: 'Switch Urdu Nastaliq and English instantly to accommodate local workers and international administrators.', color: 'teal' },
  ]

  const glowColors: Record<string, string> = {
    blue: 'rgba(96,165,250,0.12)',
    amber: 'rgba(251,191,36,0.1)',
    emerald: 'rgba(16,185,129,0.1)',
    red: 'rgba(239,68,68,0.1)',
    indigo: 'rgba(99,102,241,0.1)',
    teal: 'rgba(20,184,166,0.1)',
  }

  const tableRows = [
    ['100% Offline Local Network', '✅ Full', '✅ Manual', '❌ Fails'],
    ['Karigar Piece-Rate Payroll', '✅ Automated', '❌ Formula Errors', '❌ Custom Dev'],
    ['Peshgi Advance Tracking', '✅ Automated', '❌ Complex', '❌ Generic'],
    ['Real-time AI CCTV', '✅ Built-in', '❌ Not Possible', '❌ Cloud Fees'],
    ['Urdu Nastaliq Interface', '✅ Native', '❌ Text only', '❌ None'],
    ['Implementation', '10 Minutes', 'DIY Build', '3–6 Months'],
  ]

  const marqueeItems = [
    'Textile Mills 🏭', 'Rice Mills 🌾', 'Karigar Payroll 💰',
    'CCTV Security 📹', 'Offline ERP 🔌', 'Urdu Support 🇵🇰',
    'Barcode Inventory 📦', 'Double-Entry Khata 📒', 'WhatsApp Payslips 📱',
    'Peshgi Tracking 💳', 'Multi-Branch 🏢', 'Android Pairing 📲',
  ]

  return (
    <div className="bg-[#070809] text-white font-sans min-h-screen selection:bg-blue-500 selection:text-black overflow-x-hidden">

      {/* ── Scroll progress ─────────────────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* ── Ambient particle canvas ──────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <ParticleCanvas />
        <FloatingOrb color="rgba(96,165,250,0.08)" size={700} x="20%" y="10%" delay={0} blur={130} />
        <FloatingOrb color="rgba(197,160,89,0.06)" size={600} x="80%" y="30%" delay={2} blur={140} />
        <FloatingOrb color="rgba(99,102,241,0.07)" size={500} x="50%" y="70%" delay={4} blur={120} />
      </div>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 border-b transition-all"
        animate={{
          backdropFilter: navScrolled ? 'blur(24px)' : 'blur(8px)',
          backgroundColor: navScrolled ? 'rgba(7,8,9,0.92)' : 'rgba(7,8,9,0.5)',
          borderColor: navScrolled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <Link href="/" className="flex items-center gap-3 cursor-pointer group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="w-8 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-colors"
              >
                <img src="/logos/noxis.png" alt="Noxis" className="w-5 h-5 object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </motion.div>
              <span className="font-extrabold text-lg tracking-wider text-white group-hover:text-blue-400 transition-colors">NOXIS</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="hidden md:flex items-center gap-8"
          >
            {[{ label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }].map((link, i) => (
              <motion.div key={link.href} whileHover={{ y: -1 }}>
                <Link href={link.href} className="text-sm text-gray-400 hover:text-white font-medium transition-colors relative group">
                  {link.label}
                  <motion.div
                    className="absolute -bottom-0.5 left-0 right-0 h-px bg-blue-400"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </Link>
              </motion.div>
            ))}
            <motion.div 
              whileHover={{ y: -3, scale: 1.02 }} 
              whileTap={{ y: 1, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <Link
                href="/download"
                className="btn-shine text-xs font-bold tracking-widest uppercase text-black bg-[#60A5FA] hover:bg-blue-400 px-6 py-2.5 rounded-sm transition-all shadow-[0_0_20px_rgba(96,165,250,0.2)]"
              >
                Download
              </Link>
            </motion.div>
          </motion.div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white transition-colors">
            <AnimatePresence mode="wait">
              {mobileMenuOpen
                ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={24} /></motion.div>
                : <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Menu size={24} /></motion.div>}
            </AnimatePresence>
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease }}
              className="md:hidden border-b border-white/[0.06] bg-[#070809] overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                {[{ label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }, { label: 'Download', href: '/download' }].map((link, i) => (
                  <motion.div key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, ease }}
                  >
                    <Link href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white font-semibold transition-colors">{link.label}</Link>
                  </motion.div>
                ))}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, ease }}>
                  <Link href="/download" onClick={() => setMobileMenuOpen(false)}
                    className="block text-center font-bold text-sm tracking-widest uppercase text-black bg-[#60A5FA] hover:bg-blue-400 py-3.5 rounded-sm transition-all">
                    Free Trial Download
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-32 pb-24 md:pt-48 md:pb-36 px-6 max-w-7xl mx-auto min-h-screen flex items-center">
        <motion.div style={isMobile ? undefined : { y: heroY, opacity: heroOpacity }} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

            {/* Left text */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
              }}
              className="lg:col-span-7 space-y-8"
            >
              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}
                className="inline-flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1.5"
              >
                <motion.div className="w-2 h-2 rounded-full bg-blue-400"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">Industrial ERP · v13.1 Premium</span>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}
              >
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.05] text-white">
                  Factory software<br className="hidden sm:inline" />
                  that runs{' '}
                  <span className="animate-gradient-text">
                    offline.
                  </span>
                </h1>
                <div className="mt-4 text-2xl sm:text-3xl font-bold text-gray-500 h-10">
                  <TypedText
                    phrases={['Karigar Payroll.', 'CCTV Sentinel.', 'Khata Ledger.', 'Offline Inventory.', 'Peshgi Tracking.']}
                    className="text-blue-400/80"
                  />
                </div>
              </motion.div>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}
                className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl"
              >
                Manage floor inventory, piece-rate karigar payroll, double-entry financial accounts, and smart AI CCTV monitoring. Works reliably without internet or cloud fees.
              </motion.p>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
              >
                <motion.div 
                  whileHover={{ y: -5, scale: 1.02 }} 
                  whileTap={{ y: 1, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Link href="/download"
                    className="btn-shine flex items-center justify-center gap-2.5 bg-[#60A5FA] hover:bg-blue-400 text-black font-extrabold text-sm tracking-wider px-8 py-4 rounded-sm transition-all shadow-[0_0_30px_rgba(96,165,250,0.25)]"
                  >
                    <Download size={16} />
                    Download Free Trial
                  </Link>
                </motion.div>
                <motion.div whileHover={{ x: 4 }}>
                  <Link href="/pricing" className="flex items-center gap-1.5 text-gray-400 hover:text-white font-semibold text-sm py-3 transition-colors group">
                    Explore licensing tiers
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </motion.div>

              {/* Geo trust */}
              <motion.div
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, delay: 0.2, ease } } }}
                className="pt-8 border-t border-white/5 flex flex-wrap items-center gap-x-8 gap-y-3"
              >
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest block w-full mb-1">Built for factories in Pakistan, UAE, and beyond</span>
                {[{ flag: '🇵🇰', label: 'Pakistan' }, { flag: '🇦🇪', label: 'UAE / GCC' }, { flag: '🇹🇷', label: 'Turkey' }, { flag: '🇧🇩', label: 'Bangladesh' }].map((c, i) => (
                  <motion.div key={c.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.08, ease }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="text-xs text-gray-500 font-semibold">{c.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: animated dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.35, ease }}
              onMouseMove={handleHeroMouseMove}
              onMouseEnter={handleHeroMouseEnter}
              onMouseLeave={handleHeroMouseLeave}
              className="lg:col-span-5 relative"
              style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
            >
              <motion.div
                animate={heroIsHovered ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Backdrop glow */}
                <div className="absolute inset-0 bg-blue-500/15 blur-[80px] pointer-events-none rounded-full" />

                <div 
                  className="relative bg-[#0F1114] border border-white/10 rounded-xl overflow-hidden transition-all duration-700 ease-out"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isMobile 
                      ? 'none' 
                      : `perspective(1200px) rotateX(${heroRotateX}deg) rotateY(${heroRotateY}deg) rotateZ(1deg)`,
                    boxShadow: isMobile
                      ? '0 20px 40px rgba(0,0,0,0.6)'
                      : `0 40px 100px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.08), ${heroRotateY * -0.6}px ${heroRotateX * 0.6}px 60px rgba(96,165,250,0.1)`,
                  }}
                >
                  {/* Title bar */}
                  <div className="bg-[#0A0C0F] border-b border-white/5 px-4 py-3 flex items-center justify-between" style={{ transform: isMobile ? 'none' : 'translateZ(10px)' }}>
                    <div className="flex items-center gap-2">
                      <motion.span className="w-3 h-3 rounded-full bg-red-500/80" whileHover={{ scale: 1.3 }} />
                      <motion.span className="w-3 h-3 rounded-full bg-yellow-500/80" whileHover={{ scale: 1.3 }} />
                      <motion.span className="w-3 h-3 rounded-full bg-green-500/80" whileHover={{ scale: 1.3 }} />
                    </div>
                    <span className="text-[10px] text-gray-600 font-mono tracking-widest uppercase">Noxis Node Terminal</span>
                    <motion.span
                      className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      LOCAL ACTIVE
                    </motion.span>
                  </div>

                  <div className="p-5 space-y-4" style={{ transformStyle: 'preserve-3d' }}>
                    {/* KPI grid */}
                    <div className="grid grid-cols-2 gap-3" style={{ transform: isMobile ? 'none' : 'translateZ(25px)', transformStyle: 'preserve-3d' }}>
                      {[
                        { label: 'Mandi Output', value: '45,820 kg', color: 'text-amber-400', delay: 0.5 },
                        { label: 'Active Karigars', value: '142 Live', color: 'text-blue-400', delay: 0.6 },
                        { label: 'Weekly Revenue', value: '₨ 18.4L', color: 'text-emerald-400', delay: 0.7 },
                        { label: 'Loss Ratio', value: '0.04%', color: 'text-red-400', delay: 0.8 },
                      ].map((s, i) => (
                        <motion.div key={s.label}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: s.delay, ease }}
                          whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.12)' }}
                          className="bg-[#161A1F] border border-white/5 p-3.5 rounded-lg cursor-default"
                        >
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">{s.label}</p>
                          <p className={`font-mono text-sm font-black ${s.color}`}>{s.value}</p>
                          <motion.div
                            className="h-0.5 mt-2 rounded-full bg-current opacity-20"
                            initial={{ scaleX: 0, originX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: s.delay + 0.3, duration: 0.8 }}
                          />
                        </motion.div>
                      ))}
                    </div>

                    {/* Live feed */}
                    <div className="bg-[#08090C] border border-white/5 p-4 rounded-lg font-mono text-[10px] space-y-2" style={{ transform: isMobile ? 'none' : 'translateZ(15px)' }}>
                      <div className="flex justify-between items-center text-gray-600 mb-2">
                        <span className="font-bold uppercase tracking-widest">SYS FEED</span>
                        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-emerald-500">● LIVE</motion.span>
                      </div>
                      {[
                        { text: 'SQLite sync: 41 entries replicated.', color: 'text-blue-400' },
                        { text: 'Camera 01: Person detected (98%).', color: 'text-emerald-400' },
                        { text: 'Peshgi alert: Karigar Hamid — threshold.', color: 'text-amber-500' },
                      ].map((log, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + i * 0.15, ease }}
                          className={`flex items-start gap-2 ${log.color}`}
                        >
                          <span className="text-gray-700 mt-0.5">›</span>
                          <span>{log.text}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Mobile mesh bar */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                      className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between"
                      style={{ transform: isMobile ? 'none' : 'translateZ(20px)' }}
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone size={18} className="text-blue-400" />
                        <div>
                          <h4 className="text-xs font-bold text-white">Mobile Mesh</h4>
                          <p className="text-[10px] text-gray-500">Local WiFi pairing active</p>
                        </div>
                      </div>
                      <motion.span
                        animate={{ opacity: [1, 0.6, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono font-bold"
                      >
                        CONNECTED
                      </motion.span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── MARQUEE TICKER ──────────────────────────────────────────── */}
      <div className="py-5 border-y border-white/5 bg-white/[0.01] overflow-hidden">
        <MarqueeTicker
          items={marqueeItems}
          className="text-[11px] font-bold uppercase tracking-widest text-gray-600"
          itemClassName="hover:text-gray-400 transition-colors cursor-default"
          speed={30}
        />
      </div>

      {/* ── STATS BAR ───────────────────────────────────────────────── */}
      <section className="border-b border-white/[0.06] bg-[#0A0C0F]/60 backdrop-blur-md px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4">
            {[
              { value: '40+', label: 'Industries supported' },
              { value: '30+', label: 'Currencies' },
              { value: '6', label: 'Languages' },
              { value: '100%', label: 'Offline capable' },
              { value: 'PKR 2,500', label: 'Starting price' },
            ].map((s, i) => (
              <SectionReveal key={s.label} delay={i * 0.08} className="text-center">
                <motion.div whileHover={{ scale: 1.06 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <div className="font-mono text-3xl sm:text-4xl font-black text-white mb-2">
                    {s.value}
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{s.label}</p>
                  <motion.div
                    className="mt-3 h-0.5 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent mx-auto max-w-[60px]"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                  />
                </motion.div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── NAYA PAY SCROLL MORPH SECTIONS ───────────────────────────── */}
      <ScrollMorphSection isMobile={isMobile} />

      {/* ── FEATURES GRID ───────────────────────────────────────────── */}
      <section className="py-28 px-6 max-w-7xl mx-auto">
        <SectionReveal className="max-w-xl mb-20 space-y-4">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Core Features</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tighter text-white leading-none">
            Everything your factory<br />needs. Nothing it doesn't.
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Engineered specifically for manufacturing floors — without bloated cloud overheads or complicated interfaces.
          </p>
        </SectionReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <GlowCard key={f.title} delay={i * 0.09} glowColor={glowColors[f.color]}
              className="bg-[#0F1114] border border-white/5 p-8 rounded-xl"
            >
              <div className="space-y-4">
                <motion.div
                  className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center border border-white/10"
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {f.icon}
                </motion.div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                <motion.div
                  className="flex items-center gap-1 text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mt-2"
                  whileHover={{ gap: '8px', color: '#60A5FA' }}
                >
                  <span>Learn more</span>
                  <ChevronRight size={10} />
                </motion.div>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>

      {/* ── COMPARISON TABLE ────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#0A0C0F]/40 border-y border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <SectionReveal className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why not just use Excel?
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Most local factories rely on spreadsheets. Here's how specialized offline-first automation compares.
            </p>
          </SectionReveal>

          <SectionReveal delay={0.15}>
            <div className="overflow-x-auto border border-white/5 rounded-xl bg-[#0F1114] shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0A0C0F]">
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Operational Needs</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-blue-400 text-center">Noxis ERP</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center hidden sm:table-cell">Spreadsheets</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center hidden sm:table-cell">Cloud ERP</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ delay: i * 0.06, ease }}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                      className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}
                    >
                      <td className="p-4 text-xs font-bold text-gray-300">{row[0]}</td>
                      <td className="p-4 text-xs font-bold text-blue-400 text-center">{row[1]}</td>
                      <td className="p-4 text-xs text-gray-500 text-center hidden sm:table-cell">{row[2]}</td>
                      <td className="p-4 text-xs text-gray-500 text-center hidden sm:table-cell">{row[3]}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ── WHO USES NOXIS ─────────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-6xl mx-auto border-t border-white/[0.06]">
        <SectionReveal className="text-center mb-16 space-y-4">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Built For</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
            Factory owners who are done<br />with spreadsheets.
          </h2>
        </SectionReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              industry: 'Textile factory',
              location: 'Faisalabad, Pakistan',
              problem: 'Tracking 40 karigars piece-rate wages in Excel took 3 days every month.',
              solution: 'With Noxis: wages calculate automatically. Payslips go out in minutes.',
              flag: '🇵🇰',
              color: 'blue',
            },
            {
              industry: 'Rice mill',
              location: 'Lahore, Pakistan',
              problem: 'Dealer payments were tracked in a register. Disputes happened every month.',
              solution: 'With Noxis: every dealer has a live balance. No more disputes.',
              flag: '🇵🇰',
              color: 'amber',
            },
            {
              industry: 'Auto parts manufacturer',
              location: 'Dubai, UAE',
              problem: 'Cloud ERP cost AED 800/month and required constant internet.',
              solution: 'With Noxis: works offline, costs less, speaks both English and Urdu.',
              flag: '🇦🇪',
              color: 'emerald',
            },
          ].map((card, i) => {
            const glowColorMap: Record<string, string> = {
              blue: 'rgba(96,165,250,0.08)',
              amber: 'rgba(251,191,36,0.06)',
              emerald: 'rgba(16,185,129,0.06)',
            }
            return (
              <GlowCard key={i} delay={i * 0.08} glowColor={glowColorMap[card.color]}
                className="bg-[#0F1114] border border-white/[0.06] p-7 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-5">
                    <span className="text-2xl select-none">{card.flag}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{card.industry}</h4>
                      <p className="text-[10px] text-gray-500 font-semibold">{card.location}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 italic leading-relaxed mb-4">
                    "{card.problem}"
                  </p>
                </div>
                <p className="text-xs text-emerald-400 font-bold leading-relaxed pt-2 border-t border-white/[0.04]">
                  {card.solution}
                </p>
              </GlowCard>
            )
          })}
        </div>

        {/* Honest disclaimer */}
        <p className="text-center text-[10px] text-gray-600 font-semibold mt-10 max-w-md mx-auto leading-relaxed">
          These scenarios represent common problems in South Asian manufacturing.
          Noxis is currently in beta — be among the first factories to run on it.
        </p>
      </section>

      {/* ── REAL TESTIMONIALS ───────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="py-24 px-6 max-w-6xl mx-auto border-t border-white/[0.06]">
          <SectionReveal className="text-center mb-16 space-y-4">
            <p className="text-xs font-bold text-[#60A5FA] uppercase tracking-widest">User Reviews</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
              Hear from our community
            </h2>
            <p className="text-gray-400 text-xs max-w-sm mx-auto">
              Verified feedback from factory owners who use Noxis Hub.
            </p>
          </SectionReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <GlowCard key={t.id} delay={i * 0.08} glowColor="rgba(96,165,250,0.08)"
                className="bg-[#0F1114] border border-white/[0.06] p-7 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.display_name}</h4>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase">
                        {t.business_type || 'Factory Owner'} {t.city ? `· ${t.city}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-0.5 rounded font-mono uppercase">
                      {t.tier || 'Starter'}
                    </span>
                  </div>
                  
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4 text-xs text-[#C5A059]">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={idx}>{idx < t.rating ? '★' : '☆'}</span>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 italic leading-relaxed">
                    "{t.feedback_text}"
                  </p>
                </div>
                
                <p className="text-[9px] text-gray-600 font-semibold mt-6 pt-2 border-t border-white/[0.04]">
                  Verified user · {t.country_code || 'PK'}
                </p>
              </GlowCard>
            ))}
          </div>
        </section>
      )}

      {/* ── BETA EARLY ACCESS ────────────────────────────────────────── */}
      <section className="py-16 px-6 max-w-xl mx-auto text-center border-t border-white/[0.06]">
        <SectionReveal>
          <div className="bg-[#0F1114] border border-[#C5A059]/25 rounded-xl p-8 relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute -inset-10 bg-[#C5A059]/5 blur-3xl pointer-events-none rounded-full" />
            
            <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest mb-3">
              Currently in beta
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-3">
              Be a founding user
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-6 max-w-sm mx-auto">
              Noxis is actively being tested by factories in Pakistan and UAE.
              Early users get direct access to the development team and influence what gets built next.
            </p>
            
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }} 
              whileTap={{ y: 1, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="inline-block"
            >
              <a
                href="https://wa.me/923334355475?text=Hi,%20I%20want%20to%20be%20a%20founding%20user%20of%20Noxis%20ERP"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shine inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-black font-extrabold text-xs uppercase tracking-wider py-3.5 px-7 rounded-lg transition-all shadow-[0_0_20px_rgba(37,211,102,0.15)]"
              >
                Apply for Early Access
              </a>
            </motion.div>
          </div>
        </SectionReveal>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 text-center max-w-4xl mx-auto relative z-10">
        <div className="absolute inset-0 bg-blue-500/5 blur-[100px] pointer-events-none rounded-full" />

        <SectionReveal>
          <motion.div
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-10"
            animate={{ boxShadow: ['0 0 0px rgba(96,165,250,0)', '0 0 20px rgba(96,165,250,0.2)', '0 0 0px rgba(96,165,250,0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles size={12} className="text-blue-400" />
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">3-Day Free Trial — No Credit Card</span>
          </motion.div>
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-white mb-6 leading-none">
            Take absolute control<br className="hidden sm:inline" />
            of your workshop floor.
          </h2>
        </SectionReveal>

        <SectionReveal delay={0.18}>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Setup takes under ten minutes. No dedicated hardware or internet dependencies. Start preventing material leaks and generating automated payslips today.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.24}>
          <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4 max-w-md mx-auto">
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }} 
              whileTap={{ y: 1, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="flex-1"
            >
              <Link href="/download"
                className="btn-shine flex items-center justify-center gap-2 bg-[#60A5FA] hover:bg-blue-400 text-black font-extrabold text-sm tracking-wider py-4 rounded-lg transition-all shadow-[0_0_40px_rgba(96,165,250,0.25)] w-full"
              >
                <Download size={16} />
                Download Free Trial
              </Link>
            </motion.div>
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }} 
              whileTap={{ y: 1, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="flex-1"
            >
              <a
                href="https://wa.me/923334355475?text=Hi,%20I%20want%20to%20schedule%20a%20demo%20for%20Noxis%20ERP"
                target="_blank" rel="noopener noreferrer"
                className="btn-shine flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-black font-extrabold text-sm tracking-wider py-4 rounded-lg transition-all shadow-[0_0_30px_rgba(37,211,102,0.2)] w-full"
              >
                WhatsApp Demo
              </a>
            </motion.div>
          </div>
        </SectionReveal>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#050607] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3">
            <img src="/logos/noxis.png" alt="Noxis" className="w-5 h-5 object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="font-extrabold text-sm tracking-wider">NOXIS</span>
            <span className="text-xs text-gray-600">by Omnora Labs</span>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-8 text-xs font-semibold uppercase tracking-widest text-gray-500">
            {[{ label: 'Download', href: '/download' }, { label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }, { label: 'Privacy', href: '/privacy' }].map(l => (
              <motion.div key={l.href} whileHover={{ y: -2, color: '#fff' }}>
                <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-gray-600 text-center md:text-right">
            © 2026 Omnora Labs · Engineered for Manufacturing 🇵🇰
          </p>
        </div>
      </footer>
    </div>
  )
}
