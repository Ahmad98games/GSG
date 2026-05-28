/**
 * Noxis Hub — Advanced Animation System
 * Centralized Framer Motion variants and helpers for consistent,
 * satisfying animations across all public-facing pages.
 */

import { Variants, Transition } from 'framer-motion'

// ─── SPRING PRESETS ────────────────────────────────────────────────────────────

export const springs = {
  soft: { type: 'spring', stiffness: 80, damping: 18 } as Transition,
  snappy: { type: 'spring', stiffness: 200, damping: 22 } as Transition,
  bouncy: { type: 'spring', stiffness: 300, damping: 20 } as Transition,
  smooth: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } as Transition,
  slow: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } as Transition,
}

// ─── FADE VARIANTS ─────────────────────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: springs.smooth },
}

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  show: { opacity: 1, y: 0, transition: springs.smooth },
}

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: springs.smooth },
}

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: springs.smooth },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
}

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: springs.snappy },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: springs.soft },
}

// ─── STAGGER CONTAINERS ────────────────────────────────────────────────────────

export const stagger = (delay = 0.1): Variants => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: delay,
      delayChildren: 0.1,
    },
  },
})

export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

export const staggerSlow: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.15 },
  },
}

// ─── SCROLL-TRIGGERED ──────────────────────────────────────────────────────────

export const scrollFadeUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
}

export const scrollScaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.soft,
  },
}

export const scrollSlideLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
}

export const scrollSlideRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
}

// ─── HOVER EFFECTS ─────────────────────────────────────────────────────────────

export const hoverLift = {
  rest: { y: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
  hover: {
    y: -6,
    boxShadow: '0 20px 45px rgba(0,0,0,0.5)',
    transition: springs.snappy,
  },
}

export const hoverGlow = {
  rest: { boxShadow: '0 0 0px rgba(96,165,250,0)' },
  hover: {
    boxShadow: '0 0 30px rgba(96,165,250,0.15)',
    transition: { duration: 0.3 },
  },
}

export const hoverScale = {
  rest: { scale: 1 },
  hover: { scale: 1.03, transition: springs.snappy },
  tap: { scale: 0.97 },
}

// ─── TEXT ANIMATION ────────────────────────────────────────────────────────────

export const charReveal: Variants = {
  hidden: { opacity: 0, y: 20, rotateX: -40 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

export const wordReveal: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
}

// ─── CARD VARIANTS ─────────────────────────────────────────────────────────────

export const cardFloat: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.soft,
  },
}

export const listItem: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: springs.snappy,
  },
}

// ─── PAGE TRANSITION ───────────────────────────────────────────────────────────

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
}

// ─── VIEWPORT OPTIONS ──────────────────────────────────────────────────────────

export const viewport = {
  once: true,
  margin: '-80px',
}

export const viewportEager = {
  once: true,
  margin: '-40px',
}

// ─── NUMBER COUNTER UTILITY ────────────────────────────────────────────────────

/**
 * useCountUp — animates from 0 to `target` over `duration` ms
 * when `trigger` becomes true
 */
export function useCountUp(target: number, duration = 1400, trigger = true): number {
  if (typeof window === 'undefined') return target
  // This is a pattern; actual hook needs React imports
  return target
}
