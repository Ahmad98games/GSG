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
  SectionReveal, MarqueeTicker, GlowCard, TypedText,
  ScrollReveal3D, MorphingCanvas, StretchingGridCanvas
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
    }, 40)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [text, active])

  return <span className="font-mono">{displayedText || text}</span>
}

// ═══ CINEMATIC ENTRANCE-ONLY 3D SCROLL CARD ═══
function ScrollCard3D({ card, index, isMobile, innerRef, isActive }: { card: any; index: number; isMobile: boolean; innerRef: any; isActive: boolean }) {
  return (
    <div ref={innerRef} className="w-full relative z-10">
      <ScrollReveal3D
        intensity={14}
        className={`relative w-full max-w-4xl p-6 md:p-8 rounded-3xl border bg-gradient-to-br ${card.color} bg-[#121417] backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start gap-6 md:gap-10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.65)] transition-[border-color,box-shadow] duration-700 ${
          isActive ? "border-[#7C3AED]/45 shadow-[0_30px_70px_rgba(124,58,237,0.22)]" : "border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
        }`}
      >
        {/* Dual-Axis Holographic Intersecting Scanlines Sweep */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            <div className="laser-scanner-sweep" />
            <div className="laser-scanner-sweep-x" />
          </div>
        )}

        {/* Satisfying Vector Coordinate Blueprint Grid backdrop */}
        <div className="absolute inset-0 holographic-grid pointer-events-none z-0 opacity-40" />

        <div className="space-y-4 max-w-xl relative z-10 preserve-3d">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              {card.icon}
            </div>
            <span className="text-[9px] md:text-[10px] font-black tracking-widest text-[#00E5FF] uppercase font-mono">
              {card.subtitle}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none">
            {card.title}
          </h3>
          <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed font-medium">
            {card.desc}
          </p>
          <div className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            {card.metric}
          </div>
        </div>
        
        <div className="p-4 bg-black/60 border border-[#4C1D95]/25 rounded-xl flex-none w-full sm:w-auto sm:flex-1 sm:max-w-[280px] relative z-10 preserve-3d">
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Live Floor Benchmarking</span>
          <p className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <DecryptingTicker text={card.stat} active={isActive} />
          </p>
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[9px] text-gray-500 font-mono">
            <span>STATUS ACTIVE</span>
            <span className="text-white">ON-DEMAND TELEMETRY</span>
          </div>
        </div>
      </ScrollReveal3D>
    </div>
  )
}

