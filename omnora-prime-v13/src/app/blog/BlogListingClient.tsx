'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Calendar, ArrowRight, Search, BookOpen, Clock } from 'lucide-react'
import { BlogPost } from '@/lib/blog-utils'

export default function BlogListingClient({ posts }: { posts: BlogPost[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState('All')

  // Get all unique keywords/tags
  const allTags = ['All', ...Array.from(new Set(posts.flatMap(p => p.keywords || [])))]

  // Filter posts based on search query and active tag
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = activeTag === 'All' || (post.keywords && post.keywords.includes(activeTag))
    return matchesSearch && matchesTag
  })

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  }

  return (
    <div className="bg-[#040608] min-h-screen text-[#94A3B8] font-sans pb-32 relative overflow-hidden selection:bg-[#C5A059]/30 selection:text-white">
      
      {/* Fixed top accent line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C5A059] via-[#00E5FF] to-[#C5A059] z-[100]" />

      {/* Floating Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#C5A059]/[0.02] rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#00E5FF]/[0.015] rounded-full blur-[140px]" />
      </div>

      {/* ═══ HEADER NAVIGATION ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#040608]/85 backdrop-blur-xl border-b border-white/[0.04] py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-8 h-8 flex items-center justify-center bg-white/5 group-hover:bg-[#C5A059]/10 border border-white/10 group-hover:border-[#C5A059]/30 rounded-sm transition-all shadow-2xl">
              <img
                src="/logos/noxis.png"
                alt="Noxis Logo"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold tracking-wider leading-none text-sm">NOXIS</span>
              <span className="text-[8px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">Core Knowledge Base</span>
            </div>
          </Link>

          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white flex items-center space-x-2 transition-colors">
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Back Home</span>
          </Link>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative pt-36 pb-12 px-6 text-center z-10 max-w-4xl mx-auto space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
          <span className="text-[9px] font-bold text-[#C5A059] uppercase tracking-widest">Knowledge Base & Guides</span>
        </motion.div>
        
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none uppercase"
        >
          Noxis <span className="text-[#C5A059]">Blog</span>
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-base text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed"
        >
          Expert guides and analyses on manufacturing floor automation, offline-first SQLite synchronization, piece-rate karigar bookkeeping, and Sentinel edge AI CCTV security systems.
        </motion.p>
      </header>

      {/* Filters and Search Console */}
      <section className="max-w-7xl mx-auto px-6 mb-16 relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0A0D10] border border-white/[0.04] p-4 rounded-sm">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search guides, technical documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#040608]/50 border border-white/[0.05] rounded-sm pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#C5A059]/40 transition-colors font-medium font-sans"
            />
          </div>

          {/* Tags filters */}
          <div className="flex flex-wrap gap-2 max-w-xl">
            {allTags.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all border ${
                  activeTag === tag
                    ? 'bg-[#C5A059] border-[#C5A059] text-black shadow-lg shadow-[#C5A059]/10'
                    : 'bg-white/5 border-white/[0.04] text-slate-400 hover:text-white hover:border-white/10'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid listing */}
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <AnimatePresence mode="popLayout">
          {filteredPosts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="text-center py-24 bg-[#0A0D10] border border-white/[0.04] rounded-sm"
            >
              <p className="text-slate-500 uppercase font-mono tracking-widest text-xs">No articles match your criteria.</p>
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredPosts.map((post) => {
                const wordCount = post.content.split(/\s+/).length
                const readingTime = Math.max(1, Math.round(wordCount / 200))

                return (
                  <motion.article 
                    key={post.slug} 
                    variants={itemVariants}
                    layout
                    whileHover={{ y: -6, borderColor: 'rgba(197,160,89,0.25)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                    className="bg-[#0A0D10] border border-white/[0.04] p-8 rounded-sm transition-all duration-300 flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Meta elements */}
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider mb-4 border-b border-white/[0.03] pb-3">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>{readingTime} Min read</span>
                        </div>
                      </div>

                      {/* Header */}
                      <h2 className="text-lg font-bold text-white tracking-tight leading-snug mb-4 group-hover:text-[#C5A059] transition-colors uppercase">
                        <Link href={`/blog/${post.slug}`} className="cursor-pointer">
                          {post.title}
                        </Link>
                      </h2>

                      {/* Summary */}
                      <p className="text-xs text-slate-400 leading-relaxed font-medium mb-8">
                        {post.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 border-t border-white/[0.03] flex items-center justify-between mt-auto">
                      <Link 
                        href={`/blog/${post.slug}`} 
                        className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-[#C5A059] transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </motion.article>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'JetBrains+Mono', monospace; }
        body { background-color: #040608; }
      `}</style>
    </div>
  )
}

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}
