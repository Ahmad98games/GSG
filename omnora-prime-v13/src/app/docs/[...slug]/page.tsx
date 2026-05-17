import React from "react";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { BookOpen, ShieldCheck, Zap, Layers, Terminal, Globe, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import BackButton from "@/components/docs/BackButton";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  const title = slug ? slug.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ") : "Documentation Hub";

  // Attempt to load content
  let content = null;
  if (slug && slug.length > 0) {
    const filePath = path.join(process.cwd(), "src", "app", "docs", ...slug) + ".mdx";
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, "utf8");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0F1113]">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <BackButton />

           <div className="flex items-center space-x-3">
              <BookOpen size={18} className="text-electric-blue" />
              <h1 className="text-sm font-black uppercase tracking-widest text-white">{title}</h1>
           </div>
        </header>

        <div className="p-12 max-w-4xl mx-auto w-full space-y-12">
           {!content ? (
             <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 flex items-center justify-center text-red-500 rounded-full">
                   <ShieldCheck size={40} />
                </div>
                <div className="space-y-2">
                   <h2 className="text-3xl font-black uppercase tracking-tighter">Document <span className="text-gray-600">Not Found</span></h2>
                   <p className="text-gray-400 max-w-sm mx-auto">
                      The requested technical protocol does not exist or has been relocated to a different sector.
                   </p>
                </div>
                <Link href="/docs" className="px-8 py-3 bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-[0.2em] hover:bg-white/10 transition-all">
                   Back to Documentation Index
                </Link>
             </div>
           ) : (
             <article className="prose prose-invert prose-blue max-w-none">
                {parseSimpleMarkdown(content)}
             </article>
           )}
        </div>
    </div>
  );
}

function parseSimpleMarkdown(text: string) {
  let isCodeBlock = false;
  let codeBuffer: string[] = [];

  return text.split('\n').map((rawLine, i) => {
    const line = rawLine.trim();

    // Handle Code Blocks
    if (line.startsWith('```')) {
      if (!isCodeBlock) {
        isCodeBlock = true;
        codeBuffer = [];
        return null;
      } else {
        isCodeBlock = false;
        const code = codeBuffer.join('\n');
        return (
          <div key={i} className="my-8 bg-[#0F1113] border border-white/5 rounded-sm overflow-hidden group">
             <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Source Protocol</span>
                <Terminal size={10} className="text-gray-600" />
             </div>
             <pre className="p-6 text-xs font-mono text-electric-blue overflow-x-auto leading-relaxed">
                <code>{code}</code>
             </pre>
          </div>
        );
      }
    }

    if (isCodeBlock) {
      codeBuffer.push(rawLine);
      return null;
    }

    if (line.startsWith('# ')) return <h1 key={i} className="text-5xl font-black uppercase tracking-tighter text-white mb-12 border-b-2 border-white/5 pb-6">{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={i} className="text-3xl font-bold text-white mt-16 mb-8 uppercase tracking-tight flex items-center"><span className="w-8 h-px bg-electric-blue mr-4" />{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-black uppercase tracking-widest text-electric-blue mt-10 mb-6">{line.slice(4)}</h3>;
    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-8 list-disc text-gray-300 mb-3 pl-2 text-sm font-medium marker:text-electric-blue">{renderText(line.slice(2))}</li>;
    if (/^\d+\. /.test(line)) return <li key={i} className="ml-8 list-decimal text-gray-300 mb-3 pl-2 text-sm font-medium marker:text-gray-600 marker:font-bold">{renderText(line.replace(/^\d+\. /, ''))}</li>;
    
    // Special Blocks: DIAGRAM
    if (line.includes('[DIAGRAM]:')) {
      const steps = line.split('[DIAGRAM]:')[1].split('->').map(s => s.trim());
      return (
        <div key={i} className="my-10 p-10 bg-white/[0.02] border border-white/5 rounded-sm shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Globe size={100} />
          </div>
          <div className="flex items-center space-x-3 mb-8">
            <Zap className="text-electric-blue" size={16} />
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-500">Automated Workflow Matrix</h4>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {steps.map((step, si) => (
              <React.Fragment key={si}>
                <div className="px-8 py-4 bg-onyx border border-white/10 text-xs font-black text-white uppercase tracking-widest shadow-2xl hover:border-electric-blue/40 transition-all">
                  {step}
                </div>
                {si < steps.length - 1 && <ArrowRight size={16} className="text-gray-700 animate-pulse" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    }

    if (line.startsWith('> ')) {
      const isImportant = line.includes('[IMPORTANT]');
      const isTip = line.includes('[TIP]');
      return (
        <div key={i} className={cn(
          "ml-4 border-l-4 pl-8 py-6 mb-8 text-sm font-medium leading-relaxed italic",
          isImportant ? "border-red-500 bg-red-500/5 text-red-200" : 
          isTip ? "border-emerald-500 bg-emerald-500/5 text-emerald-200" :
          "border-electric-blue bg-electric-blue/5 text-gray-300"
        )}>
           {renderText(line.slice(2).replace('[IMPORTANT]', '').replace('[TIP]', ''))}
        </div>
      );
    }

    if (line === '') return <div key={i} className="h-6" />;
    
    return <p key={i} className="text-gray-400 leading-relaxed mb-6 text-base font-medium">{renderText(rawLine)}</p>;
  }).filter(el => el !== null);
}

function renderText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/);
  return parts.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={j} className="px-1.5 py-0.5 bg-white/10 rounded-sm font-mono text-xs text-electric-blue">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export async function generateStaticParams() {
  const docsDir = path.join(process.cwd(), "src", "app", "docs");
  const params: { slug: string[] }[] = [];

  function walk(dir: string, baseSlug: string[] = []) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name === "[...slug]") continue;
        walk(path.join(dir, entry.name), [...baseSlug, entry.name]);
      } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
        const nameWithoutExt = entry.name.slice(0, -4);
        params.push({
          slug: [...baseSlug, nameWithoutExt],
        });
      }
    }
  }

  walk(docsDir);
  return params;
}
