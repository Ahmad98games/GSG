'use client';

import { useState } from 'react';
import Link from 'next/link';
import { allPosts } from './posts';
import { Search, Calendar, User, ArrowRight } from 'lucide-react';

export default function BlogIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'Industry' | 'Comparison' | 'Guide'>('all');

  const filteredPosts = allPosts.filter(post => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-[#060708] text-white pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-[#60A5FA]/2 blur-[100px] pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/20 text-[#60A5FA] text-[10px] font-bold uppercase tracking-widest mb-4">
            📖 Noxis Chronicle
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 uppercase">
            Industrial Intelligence Blog
          </h1>
          <p className="text-xs text-gray-500 max-w-xl mx-auto leading-relaxed">
            Technical guides, market updates, and comparison insights to optimize emerging market factories.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12 p-4 bg-[#0F1114] border border-white/5 rounded-sm">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
            <input
              type="text"
              placeholder="Search posts or keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#161A1F] border border-white/8 text-white placeholder-gray-600 text-xs px-10 py-3 outline-none focus:border-[#60A5FA]/40 rounded-sm font-medium"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
            {(['all', 'Industry', 'Comparison', 'Guide'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#60A5FA] text-black'
                    : 'bg-[#161A1F] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        {filteredPosts.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/5 bg-[#090A0C]/40 rounded-sm">
            <p className="text-sm font-bold text-gray-500">No articles found matching your filters</p>
            <p className="text-[10px] text-gray-700 mt-1">Try resetting the filters or typing a different search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="p-6 bg-[#0F1114] border border-white/5 rounded-sm hover:border-[#60A5FA]/25 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Category Pill */}
                  <span className="text-[8px] font-bold uppercase tracking-widest text-[#60A5FA] bg-[#60A5FA]/10 border border-[#60A5FA]/20 px-2 py-0.5 rounded-full inline-block mb-4">
                    {post.category}
                  </span>

                  <h2 className="text-base font-bold text-white group-hover:text-[#60A5FA] transition-colors leading-tight mb-2 uppercase tracking-wide">
                    {post.title}
                  </h2>
                  <p className="text-xs text-gray-500 leading-relaxed mb-6">
                    {post.description}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between border-t border-white/[0.04] pt-4 mt-4 text-[9px] font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {post.publishedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={10} />
                      {post.author}
                    </span>
                  </div>
                  <span className="text-[#60A5FA] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read
                    <ArrowRight size={10} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
