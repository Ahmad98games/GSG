import { allPosts } from '../posts';
import Script from 'next/script';
import Link from 'next/link';
import { Calendar, User, ArrowLeft, Send } from 'lucide-react';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return allPosts.map(post => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = allPosts.find(p => p.slug === params.slug);
  if (!post) return {};

  return {
    title: `${post.title} — Noxis Hub Blog`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://noxishub.app/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = allPosts.find(p => p.slug === params.slug);
  if (!post) {
    notFound();
  }

  // Related posts: any other posts in the same category or just list 2 other posts
  const relatedPosts = allPosts
    .filter(p => p.slug !== post.slug)
    .slice(0, 2);

  // Markdown rendering simulation
  const paragraphs = post.content.split('\n\n').filter(Boolean);

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out this article: "${post.title}" at https://noxishub.app/blog/${post.slug}`
  )}`;

  return (
    <>
      {/* Blog Article Schema */}
      <Script
        id="blog-post-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.description,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            author: {
              '@type': 'Organization',
              name: post.author,
              url: 'https://noxishub.app',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Omnora Labs',
              logo: {
                '@type': 'ImageObject',
                url: 'https://noxishub.app/logo.png',
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://noxishub.app/blog/${post.slug}`,
            },
          })
        }}
      />

      <main className="min-h-screen bg-[#060708] text-white pt-28 pb-20 px-6">
        <article className="max-w-3xl mx-auto">
          {/* Back button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#60A5FA] hover:text-blue-400 transition-colors mb-8"
          >
            <ArrowLeft size={10} /> Back to Blog
          </Link>

          {/* Category */}
          <span className="text-[8px] font-bold uppercase tracking-widest text-[#60A5FA] bg-[#60A5FA]/10 border border-[#60A5FA]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
            {post.category}
          </span>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white mb-6 uppercase tracking-wide">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-8 pb-4 border-b border-white/[0.04]">
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              Published: {post.publishedAt}
            </span>
            <span className="flex items-center gap-1">
              <User size={10} />
              Author: {post.author}
            </span>
          </div>

          {/* Article Body */}
          <div className="text-gray-300 text-sm leading-relaxed space-y-5 font-normal tracking-wide select-text">
            {paragraphs.map((p, i) => {
              const trimmed = p.trim();
              if (trimmed.startsWith('# ')) {
                return null; // Skip main h1 since we already rendered it
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={i} className="text-lg font-black text-white pt-4 uppercase tracking-wider">
                    {trimmed.replace('## ', '')}
                  </h2>
                );
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={i} className="text-sm font-bold text-white pt-2 uppercase tracking-wide">
                    {trimmed.replace('### ', '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                const listItems = trimmed
                  .split(/\n[\*\-]\s+/)
                  .map(li => li.replace(/^[\*\-]\s+/, '').trim());

                return (
                  <ul key={i} className="list-disc list-inside pl-4 space-y-1.5 text-gray-400">
                    {listItems.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              }

              // Normal text: format **bold** inside
              const formattedText = trimmed.split('**').map((part, idx) => {
                if (idx % 2 === 1) {
                  return <strong key={idx} className="text-white font-bold">{part}</strong>;
                }
                return part;
              });

              return (
                <p key={i} className="leading-relaxed">
                  {formattedText}
                </p>
              );
            })}
          </div>

          {/* Share Action */}
          <div className="flex items-center justify-between gap-4 mt-12 p-5 bg-[#0F1114] border border-white/5 rounded-sm">
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-wider">Share this article</p>
              <p className="text-[9px] text-gray-500 mt-0.5 leading-normal">Help other factory owners optimize their payroll and loom operations.</p>
            </div>
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#25D366] text-black text-[10px] font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all shadow-md shadow-green-500/10"
            >
              <Send size={10} /> Share WhatsApp
            </a>
          </div>

          {/* Related Articles */}
          <div className="mt-16 pt-8 border-t border-white/6">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedPosts.map(p => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="p-5 bg-[#0F1114]/40 hover:bg-[#0F1114] border border-white/5 hover:border-white/10 rounded-sm transition-all group"
                >
                  <span className="text-[8px] font-bold uppercase text-[#60A5FA] bg-[#60A5FA]/10 px-2 py-0.5 rounded-full inline-block mb-3">
                    {p.category}
                  </span>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#60A5FA] transition-colors leading-snug uppercase tracking-wide">
                    {p.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom CTA Card */}
          <div className="mt-16 p-8 bg-[#0F1114] border border-white/8 rounded-sm text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[#60A5FA]/2 blur-[80px] pointer-events-none" />
            <h3 className="text-lg font-black text-white mb-2 uppercase tracking-wide">Modernize Your Factory Management</h3>
            <p className="text-xs text-gray-500 mb-6 max-w-lg mx-auto leading-relaxed">
              We install Noxis Hub locally on your factory system, configure it for your industry, and train your floor managers. Works 100% offline.
            </p>
            <Link
              href="https://wa.me/923264742678?text=I+saw+your+blog+and+want+a+demo+of+Noxis+Hub"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#60A5FA] text-black font-bold text-xs uppercase tracking-widest hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10 rounded-sm"
            >
              💬 Request WhatsApp Demo
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}