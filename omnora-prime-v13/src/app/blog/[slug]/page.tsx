import React from 'react';
import Link from 'next/link';
import { getBlogPosts, getBlogPostBySlug } from '@/lib/blog-utils';
import { notFound } from 'next/navigation';
import { Calendar, ChevronLeft, BookOpen, Clock } from 'lucide-react';

type Props = {
  params: Promise<{ slug: string }>
};

export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const resolvedParams = await params;
  const post = getBlogPostBySlug(resolvedParams.slug);
  if (!post) return { title: 'Post Not Found' };
  
  return {
    title: `${post.title} | Noxis Blog`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      url: `https://noxishub.app/blog/${resolvedParams.slug}`,
    }
  };
}

function renderInlineBold(text: string) {
  const parts = text.split('**');
  if (parts.length < 3) return text;
  
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="text-white font-black">{part}</strong>;
    }
    return part;
  });
}

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let insideList = false;

  const flushList = (key: string) => {
    if (insideList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-6 mb-8 space-y-3 text-slate-300 font-medium">
          {listItems}
        </ul>
      );
      listItems = [];
      insideList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(`empty-${index}`);
      return;
    }

    // Skip the main H1 since we render it at the top of the template
    if (trimmed.startsWith('# ')) {
      flushList(`h1-${index}`);
      return;
    }

    // Headers
    if (trimmed.startsWith('## ')) {
      flushList(`h2-${index}`);
      elements.push(
        <h2 key={`h2-${index}`} className="text-2xl md:text-3xl font-black text-white tracking-tight mt-12 mb-6 border-b border-white/5 pb-2">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList(`h3-${index}`);
      elements.push(
        <h3 key={`h3-${index}`} className="text-xl md:text-2xl font-bold text-white tracking-tight mt-8 mb-4">
          {trimmed.slice(4)}
        </h3>
      );
    }
    // Lists
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      insideList = true;
      listItems.push(
        <li key={`li-${index}`} className="leading-relaxed text-slate-300 text-base md:text-lg">
          {renderInlineBold(trimmed.slice(2))}
        </li>
      );
    }
    // Paragraphs
    else {
      flushList(`p-${index}`);
      elements.push(
        <p key={`p-${index}`} className="text-base md:text-lg text-slate-300 leading-relaxed font-medium mb-6">
          {renderInlineBold(trimmed)}
        </p>
      );
    }
  });

  flushList('final');
  return elements;
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = getBlogPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  // Calculate simulated reading time (approx 200 words/min)
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="bg-[#08090A] min-h-screen text-slate-300 font-inter selection:bg-sandstone-gold/30 selection:text-white pb-32">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative top-0 w-full z-50 bg-[#08090A]/85 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 flex items-center justify-center bg-white/5 group-hover:bg-sandstone-gold/10 rounded-sm transition-all shadow-2xl">
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
            <Link href="/blog" className="hover:text-sandstone-gold transition-colors flex items-center space-x-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>All Articles</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Post Shell */}
      <main className="max-w-4xl mx-auto px-6 mt-16 relative z-10">
        <Link href="/blog" className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-sandstone-gold transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Blog</span>
        </Link>

        {/* Metadata Header */}
        <header className="mb-12 border-b border-white/5 pb-10">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tightest leading-tight mb-6">
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-6 text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-sandstone-gold" />
              <span>Published: {post.date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#00E5FF]" />
              <span>{readingTime} Min Read</span>
            </div>
          </div>
        </header>

        {/* Dynamic Parsed Article Body */}
        <article className="prose prose-invert max-w-none">
          {renderMarkdown(post.content)}
        </article>

        {/* Bottom Call to Action */}
        <div className="mt-20 p-10 bg-[#1A1D21] border border-white/5 rounded-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white uppercase tracking-widest">Ready to modernize your operations?</h3>
            <p className="text-sm text-slate-400 font-medium max-w-lg">Get 3 days of fully unlocked Elite tier access to testing tools for staff, ledgers, inventory, and AI CCTV monitoring.</p>
          </div>
          <Link href="/download" className="bg-sandstone-gold text-black px-8 py-4 font-black uppercase tracking-widest text-xs hover:bg-[#D4B77A] shadow-[0_0_20px_rgba(197,160,89,0.15)] transition-all shrink-0">
            Download 3-Day Trial
          </Link>
        </div>
      </main>

      {/* Footer legal bar */}
      <footer className="max-w-4xl mx-auto px-6 mt-16 pb-8 relative z-10">
        <div className="border-t border-white/5 pt-8 flex flex-wrap items-center justify-between gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          <span>© {new Date().getFullYear()} Omnora Labs · All rights reserved</span>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
            <Link href="/blog" className="hover:text-slate-400 transition-colors">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
