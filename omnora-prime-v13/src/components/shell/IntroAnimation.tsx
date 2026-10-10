'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'

export function IntroAnimation({
  onComplete
}: { onComplete: () => void }) {
  const { profile } = useBusinessProfile()
  const [phase, setPhase] = useState(0)
  
  useEffect(() => {
    const handleSkip = () => onComplete()
    window.addEventListener('keydown', handleSkip)
    window.addEventListener('click', handleSkip)

    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 400),
      setTimeout(() => setPhase(3), 750),
      setTimeout(() => setPhase(4), 1100),
      setTimeout(() => onComplete(), 1350),
    ]
    return () => {
      window.removeEventListener('keydown', handleSkip)
      window.removeEventListener('click', handleSkip)
      timers.forEach(clearTimeout)
    }
  }, [onComplete])

  return (
    <motion.div
      onClick={onComplete}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#06080D] cursor-pointer select-none overflow-hidden"
      animate={{ opacity: phase >= 4 ? 0 : 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Background ambient radial glow */}
      <div className="absolute w-[450px] h-[450px] bg-gradient-to-tr from-cyan-500/10 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Noxis Cyber Hexagon Emblem */}
      <AnimatePresence mode="wait">
        {phase >= 1 && phase < 4 && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: phase === 2 ? [1, 1.04, 1] : 1 
            }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{
              scale: phase === 2 ? {
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut"
              } : {
                type: 'spring',
                stiffness: 220,
                damping: 18
              },
              opacity: { duration: 0.35 }
            }}
            className="mb-6 relative flex items-center justify-center"
          >
            {/* Pulsing orbital rings */}
            <div className="absolute inset-[-14px] rounded-full border border-cyan-500/20 animate-spin" style={{ animationDuration: '14s' }} />
            <div className="absolute inset-[-6px] rounded-3xl border border-blue-500/30 rotate-45 animate-pulse" />

            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#070A12] border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/30 flex items-center justify-center relative z-10">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="#06B6D4" strokeWidth="2.5" strokeLinejoin="round"/>
                <path d="M16 32V16L32 32V16" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="24" cy="24" r="3.5" fill="#06B6D4" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Title & Business Name */}
      <AnimatePresence>
        {phase >= 2 && phase < 4 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-white text-xl tracking-[0.4em] uppercase font-black bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              NOXIS HUB
            </h1>
            <p className="text-slate-400 text-xs tracking-[0.25em] uppercase font-semibold mt-1">
              {profile?.business_name || 'Industrial ERP & Mesh Platform'}
            </p>
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent mt-4" />
            <span className="text-cyan-400/80 text-[9px] tracking-[0.3em] uppercase mt-2 font-mono">
              Core Kernel v13.0.8 • Online
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* By Omnora Labs */}
      <AnimatePresence>
        {phase >= 3 && phase < 4 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-slate-500 text-[10px] tracking-[0.3em] mt-3 font-mono uppercase"
          >
            Omnora Labs
          </motion.p>
        )}
      </AnimatePresence>
      
      {/* Loading Progress Bar */}
      {phase < 4 && (
        <motion.div
          className="absolute bottom-14 w-32 h-[2.5px] bg-white/10 overflow-hidden rounded-full"
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </motion.div>
  )
}
