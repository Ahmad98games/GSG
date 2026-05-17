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
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 2300),
      setTimeout(() => setPhase(4), 2600),
      setTimeout(() => onComplete(), 3000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete])
  
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col
        items-center justify-center bg-[#080A0C]"
      animate={{ opacity: phase >= 4 ? 0 : 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Noxis Logo */}
      <AnimatePresence mode="wait">
        {phase >= 1 && phase < 4 && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: phase === 2 ? [1, 1.03, 1] : 1 
            }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{
              scale: phase === 2 ? {
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut"
              } : {
                type: 'spring',
                stiffness: 200,
                damping: 20
              },
              opacity: { duration: 0.4 }
            }}
            className="mb-6"
          >
            <img
              src="/logos/noxis.png"
              alt="Noxis"
              className="w-24 h-24 object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Business Name */}
      <AnimatePresence>
        {phase >= 2 && phase < 4 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            <span className="text-gray-500 text-[10px] tracking-[0.4em] uppercase mb-1">
              Welcome back
            </span>
            <p className="text-white text-lg tracking-[0.3em] uppercase font-bold">
              {profile?.business_name || 'Administrator'}
            </p>
            <div className="h-[1px] w-12 bg-electric-blue/30 mt-4" />
            <span className="text-electric-blue/50 text-[8px] tracking-[0.5em] uppercase mt-2 font-mono">
              Bespoke Industrial System
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* By Omnora Labs */}
      <AnimatePresence>
        {phase >= 3 && phase < 4 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-gray-500 text-xs
              tracking-widest mt-2 font-mono"
          >
            by Omnora Labs
          </motion.p>
        )}
      </AnimatePresence>
      
      {/* Loading bar */}
      {phase < 4 && (
        <motion.div
          className="absolute bottom-16 w-24 h-[2px]
            bg-white/10 overflow-hidden"
          style={{ borderRadius: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="h-full bg-electric-blue"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5, ease: 'linear' }}
          />
        </motion.div>
      )}
    </motion.div>
  )
}
