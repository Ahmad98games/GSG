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
    <div className="bg-[#121417] min-h-screen text-slate-300 font-inter pb-32 relative overflow-hidden">
      
      {/* Scroll indicator */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-[#C5A059] to-[#10B981] z-[100] origin-left"
        style={{ scaleX: 1 }} // Fallback or standard style
      />

      {/* Floating Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.04)_0%,transparent_70%)] pointer-events-none" />

      {/* Hero Header */}
      <header className="relative pt-28 pb-12 px-6 text-center z-10 max-w-4xl mx-auto space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 mb-2"
        >
          <BookOpen className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Knowledge Base & Guides</span>
        </motion.div>
        
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none"
        >
          Noxis Blog
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-400 font-medium max-w-2xl mx-auto"
        >
          Expert guides and analyses on manufacturing floor automation, offline-first SQLite synchronization, piece-rate karigar bookkeeping, and Sentinel edge AI CCTV security systems.
        </motion.p>
      </header>

      {/* Filters and Search Console */}
      <section className="max-w-7xl mx-auto px-6 mb-12 relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#1A1D21] border border-white/5 p-4 rounded-sm">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search guides, technical documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121417] border border-white/5 rounded-sm pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-colors font-medium"
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
                    ? 'bg-blue-500 border-blue-500 text-black shadow-lg shadow-blue-500/10'
                    : 'bg-white/5 border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'
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
              className="text-center py-24 bg-[#1A1D21] border border-white/5 rounded-sm"
            >
              <p className="text-gray-500 uppercase font-mono tracking-widest text-xs">No articles match your criteria.</p>
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
                    whileHover={{ y: -8, borderColor: 'rgba(96,165,250,0.3)', boxShadow: '0 20px 45px rgba(0,0,0,0.4)' }}
                    className="bg-[#1A1D21] border border-white/5 p-8 rounded-sm transition-all duration-300 flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Meta elements */}
                      <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-3">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>{readingTime} Min read</span>
                        </div>
                      </div>

                      {/* Header */}
                      <h2 className="text-xl font-bold text-white tracking-tight leading-snug mb-4 group-hover:text-blue-400 transition-colors uppercase italic">
                        <Link href={`/blog/${post.slug}`} className="cursor-pointer">
                          {post.title}
                        </Link>
                      </h2>

                      {/* Summary */}
                      <p className="text-xs text-gray-400 leading-relaxed font-medium mb-8">
                        {post.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                      <Link 
                        href={`/blog/${post.slug}`} 
                        className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-blue-400 transition-colors flex items-center space-x-1.5 cursor-pointer"
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
    </div>
  )
}
