'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence, useMotionValue } from 'framer-motion'
import { 
  Menu, X, ChevronRight, Sparkles, Layers, Smartphone, ShieldCheck,
  BarChart4, Download, ArrowRight, Database, Globe2, Zap
} from 'lucide-react'
import {
  FloatingOrb, GlowCard, TypedText,
  ScrollReveal3D, StretchingGridCanvas,
  MarqueeTicker
} from '@/components/ui/AnimatedComponents'

/* ─── shared easing ─── */
const ease = [0.16, 1, 0.3, 1] as const

/* ─── particle canvas component ─── */
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
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-50" />
}

/* ─── decrypting ticker text component ─── */
function DecryptingTicker({ text, active }: { text: string; active: boolean }) {
  const [displayedText, setDisplayedText] = useState("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (!active) {
      setDisplayedText("")
      return
    }

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()₨"
    let iterations = 0
    const target = text

    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      setDisplayedText(
        target
          .split("")
          .map((char, index) => {
            if (char === " ") return " "
            if (index < iterations) return target[index]
            return chars[Math.floor(Math.random() * chars.length)]
          })
          .join("")
      )

      if (iterations >= target.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
      iterations += 1.5
    }, 35)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [text, active])

  return <span className="font-mono">{displayedText || text}</span>
}

