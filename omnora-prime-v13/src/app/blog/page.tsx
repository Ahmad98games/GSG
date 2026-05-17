import React from 'react';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/blog-utils';
import { BookOpen, Calendar, ArrowRight, Home } from 'lucide-react';

export const metadata = {
  title: 'Noxis Blog — Industrial Factory Management Guides',
  description: 'Guides and insights on managing textile mills, karigar payroll, active CCTV safety, and offline-first inventory systems in Pakistan.',
};

export default async function BlogIndexPage() {
  const posts = getBlogPosts();

  return (
    <div className="bg-[#121417] min-h-screen text-slate-300 font-inter selection:bg-electric-blue selection:text-[#121417] pb-32">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative top-0 w-full z-50 bg-[#121417]/85 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 flex items-center justify-center bg-white/5 group-hover:bg-electric-blue/10 rounded-sm transition-all shadow-2xl">
              <img
                src="/logos/noxis.png"
                alt="Noxis Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black tracking-tighter leading-none text-xl">NOXIS</span>
            </div>
          </Link>

          <div className="flex items-center space-x-12 text-[11px] font-bold uppercase tracking-[0.15em] text-white/50">
            <Link href="/" className="hover:text-electric-blue transition-colors flex items-center space-x-2">
              <Home className="w-3.5 h-3.5" />
              <span>Back Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative pt-24 pb-16 px-6 text-center z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-electric-blue/10 border border-electric-blue/30 mb-6">
          <BookOpen className="w-3 h-3 text-electric-blue" />
          <span className="text-[10px] font-bold text-electric-blue uppercase tracking-widest">Knowledge Base & Guides</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tightest mb-6 leading-none">
          Noxis Blog
        </h1>
        <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
          Expert guides for industrial businesses. Optimize your factory floor, manage karigar payroll, and stop material leakage.
        </p>
      </header>

      {/* Blog Post Grid */}
      <main className="max-w-7xl mx-auto px-6 mt-12 relative z-10">
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1D21] border border-white/5 rounded-sm">
            <p className="text-slate-500 uppercase font-mono tracking-widest text-xs">No articles published yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.slug} className="bg-[#1A1D21] border border-white/5 hover:border-white/15 p-8 transition-all flex flex-col group relative">
                <div className="flex items-center space-x-2 text-[10px] font-mono text-electric-blue font-bold uppercase tracking-widest mb-4">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{post.date}</span>
                </div>

                <h2 className="text-xl font-bold text-white tracking-tight leading-snug mb-4 group-hover:text-electric-blue transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>

                <p className="text-sm text-slate-400 leading-relaxed font-medium mb-8 flex-1">
                  {post.description}
                </p>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                  <Link href={`/blog/${post.slug}`} className="text-[11px] font-black uppercase tracking-widest text-white group-hover:text-electric-blue transition-colors flex items-center space-x-2">
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
