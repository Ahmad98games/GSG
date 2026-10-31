'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'

export function IntroAnimation({
  onComplete
}: { onComplete: () => void }) {
  const { profile } = useBusinessProfile()
  const [phase, setPhase] = useState(0)
  
  const displayBusinessName = profile?.business_name || 'Enterprise Hub'
  const userLogo = profile?.avatar_url

  useEffect(() => {
    const handleSkip = () => onComplete()
    window.addEventListener('keydown', handleSkip)
    window.addEventListener('click', handleSkip)

    // Ultra-fast responsive lifecycle (<0ms perception, finishes in 650ms total)
    const timers = [
      setTimeout(() => setPhase(1), 30),
      setTimeout(() => setPhase(2), 160),
      setTimeout(() => setPhase(3), 350),
      setTimeout(() => setPhase(4), 580),
      setTimeout(() => onComplete(), 720),
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
      transition={{ duration: 0.2 }}
    >
      {/* Background ambient subtle glow */}
      <div className="absolute w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* User Brand Logo / Monogram */}
      <AnimatePresence mode="wait">
        {phase >= 1 && phase < 4 && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="mb-5 relative flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-xl bg-[#0F172A] border border-white/10 shadow-xl flex items-center justify-center relative z-10 overflow-hidden">
              {userLogo ? (
                <img src={userLogo} alt={displayBusinessName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold tracking-tight">
                  {(displayBusinessName.charAt(0) || 'N').toUpperCase()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* User Brand Title */}
      <AnimatePresence>
        {phase >= 2 && phase < 4 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-center px-6 text-center"
          >
            <h1 className="text-white text-xl sm:text-2xl tracking-tight font-bold max-w-xl truncate">
              {displayBusinessName}
            </h1>
            <p className="text-slate-400 text-xs font-normal mt-1">
              Industrial Operations Workstation
            </p>
            <div className="flex items-center gap-1.5 mt-2.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 text-[10px] font-medium">
                System Ready
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Sub-label: By Omnora Labs */}
      <AnimatePresence>
        {phase >= 3 && phase < 4 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="text-slate-500 text-[9px] tracking-[0.25em] mt-3 font-mono uppercase"
          >
            Engineered By Omnora Labs
          </motion.p>
        )}
      </AnimatePresence>
      
      {/* Loading Progress Bar */}
      {phase < 4 && (
        <motion.div
          className="absolute bottom-12 w-28 h-[2px] bg-white/10 overflow-hidden rounded-full"
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </motion.div>
  )
}