/* ─── enhanced scroll morph section component ─── */
function ScrollMorphSection({ isMobile }: { isMobile: boolean }) {
  const cards = [
    { id: 1, title: "Industry Intelligence Engine", subtitle: "REAL-TIME REGIONAL INDEXES", icon: <Sparkles className="text-[#00E5FF] w-6 h-6" />, desc: "Calculates average piece-rates and commodity price benchmarks dynamically across major global hubs — Pakistan, UAE, Turkey, Bangladesh. Keeps workshop operations aligned with real-time regional trends.", accent: "#00E5FF", stat: "₨ Piece Rate benchmark: +12% this month", metric: "Active in 10 Global Regions" },
    { id: 2, title: "Active Predictions Model", subtitle: "ON-DEVICE MACHINE LEARNING", icon: <Zap className="text-[#A3E635] w-6 h-6" />, desc: "Autonomously forecasts raw material stock-outs, identifies customer churn risks, and flags profit margin drops using localized on-device metrics. No server latencies or cloud subscription costs.", accent: "#A3E635", stat: "Inventory Alert: Bales stock-out risk in 4 days", metric: "94% Forecasting Precision" },
    { id: 3, title: "Working Capital Portal", subtitle: "EMBEDDED FACTORY FINTECH", icon: <Layers className="text-[#00E5FF] w-6 h-6" />, desc: "Evaluates credit scoring grades A–D directly from ledger accounts and work logs. Connects eligible factories to financial institutions for frictionless working capital flow.", accent: "#00E5FF", stat: "Liquidity rating: Grade A — Highly Eligible", metric: "₨ 50L Max Credit Limit" },
    { id: 4, title: "Open Developer APIs", subtitle: "ELITE B2B INTEGRATIONS", icon: <Database className="text-[#7C3AED] w-6 h-6" />, desc: "Provides secure cryptographically signed API keys and real-time webhook subscriptions for multi-branch ledger sync, inventory tracking, and custom third-party integrations.", accent: "#7C3AED", stat: "Webhook Dispatch: 0.04ms average response", metric: "HMAC-SHA256 Signed Feeds" },
    { id: 5, title: "Verified Worker Identities", subtitle: "DIGITAL TALENT LEDGER", icon: <ShieldCheck className="text-[#A3E635] w-6 h-6" />, desc: "Empowers karigars with QR-verifiable digital profiles containing verified attendance metrics, skill classifications, and peshgi advance logs — portable across factories.", accent: "#A3E635", stat: "Verified: Hamid · Senior Weaver · 98% attendance", metric: "Zero-Trust Verified Cards" },
  ]

  // CRITICAL FIXED NODE: Explicit isolated track for sticky slider viewport bounds
  const sliderSectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sliderSectionRef, { amount: 0.15 })

  // 100% Fixed parameters for precise scroll tracking map
  const { scrollYProgress: sliderProgress } = useScroll({
    target: sliderSectionRef,
    offset: ["start start", "end end"], // Animation fires right when heading leaves viewport bounds
  })

  const targetVal = useMotionValue(0)
  const displayProgress = useSpring(targetVal, { stiffness: 90, damping: 28, restDelta: 0.001 })

  const [activeIndex, setActiveIndex] = useState(0)
  const [progressVal, setProgressVal] = useState(0)
  const lastScrollTime = useRef(Date.now())

  useEffect(() => {
    return sliderProgress.on("change", (v) => {
      lastScrollTime.current = Date.now()
      targetVal.set(v)
    })
  }, [sliderProgress, targetVal])

  useEffect(() => {
    return displayProgress.on("change", (v) => {
      setProgressVal(v)
      // Linear distributed mapping structure for 5 active framework items
      const calculatedIndex = Math.min(cards.length - 1, Math.floor(v * cards.length))
      setActiveIndex(Math.max(0, calculatedIndex))
    })
  }, [displayProgress, cards.length])

  // Autoplay ping-pong carousel sequence
  const autoplayDirection = useRef(1)
  useEffect(() => {
    let timer: NodeJS.Timeout
    let autoplayInterval: NodeJS.Timeout

    const startAutoplay = () => {
      autoplayInterval = setInterval(() => {
        const currentProgress = sliderProgress.get()
        if (Date.now() - lastScrollTime.current < 2000 || !isInView || currentProgress < 0.05 || currentProgress > 0.95) return

        let nextIdx = activeIndex + autoplayDirection.current
        if (nextIdx >= cards.length) {
          autoplayDirection.current = -1
          nextIdx = cards.length - 2
        } else if (nextIdx < 0) {
          autoplayDirection.current = 1
          nextIdx = 1
        }

        const targetProgress = nextIdx / (cards.length - 1)
        targetVal.set(targetProgress)
      }, 3500)
    }

    const checkAutoplayState = () => {
      clearInterval(autoplayInterval)
      if (Date.now() - lastScrollTime.current >= 2000 && isInView) {
        const currentProgress = sliderProgress.get()
        if (currentProgress >= 0.05 && currentProgress <= 0.95) startAutoplay()
      }
      timer = setTimeout(checkAutoplayState, 1000)
    }

    checkAutoplayState()
    return () => { clearTimeout(timer); clearInterval(autoplayInterval) }
  }, [activeIndex, isInView, targetVal, sliderProgress, cards.length])

  const activeColor = cards[activeIndex]?.accent ?? "#7C3AED"

  const bgScale = useTransform(displayProgress, [0, 0.1, 0.9, 1], [0.96, 1, 1, 0.96])
  const bgOpacity = useTransform(displayProgress, [0, 0.05, 0.95, 1], [0.7, 1, 1, 0.7])

  // Precise tracking dimensions layout architecture
  const CARD_W = isMobile ? 310 : 540
  const GAP    = isMobile ? 20  : 40
  const VW     = isMobile ? 375 : 1200

  const totalW = cards.length * CARD_W + (cards.length - 1) * GAP
  const startX = (VW - CARD_W) / 2
  const endX   = startX - (totalW - VW)

  const x = useTransform(displayProgress, [0, 1], [`${startX}px`, `${endX}px`])

  return (
    <div className="relative bg-[#0B0B0C]">
      {/* ── HEADING ── */}
      <div className="relative bg-[#0B0B0C] border-t border-[#4C1D95]/15 w-full py-24 px-4 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-[#4C1D95]/10 to-transparent pointer-events-none" />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-[10px] md:text-xs font-bold text-[#7C3AED] tracking-widest uppercase mb-6"
        >
          ENGINEERED FOR MODERN WORKSHOPS
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase leading-none text-center"
        >
          SIMPLE
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scaleX: 0.6 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="h-14 md:h-20 w-[80%] max-w-[480px] mt-3 mb-3 bg-gradient-to-r from-[#4C1D95] via-[#7C3AED] to-[#4C1D95] flex items-center justify-center rounded-full shadow-[0_0_60px_rgba(124,58,237,0.5)] border border-[#7C3AED]/30"
        >
          <span className="text-base md:text-2xl font-black uppercase text-white tracking-widest">
            BY DESIGN
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: -24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase leading-none text-center"
        >
          POWERFUL
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="text-sm md:text-base font-bold text-[#94A3B8] tracking-[0.25em] uppercase mt-4"
        >
          BY IMPACT
        </motion.p>
      </div>

      {/* ── FIXED TRACK BOX: Shortened to 280vh to remove dead blank spacing ── */}
      <section ref={sliderSectionRef} className="relative bg-[#0B0B0C]">
        <div className="relative h-[280vh] w-full">
          {/* Sticky viewport frame */}
          <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
            
            {/* Background Shutter */}
            <motion.div
              style={{ scale: bgScale, opacity: bgOpacity }}
              className="absolute inset-x-4 md:inset-x-8 inset-y-6 rounded-[32px] border border-white/[0.07] bg-[#08090B]/95 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.95)] overflow-hidden"
            >
              {!isMobile && (
                <StretchingGridCanvas
                  progress={progressVal}
                  activeIndex={activeIndex}
                  activeColor={activeColor}
                />
              )}
              {isMobile && <div className="absolute inset-0 bg-gradient-to-br from-[#0C0D10] to-[#0A0B0E]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/70 pointer-events-none" />

              {/* Live Telemetry HUD Console (Desktop Only) */}
              {!isMobile && (
                <div className="absolute bottom-12 inset-x-12 h-20 border-t border-white/[0.05] bg-black/40 backdrop-blur-md rounded-xl p-3 flex flex-row items-center justify-between gap-6 z-20">
                  <div className="flex-1 min-w-0 font-mono text-[9px] text-gray-500 space-y-1">
                    <span className="text-[8px] font-bold text-gray-600 tracking-wider uppercase block mb-0.5">Active Node Telemetry Logs</span>
                    {activeIndex === 0 && (
                      <>
                        <p className="text-cyan-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" /> [SYS-INTEL] Mandis scanned: PK-FSD, UAE-DXB, TR-IST.</p>
                        <p className="truncate text-gray-400">[SYS-INTEL] Reconciled average pieces rate: +12% this month.</p>
                      </>
                    )}
                    {activeIndex === 1 && (
                      <>
                        <p className="text-lime-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse inline-block" /> [SYS-MODEL] Local LSTM stock-out prediction running.</p>
                        <p className="truncate text-gray-400">[SYS-MODEL] Alert: Stock-out hazard detected for Bales inventory.</p>
                      </>
                    )}
                    {activeIndex === 2 && (
                      <>
                        <p className="text-cyan-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" /> [SYS-FINTECH] Ledger balances audited. Grading active.</p>
                        <p className="truncate text-gray-400">[SYS-FINTECH] Result compiled: GRADE A - Highly Eligible. Limit set: PKR 50L.</p>
                      </>
                    )}
                    {activeIndex === 3 && (
                      <>
                        <p className="text-purple-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" /> [SYS-DEV] HMAC-SHA256 cryptographically signed webhook dispatched.</p>
                        <p className="truncate text-gray-400">[SYS-DEV] Response latency: 0.04ms · API response status: 200 OK.</p>
                      </>
                    )}
                    {activeIndex === 4 && (
                      <>
                        <p className="text-lime-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse inline-block" /> [SYS-IDENTITY] Karigar check: Hamid · Weaver · QR valid.</p>
                        <p className="truncate text-gray-400">[SYS-IDENTITY] Zero-Trust portable workforce history synced successfully.</p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4 border-l border-white/[0.05] pl-6 pr-6 h-full flex-none">
                    <div className="flex items-end gap-1 h-8">
                      {Array.from({ length: 8 }).map((_, i) => {
                        const randomHeight1 = [8, 20, 12, 28, 8][i % 5]
                        const randomHeight2 = [24, 10, 32, 14, 18][i % 5]
                        return (
                          <motion.div
                            key={i}
                            animate={{ height: [8, randomHeight1, randomHeight2, 8] }}
                            transition={{ duration: 1.0 + i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                            className="w-1.5 rounded-t-sm"
                            style={{ backgroundColor: activeColor }}
                          />
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center text-right border-l border-white/[0.05] pl-6 h-full font-mono text-[9px] text-gray-500">
                    <span className="font-bold text-white uppercase tracking-wider">Node Terminal #{activeIndex + 1}</span>
                    <span className="text-[8px] text-gray-600 mt-0.5">SPEED: 100% OFFLINE</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Cards viewport horizontal strip wrapper */}
            <motion.div
              style={{ scale: bgScale, opacity: bgOpacity }}
              className="absolute inset-x-4 md:inset-x-8 inset-y-6 rounded-[32px] overflow-hidden flex items-center"
            >
              <motion.div className="flex flex-row items-stretch" style={{ gap: `${GAP}px`, x }}>
                {cards.map((card, idx) => {
                  const isActive = activeIndex === idx
                  return (
                    <div
                      key={card.id}
                      className="flex-none flex flex-col justify-between p-6 md:p-8 rounded-[24px] border bg-[#0F1114]/90 backdrop-blur-xl relative overflow-hidden cursor-default"
                      style={{
                        width: `${CARD_W}px`,
                        borderColor: isActive ? `${card.accent}50` : "rgba(255,255,255,0.05)",
                        boxShadow: isActive ? `0 0 0 1px ${card.accent}30, 0 24px 64px ${card.accent}18` : "0 8px 32px rgba(0,0,0,0.5)",
                        transform: isActive ? "scale(1.015) translateY(-4px)" : "scale(1) translateY(0px)",
                        transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.35s ease",
                      }}
                    >
                      {isActive && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                          <div
                            className="laser-scanner-sweep"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${card.accent}99, transparent)`,
                              boxShadow: `0 0 12px ${card.accent}`,
                            }}
                          />
                        </div>
                      )}

                      <div className="absolute inset-0 holographic-grid opacity-30 pointer-events-none" />

                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                            {card.icon}
                          </div>
                          <span className="text-[9px] md:text-[10px] font-black tracking-widest uppercase font-mono" style={{ color: card.accent }}>
                            {card.subtitle}
                          </span>
                        </div>

                        <h3 className="text-xl md:text-3xl font-bold text-white tracking-tight leading-none uppercase">
                          {card.title}
                        </h3>
                        <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed">
                          {card.desc}
                        </p>
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: `${card.accent}80` }}>
                          {card.metric}
                        </p>
                      </div>

                      <div className="relative z-10 mt-6 p-4 bg-black/60 border border-white/[0.06] rounded-2xl">
                        <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-2 font-mono">
                          Live Floor Benchmarking
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-mono font-bold flex items-center gap-1.5 flex-1 min-w-0" style={{ color: card.accent }}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: card.accent }} />
                            <span className="truncate">
                              <DecryptingTicker text={card.stat} active={isActive} />
                            </span>
                          </p>
                          <span className="text-[8px] text-gray-600 font-mono flex-shrink-0">ACTIVE</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            </motion.div>

            {/* Pagination dots indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {cards.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: activeIndex === i ? 24 : 6,
                    opacity: activeIndex === i ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-1.5 rounded-full"
                  style={{ backgroundColor: activeIndex === i ? cards[i].accent : "rgba(255,255,255,0.3)" }}
                />
              ))}
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}

/* ─── MAIN LANDING CLIENT EXPORT NODE ─── */
export default function LandingClient() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(() =>
    typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron')
  )
  const [isMobile, setIsMobile] = useState(false)
  const [heroRotateX, setHeroRotateX] = useState(12)
  const [heroRotateY, setHeroRotateY] = useState(-18)
  const [heroIsHovered, setHeroIsHovered] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  
  const [testimonials, setTestimonials] = useState<any[]>([])

  useEffect(() => {
    async function fetchTestimonials() {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
      if (!error && data) setTestimonials(data)
    }
    fetchTestimonials()
  }, [supabase])

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

  const handleHeroMouseEnter = () => { if (!isMobile) setHeroIsHovered(true) }
  const handleHeroMouseLeave = () => {
    setHeroIsHovered(false)
    setHeroRotateX(12)
    setHeroRotateY(-18)
  }

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
    { icon: <Database size={22} className="text-blue-400" />, title: 'Offline-First SQLite', desc: 'Double-ciphered local database that reconciles with cloud on reconnect. Zero reliance on continuous internet.', color: 'blue', href: '/docs#sqlite' },
    { icon: <Layers size={22} className="text-amber-400" />, title: 'Barcode & SKU Engine', desc: 'Scan, store, and manage raw bales, fabric yards, chemical batches. Auto-triggers reorder level alerts.', color: 'amber', href: '/docs#inventory' },
    { icon: <Smartphone size={22} className="text-emerald-400" />, title: 'Mobile Floor Handhelds', desc: 'Workers log piece-rate counts and attendance from Android terminals paired via local WiFi instantly.', color: 'emerald', href: '/docs#mobile' },
    { icon: <ShieldCheck size={22} className="text-red-400" />, title: 'AI Sentinel CCTV', desc: 'Draw virtual zone boundaries. Triggers instant local alerts for unauthorized entries — no cloud storage fees.', color: 'red', href: '/docs#data-safety' },
    { icon: <BarChart4 size={22} className="text-indigo-400" />, title: 'Double-Entry Accounting', desc: 'Log receipts, bank entries, and ledger credits. Generate P&L and aging accounts with one click.', color: 'indigo', href: '/docs#invoices' },
    { icon: <Globe2 size={22} className="text-teal-400" />, title: 'Multilingual Scripts', desc: 'Switch Urdu Nastaliq and English instantly to accommodate local workers and international administrators.', color: 'teal', href: '/docs#troubleshoot' },
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
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <ParticleCanvas />
        <FloatingOrb color="rgba(96,165,250,0.08)" size={700} x="20%" y="10%" delay={0} blur={130} />
        <FloatingOrb color="rgba(197,160,89,0.06)" size={600} x="80%" y="30%" delay={2} blur={140} />
        <FloatingOrb color="rgba(99,102,241,0.07)" size={500} x="50%" y="70%" delay={4} blur={120} />
      </div>

      {/* Nav Section */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 border-b transition-all border-white/[0.02] bg-[#070809]/50 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease }}>
            <Link href="/" className="flex items-center gap-3 cursor-pointer group">
              <span className="font-extrabold text-lg tracking-wider text-white group-hover:text-blue-400 transition-colors">NOXIS</span>
            </Link>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            {[{ label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }].map((link) => (
              <motion.div key={link.href} whileHover={{ y: -1 }}>
                <Link href={link.href} className="inline-block text-sm text-gray-400 hover:text-white font-medium transition-colors relative group py-1.5 px-0.5">
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                </Link>
              </motion.div>
            ))}
            <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ y: 1, scale: 0.98 }} className="flex items-center">
              <Link href="/download" className="btn-shine inline-flex items-center justify-center text-xs font-bold tracking-widest uppercase text-black bg-[#60A5FA] hover:bg-blue-400 px-6 py-2.5 rounded-sm transition-all shadow-[0_0_20px_rgba(96,165,250,0.2)]">
                Download
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-24 md:pt-48 md:pb-36 px-6 max-w-7xl mx-auto min-h-screen flex items-center">
        <motion.div style={isMobile ? undefined : { y: heroY, opacity: heroOpacity }} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }} className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1.5">
                <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">Industrial ERP · v13.1 Premium</span>
              </div>
              <div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.05] text-white">
                  Factory software<br />that runs <span className="animate-gradient-text">offline.</span>
                </h1>
                <div className="mt-4 text-2xl sm:text-3xl font-bold text-gray-500 h-10">
                  <TypedText phrases={['Karigar Payroll.', 'CCTV Sentinel.', 'Khata Ledger.', 'Offline Inventory.', 'Peshgi Tracking.']} className="text-blue-400/80" />
                </div>
              </div>
              <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl">
                Manage floor inventory, piece-rate karigar payroll, double-entry financial accounts, and smart AI CCTV monitoring. Works reliably without internet or cloud fees.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link href="/download" className="btn-shine flex items-center justify-center gap-2 bg-[#60A5FA] hover:bg-blue-400 text-black font-extrabold text-sm tracking-wider px-8 py-4 rounded-sm transition-all shadow-[0_0_30px_rgba(96,165,250,0.25)]">
                  <Download size={16} /> Download Free Trial
                </Link>
              </div>
            </motion.div>

            {/* Mockup Display */}
            <div className="lg:col-span-5 relative" onMouseMove={handleHeroMouseMove} onMouseEnter={handleHeroMouseEnter} onMouseLeave={handleHeroMouseLeave}>
              <div
                className="relative bg-[#0F1114] border border-white/10 rounded-xl overflow-hidden transition-all duration-700 ease-out"
                style={{
                  transform: isMobile ? 'none' : `perspective(1200px) rotateX(${heroRotateX}deg) rotateY(${heroRotateY}deg) rotateZ(1deg)`,
                  boxShadow: '0 40px 100px rgba(0,0,0,0.95)',
                }}
              >
                <div className="bg-[#0A0C0F] border-b border-white/5 px-4 py-3 flex items-center justify-between">
                  <span className="text-[10px] text-gray-600 font-mono tracking-widest uppercase">Noxis Node Terminal</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold">LOCAL ACTIVE</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: 'Mandi Output', value: '45,820 kg', color: 'text-amber-400' }, { label: 'Active Karigars', value: '142 Live', color: 'text-blue-400' }].map((s) => (
                      <div key={s.label} className="bg-[#161A1F] border border-white/5 p-3.5 rounded-lg">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">{s.label}</p>
                        <p className={`font-mono text-sm font-black ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Marquee Ticker */}
      <div className="py-5 border-y border-white/5 bg-white/[0.01] overflow-hidden">
        <MarqueeTicker items={marqueeItems} className="text-[11px] font-bold uppercase tracking-widest text-gray-600" speed={30} />
      </div>

      {/* Scroll Features Section */}
      <ScrollMorphSection isMobile={isMobile} />

      {/* Features Grid */}
      <section className="py-28 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <GlowCard key={f.title} delay={i * 0.09} glowColor={glowColors[f.color]} className="bg-[#0F1114] border border-white/5 p-8 rounded-xl">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">{f.icon}</div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 px-6 bg-[#0A0C0F]/40 border-y border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="overflow-x-auto border border-white/5 rounded-xl bg-[#0F1114]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#0A0C0F]">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Operational Needs</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-blue-400 text-center">Noxis ERP</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-4 text-xs font-bold text-gray-300">{row[0]}</td>
                    <td className="p-4 text-xs font-bold text-blue-400 text-center">{row[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Beta Early Access */}
      <section className="py-16 px-6 max-w-xl mx-auto text-center">
        <div className="bg-[#0F1114] border border-[#C5A059]/25 rounded-xl p-8">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-3">Be a founding user</h3>
          <a href="https://wa.me/923334355475" className="btn-shine inline-flex items-center bg-[#25D366] text-black font-extrabold text-xs uppercase tracking-wider py-3.5 px-7 rounded-lg">
            Apply for Early Access
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#050607] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-xs text-gray-600">© 2026 Omnora Labs · Engineered for Manufacturing 🇵🇰</p>
        </div>
      </footer>
    </div>
  )
}
