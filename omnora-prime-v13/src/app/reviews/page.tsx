'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion, useScroll, useSpring } from 'framer-motion'
import { 
  ArrowRight, Download, Menu, X, MessageSquare
} from 'lucide-react'
import { 
  SectionReveal, GlowCard, FloatingOrb 
} from '@/components/ui/AnimatedComponents'
import { FeedbackModal } from '@/components/ui/FeedbackModal'

export default function ReviewsPage() {
  const supabase = createClient()
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
        if (!error && data) {
          setTestimonials(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTestimonials()
  }, [supabase])

  return (
    <div className="bg-[#070809] text-white font-sans min-h-screen selection:bg-sandstone-gold/30 selection:text-white overflow-x-hidden relative flex flex-col justify-between">
      {/* Scroll progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sandstone-gold via-[#00E5FF] to-sandstone-gold z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <FloatingOrb color="rgba(197,160,89,0.06)" size={600} x="10%" y="20%" delay={0} blur={130} />
        <FloatingOrb color="rgba(0,229,255,0.04)" size={500} x="80%" y="70%" delay={3} blur={125} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#070809]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-sandstone-gold/50 group-hover:bg-sandstone-gold/10 transition-colors">
              <img src="/logos/noxis.png" alt="Noxis" className="w-5 h-5 object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white group-hover:text-[#E8D5B5] transition-colors">NOXIS</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[{ label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }].map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-gray-400 hover:text-white font-medium transition-colors relative group">
                {link.label}
              </Link>
            ))}
            <Link
              href="/download"
              className="text-xs font-bold tracking-widest uppercase text-black bg-sandstone-gold hover:bg-[#D4B77A] px-6 py-2.5 rounded-sm transition-all shadow-[0_0_20px_rgba(197,160,89,0.15)]"
            >
              Download
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white transition-colors">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/[0.06] bg-[#070809]">
            <div className="px-6 py-8 flex flex-col gap-6">
              {[{ label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }].map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white font-semibold transition-colors">
                  {link.label}
                </Link>
              ))}
              <Link href="/download" onClick={() => setMobileMenuOpen(false)} className="block text-center font-bold text-sm tracking-widest uppercase text-black bg-sandstone-gold hover:bg-[#D4B77A] py-3.5 rounded-sm">
                Free Trial Download
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 pt-32 pb-24 px-6 max-w-6xl mx-auto w-full flex flex-col">
        <SectionReveal className="text-center mb-16 space-y-4">
          <p className="text-xs font-bold text-sandstone-gold uppercase tracking-widest">Testimonials</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
            User Reviews
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            Verified feedback submitted by factory owners and floor managers. Share your experience directly from the website or from inside the Noxis Hub software.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setFeedbackOpen(true)}
              className="inline-flex items-center gap-2 bg-sandstone-gold hover:bg-[#D4B77A] text-black text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-sm transition-all shadow-[0_0_20px_rgba(197,160,89,0.15)] animate-pulse"
            >
              ★ Share Feedback
            </button>
          </div>
        </SectionReveal>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-2 border-sandstone-gold/20 border-t-sandstone-gold rounded-full"
            />
          </div>
        ) : testimonials.length > 0 ? (
          <SectionReveal delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <GlowCard key={t.id} delay={i * 0.08} glowColor="rgba(197,160,89,0.08)"
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
          </SectionReveal>
        ) : (
          <SectionReveal delay={0.1} className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-500 mb-6 shadow-inner">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">
              No Reviews Published Yet
            </h3>
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed mb-8">
              All feedback displayed here is submitted by active factory owners from inside our software and reviewed before publishing. No fabricated reviews.
            </p>
            <Link
              href="/download"
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-widest px-6 py-3 transition-colors"
            >
              <span>Download Noxis Free Trial</span>
              <ArrowRight size={14} />
            </Link>
          </SectionReveal>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#050607] py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <img src="/logos/noxis.png" alt="Noxis" className="w-5 h-5 object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="font-extrabold text-sm tracking-wider">NOXIS</span>
            <span className="text-xs text-gray-600">by Omnora Labs</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-xs font-semibold uppercase tracking-widest text-gray-500">
            {[{ label: 'Download', href: '/download' }, { label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }, { label: 'Privacy', href: '/privacy' }].map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          <p className="text-xs text-gray-600 text-center md:text-right">
            © 2026 Omnora Labs · Engineered for Manufacturing 🇵🇰
          </p>
        </div>
      </footer>

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        trigger="manual"
      />
    </div>
  )
}
