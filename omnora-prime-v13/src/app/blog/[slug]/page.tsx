import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPosts, getBlogPostBySlug } from '@/lib/blog-utils';
import { notFound } from 'next/navigation';
import { Calendar, ChevronLeft, BookOpen, Clock, Share2, Link2, Camera, ArrowLeft } from 'lucide-react';

type Props = {
  params: Promise<{ slug: string }>
};

export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
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

    if (trimmed.startsWith('# ')) {
      flushList(`h1-${index}`);
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushList(`h2-${index}`);
      elements.push(
        <h2 key={`h2-${index}`} className="text-2xl md:text-3xl font-black text-white tracking-tight mt-12 mb-6 border-b border-white/[0.04] pb-2 uppercase">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList(`h3-${index}`);
      elements.push(
        <h3 key={`h3-${index}`} className="text-lg md:text-xl font-bold text-white tracking-tight mt-8 mb-4 uppercase text-[#C5A059]">
          {trimmed.slice(4)}
        </h3>
      );
    }
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      insideList = true;
      listItems.push(
        <li key={`li-${index}`} className="leading-relaxed text-slate-300 text-sm sm:text-base">
          {renderInlineBold(trimmed.slice(2))}
        </li>
      );
    }
    else {
      flushList(`p-${index}`);
      elements.push(
        <p key={`p-${index}`} className="text-sm sm:text-base text-slate-400 leading-relaxed font-medium mb-6">
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

  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="bg-[#040608] min-h-screen text-[#94A3B8] font-sans selection:bg-[#C5A059]/30 selection:text-white pb-32 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#C5A059]/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00E5FF]/[0.01] rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
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

          <div className="flex items-center space-x-12 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <Link href="/blog" className="hover:text-white transition-colors flex items-center space-x-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>All Articles</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Post Shell */}
      <main className="max-w-4xl mx-auto px-6 pt-36 relative z-10">
        <Link href="/blog" className="inline-flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Blog</span>
        </Link>

        {/* Metadata Header */}
        <header className="mb-12 border-b border-white/[0.04] pb-10">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-6 uppercase">
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-6 text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#C5A059]" />
              <span>Published: {post.date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#C5A059]" />
              <span>{readingTime} Min Read</span>
            </div>
          </div>
        </header>

        {/* Dynamic Parsed Article Body */}
        <article className="prose prose-invert max-w-none text-[#94A3B8]">
          {renderMarkdown(post.content)}
        </article>

        {/* Bottom Call to Action */}
        <div className="mt-20 p-8 sm:p-10 bg-[#0A0D10] border border-white/[0.04] rounded-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white uppercase tracking-widest">Ready to modernize your operations?</h3>
            <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-lg">Get 3 days of fully unlocked Elite tier access to testing tools for staff, ledgers, inventory, and AI CCTV monitoring.</p>
          </div>
          <Link href="/download" className="bg-[#C5A059] text-[#040608] px-8 py-4 font-black uppercase tracking-widest text-xs hover:brightness-110 shadow-[0_0_20px_rgba(197,160,89,0.15)] transition-all shrink-0">
            Download 3-Day Trial
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-white/[0.04] pt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-[10px] font-bold text-white/40">
            <div className="flex items-center space-x-2 uppercase tracking-widest">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/logos/noxis.png"
                  alt="Noxis Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <span>NOXIS</span>
              </Link>
              <span className="text-gray-600 font-mono font-medium">© {new Date().getFullYear()} All rights reserved.</span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <div className="flex items-center space-x-6">
                <a href="https://www.facebook.com/profile.php?fb_profile_edit_entry_point=%7B%22click_point%22%3A%22edit_profile_button%22%2C%22feature%22%3A%22profile_header%22%7D&id=61575141243708&sk=about" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Share2 size={14} /></a>
                <a href="https://www.linkedin.com/in/ahmad-mahboob-764101407/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Link2 size={14} /></a>
                <a href="https://www.instagram.com/i.am_ahmad_mahboob/?__pwa=1" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Camera size={14} /></a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'JetBrains+Mono', monospace; }
        body { background-color: #040608; }
      `}} />
    </div>
  );
}