// Cinematic 3D Consecutive Scroll Showcase (Vertical Shutter Background & Horizontal Cards)
function ScrollMorphSection({ isMobile }: { isMobile: boolean }) {
  const cards = [
    {
      id: 1,
      title: "Industry Intelligence Engine",
      subtitle: "REAL-TIME REGIONAL INDEXES",
      icon: <Sparkles className="text-[#00E5FF] w-6 h-6" />,
      desc: "Calculates average pieces-rates and commodity price benchmarks dynamically across major global hubs (Pakistan, UAE, Turkey, Bangladesh). Keeps workshop operations aligned with real-time regional trends.",
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
      accent: "#A3E635",
      stat: "Verified: Hamid (Senior Weaver, 98% attendance)",
      metric: "Zero-Trust Verified Cards"
    }
  ]

  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  })

  // Rule of Hooks compliant: call unconditionally, select path using variable.
  const springProgress = useSpring(scrollYProgress, {
    stiffness: 75,
    damping: 26,
    restDelta: 0.001
  })

  const smoothProgress = isMobile ? scrollYProgress : springProgress

  const [progressVal, setProgressVal] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    return smoothProgress.on("change", (latest) => {
      setProgressVal(latest)
      
      // Map scroll range [0.15, 0.90] to cards [0, 4]
      const START = 0.15
      const END = 0.90
      const RANGE = END - START
      
      if (latest <= START) {
        setActiveIndex(0)
      } else if (latest >= END) {
        setActiveIndex(4)
      } else {
        const normalized = (latest - START) / RANGE
        const idx = Math.min(4, Math.floor(normalized * 5))
        setActiveIndex(idx)
      }
    })
  }, [smoothProgress])

  const activeColor = cards[activeIndex]?.accent || "#7C3AED"

  // Background vertical shutter / curtain stretch animation (Shutter opens from top and bottom)
  const bgScaleY = useTransform(smoothProgress, [0, 0.15, 0.90, 0.98], [0, 1, 1, 0])
  const bgOpacity = useTransform(smoothProgress, [0, 0.08, 0.92, 0.98], [0, 1, 1, 0])

  // Horizontal translate X slides the cards across the screen using precise x range calculations
  const CARD_W_DESKTOP = 560
  const CARD_W_MOBILE = 328
  const GAP = 48
  const CARDS = 5

  const getXRange = (mobile: boolean) => {
    const cardW = mobile ? CARD_W_MOBILE : CARD_W_DESKTOP
    const vw = mobile ? 400 : 1200
    const totalW = CARDS * cardW + (CARDS - 1) * GAP
    const startX = (vw - cardW) / 2
    const endX = startX - (totalW - vw)
    return [`${startX}px`, `${endX}px`]
  }

  const x = useTransform(
    smoothProgress,
    [0.15, 0.90],
    getXRange(isMobile)
  )

  return (
    <section ref={sectionRef} className="relative bg-[#0B0B0C] border-y border-[#4C1D95]/15 overflow-visible">
      
      {/* Headline Header (Scrolls naturally) */}
      <div className="w-full py-20 px-4 md:px-6 flex flex-col items-center justify-center relative z-10 bg-gradient-to-b from-transparent to-[#070809]">
        <span className="text-[10px] md:text-xs font-bold text-[#7C3AED] tracking-widest uppercase mb-3 md:mb-5">ENGINEERED FOR MODERN WORKSHOPS</span>
        <h2 className="text-4xl md:text-7xl font-black tracking-tightest text-white uppercase leading-none font-sans">
          SIMPLE
        </h2>
        <div className="h-12 md:h-16 w-[85%] md:w-[70%] max-w-[500px] bg-gradient-to-r from-[#4C1D95] via-[#7C3AED] to-[#4C1D95] my-2 md:my-3 flex items-center justify-center rounded-full shadow-[0_0_40px_rgba(124,58,237,0.6)] border border-[#7C3AED]/35 z-10">
          <span className="text-sm md:text-xl font-black uppercase text-white tracking-widest leading-none font-sans">
            BY DESIGN
          </span>
        </div>
        <h2 className="text-4xl md:text-7xl font-black tracking-tightest text-white uppercase leading-none font-sans mt-1 md:mt-2">
          POWERFUL
        </h2>
        <div className="text-[10px] md:text-sm font-bold text-[#94A3B8] tracking-[0.2em] uppercase mt-2 md:mt-4">
          BY IMPACT
        </div>
      </div>

      {/* Scroll track (exactly 500vh) */}
      <div className="relative w-full h-[500vh]">
        
        {/* Sticky viewport frame (exactly 100vh) */}
        <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden z-20">
          
          {/* Vertical Shutter Background: Opens/Stretches from top and bottom */}
          <motion.div
            style={{
              scaleY: bgScaleY,
              opacity: bgOpacity,
              transformOrigin: "center center",
            }}
            className="absolute inset-x-0 mx-auto w-[94%] max-w-7xl h-[80vh] border border-white/[0.08] bg-[#090A0C]/90 backdrop-blur-2xl rounded-[36px] shadow-[0_30px_80px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden"
          >
            {/* StretchingGridCanvas inside background scales/morphs with scroll - Disabled on mobile */}
            {isMobile ? (
              <div className="absolute inset-0 bg-gradient-to-br from-[#090A0C] to-[#0D0F14]" />
            ) : (
              <StretchingGridCanvas progress={progressVal} activeIndex={activeIndex} activeColor={activeColor} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 pointer-events-none" />
          </motion.div>

          {/* Foreground Horizontal Cards layer: Slides from right to left */}
          <div className="relative w-full z-10 py-6">
            <motion.div
              style={{ x }}
              className="flex flex-row items-center gap-8 md:gap-12 px-12 md:px-24"
            >
              {cards.map((card, idx) => {
                const isVisible = Math.abs(activeIndex - idx) <= 1
                return (
                  <div
                    key={card.id}
                    className="w-[82vw] sm:w-[480px] md:w-[560px] flex-none p-6 md:p-8 rounded-[28px] border bg-[#111317]/88 backdrop-blur-2xl flex flex-col justify-between overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.65)] relative group cursor-default"
                    style={{
                      borderColor: activeIndex === idx ? `${card.accent}45` : "rgba(255,255,255,0.04)",
                      boxShadow: activeIndex === idx ? `0 25px 60px ${card.accent}15` : "0 10px 30px rgba(0,0,0,0.45)",
                      transform: activeIndex === idx ? "scale(1.02) translateY(-4px)" : "scale(1) translateY(0px)",
                      transition: "border-color 0.5s ease, box-shadow 0.5s ease, transform 0.4s ease",
                    }}
                  >
                    {/* Holographic scanner laser scan sweep */}
                    {activeIndex === idx && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                        <div className="laser-scanner-sweep" />
                        <div className="laser-scanner-sweep-x" />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white">
                          {card.icon}
                        </div>
                        <span className="text-[9px] md:text-[10px] font-black tracking-widest uppercase font-mono" style={{ color: card.accent }}>
                          {card.subtitle}
                        </span>
                      </div>
                      <h3 className="text-xl md:text-3xl font-bold text-white tracking-tight leading-none uppercase">
                        {card.title}
                      </h3>
                      <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed font-medium">
                        {card.desc}
                      </p>
                      <div className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">
                        {card.metric}
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-black/60 border border-white/5 rounded-2xl w-full">
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-1 font-mono">Live Floor Benchmarking</span>
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: card.accent }}>
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: card.accent }} />
                          <DecryptingTicker text={card.stat} active={isVisible && activeIndex === idx} />
                        </p>
                        <span className="text-[8px] text-gray-500 font-mono">STATUS ACTIVE</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </div>

        </div>

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
              <motion.div key={link.href} whileHover={{ y: -1 }} className="flex items-center">
                <Link href={link.href} className="inline-block text-sm text-gray-400 hover:text-white font-medium transition-colors relative group py-1.5 px-0.5">
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                </Link>
              </motion.div>
            ))}
            <motion.div 
              whileHover={{ y: -3, scale: 1.02 }} 
              whileTap={{ y: 1, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="flex items-center"
            >
              <Link
                href="/download"
                className="btn-shine inline-flex items-center justify-center text-xs font-bold tracking-widest uppercase text-black bg-[#60A5FA] hover:bg-blue-400 px-6 py-2.5 rounded-sm transition-all shadow-[0_0_20px_rgba(96,165,250,0.2)]"
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
                <Link href={f.href} className="inline-block mt-2">
                  <motion.div
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-400/60 hover:text-[#60A5FA] uppercase tracking-widest cursor-pointer group/learn"
                    whileHover={{ gap: '8px', color: '#60A5FA' }}
                  >
                    <span>Learn more</span>
                    <ChevronRight size={10} className="transform group-hover/learn:translate-x-0.5 transition-transform" />
                  </motion.div>
                </Link>
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
