'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface NoxisLogoLoaderProps {
  label?: string
  fullScreen?: boolean
}

export function NoxisLogoLoader({
  label = 'Initializing Noxis...',
  fullScreen = true
}: NoxisLogoLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-[#070809] text-white select-none relative overflow-hidden ${
        fullScreen ? 'min-h-screen w-screen fixed inset-0 z-[9999]' : 'h-full w-full py-20'
      }`}
    >
      {/* Background Orbs */}
      {fullScreen && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#C5A059]/10 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-[#00E5FF]/5 blur-[80px]" />
        </div>
      )}

      <div className="flex flex-col items-center z-10 space-y-6">
        {/* Pulsing & Glowing Logo Wrapper */}
        <div className="relative">
          {/* Logo glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-[#C5A059] to-[#00E5FF] rounded-sm blur-xl opacity-30"
            animate={{
              scale: [0.9, 1.15, 0.9],
              opacity: [0.25, 0.45, 0.25]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Main Logo Image */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotateY: [0, 180, 360]
            }}
            transition={{
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              },
              rotateY: {
                duration: 6,
                repeat: Infinity,
                ease: "linear"
              }
            }}
            className={`relative rounded-sm bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl ${
              fullScreen ? 'w-24 h-24 p-5' : 'w-16 h-16 p-3.5'
            }`}
          >
            <img
              src="/logos/noxis.png"
              alt="Noxis"
              className="w-full h-full object-contain"
            />
          </motion.div>
        </div>

        {/* Text and Indicator */}
        <div className="flex flex-col items-center space-y-3">
          <motion.span
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`font-black uppercase tracking-[0.4em] text-center font-mono ${
              fullScreen ? 'text-[11px] text-gray-400' : 'text-[9px] text-gray-500'
            }`}
          >
            {label}
          </motion.span>
          
          {/* Infinite horizontal loading line */}
          <div className={`h-[2px] bg-white/5 overflow-hidden relative ${
            fullScreen ? 'w-32' : 'w-24'
          }`}>
            <motion.div
              className="h-full bg-gradient-to-r from-[#C5A059] to-[#00E5FF]"
              animate={{
                left: ['-100%', '100%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                width: '70%',
                top: 0
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
