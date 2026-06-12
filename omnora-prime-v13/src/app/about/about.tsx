"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useSpring } from "framer-motion";
import { 
  Shield, Lock, Terminal, Cpu, Database, Mail, Globe, 
  Sparkles, MessageSquare, Code2, Layers, Smartphone, 
  Braces, ArrowLeft, ArrowRight, Menu, X, Info 
} from "lucide-react";
import { SectionReveal, FloatingOrb, GlowCard } from "@/components/ui/AnimatedComponents";

const BUILD_DATE = new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div className="bg-[#070809] text-white font-sans min-h-screen selection:bg-sandstone-gold/30 selection:text-white overflow-x-hidden relative flex flex-col justify-between">
      
      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sandstone-gold via-[#00E5FF] to-sandstone-gold z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Floating Decorative Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <FloatingOrb color="rgba(197,160,89,0.06)" size={600} x="15%" y="20%" delay={0} blur={130} />
        <FloatingOrb color="rgba(0,229,255,0.04)" size={500} x="85%" y="65%" delay={2} blur={120} />
      </div>

      {/* Top Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#070809]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-sandstone-gold/50 group-hover:bg-sandstone-gold/10 transition-colors">
              <Image 
                src="/logos/noxis.png" 
                alt="Noxis" 
                width={20} 
                height={20} 
                className="object-contain"
                priority
              />
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white group-hover:text-[#E8D5B5] transition-colors">NOXIS</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Pricing', href: '/pricing' }, 
              { label: 'Reviews', href: '/reviews' }, 
              { label: 'Blog', href: '/blog' }, 
              { label: 'Docs', href: '/docs' },
              { label: 'About', href: '/about' }
            ].map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-sm text-gray-400 hover:text-white font-medium transition-colors relative group"
              >
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
              {[
                { label: 'Pricing', href: '/pricing' }, 
                { label: 'Reviews', href: '/reviews' }, 
                { label: 'Blog', href: '/blog' }, 
                { label: 'Docs', href: '/docs' },
                { label: 'About', href: '/about' }
              ].map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="text-lg text-gray-300 hover:text-white font-semibold transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link 
                href="/download" 
                onClick={() => setMobileMenuOpen(false)} 
                className="block text-center font-bold text-sm tracking-widest uppercase text-black bg-sandstone-gold hover:bg-[#D4B77A] py-3.5 rounded-sm"
              >
                Free Trial Download
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 pt-32 pb-24 px-6 max-w-5xl mx-auto w-full flex flex-col space-y-24">
        
        {/* Section 1: Hero Identity */}
        <SectionReveal className="text-center flex flex-col items-center space-y-6">
          <div className="relative w-24 h-24 mb-4">
            <Image 
              src="/logos/noxis.png" 
              alt="Noxis Logo" 
              fill 
              className="object-contain animate-pulse"
              priority
            />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold text-sandstone-gold uppercase tracking-[0.3em]">Corporate Identity & Mission</p>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none uppercase">
              NOXIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-sandstone-gold to-[#00E5FF]">v13.0</span>
            </h1>
            <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">
              Industrial Edition — Build: {BUILD_DATE}
            </p>
          </div>
          <div className="w-16 h-[1px] bg-white/10" />
        </SectionReveal>

        {/* Section 2: Core Philosophy */}
        <SectionReveal delay={0.1}>
          <div className="glass-panel border border-white/5 p-8 md:p-12 rounded-xl bg-[#0F1114]/50 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-1 bg-gradient-to-r from-sandstone-gold to-[#00E5FF]" />
            <div className="space-y-6 text-center max-w-3xl mx-auto">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white">Engineered for the Physical Floor</h2>
              <blockquote className="text-gray-300 text-base md:text-lg leading-relaxed font-medium italic">
                "This software is specially developed, designed, and engineered for industries all around the world — not for the boardroom or a single region. Our tools are designed for the people on the factory floor: textile owners, managers, supervisors, weavers, and exporters."
              </blockquote>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto">
                Noxis is our flagship platform: a complete industrial ERP that operates 100% offline, guarantees complete data localization, speaks localized languages (including Urdu Nastaliq), and understands how modern manufacturing hubs actually operate.
              </p>
            </div>
          </div>
        </SectionReveal>

        {/* Section 3: Founder & Lead Engineer */}
        <SectionReveal delay={0.2} className="space-y-8">
          <div className="flex items-center space-x-3">
            <Terminal size={18} className="text-sandstone-gold" />
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 font-mono">The Systems Architect</h3>
          </div>
          
          <GlowCard 
            glowColor="rgba(197,160,89,0.08)"
            className="bg-[#0F1114]/60 border border-white/5 p-8 md:p-10 rounded-xl hover:border-white/10 transition-colors"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-full bg-sandstone-gold/10 border-2 border-sandstone-gold flex items-center justify-center text-3xl font-black text-sandstone-gold font-mono shadow-[0_0_25px_rgba(197,160,89,0.15)]">
                  AM
                </div>
              </div>
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight">Ahmad Mahboob</h4>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Founder & Lead Engineer, Omnora Labs</p>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400">Web Development</span>
                  <span className="px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400">Game Development</span>
                  <span className="px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400">Digital Media</span>
                  <span className="px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400">Industrial Software</span>
                  <span className="px-3 py-1 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-full text-[9px] font-bold uppercase tracking-widest text-sandstone-gold">5.5 Years Experience</span>
                </div>
                
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed font-medium">
                  Ahmad leads core product design and industrial engineering at Omnora Labs. With a professional background spanning web development, interactive game architecture, and digital media, he brings a unique approach to manufacturing systems — engineering software that is as fast and responsive as modern consumer apps, yet rugged and dependable enough for hostile industrial floors.
                </p>
              </div>
            </div>
          </GlowCard>
        </SectionReveal>

        {/* Section 4: Technical Stack Grid */}
        <SectionReveal delay={0.25} className="space-y-8">
          <div className="flex items-center space-x-3">
            <Cpu size={18} className="text-[#00E5FF]" />
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 font-mono">Engine & Middleware Stack</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TechCell icon={Globe} name="Next.js 16" />
            <TechCell icon={Layers} name="Electron Container" />
            <TechCell icon={Braces} name="React 19 Engine" />
            <TechCell icon={Database} name="Supabase Cloud" />
            <TechCell icon={Database} name="Isolated SQLite" />
            <TechCell icon={Code2} name="Drizzle ORM Layer" />
            <TechCell icon={Braces} name="TypeScript Core" />
            <TechCell icon={Cpu} name="TailwindCSS" />
            <TechCell icon={Smartphone} name="Framer Motion" />
            <TechCell icon={Terminal} name="Python Subsystems" />
            <TechCell icon={Cpu} name="OpenCV Vision" />
            <TechCell icon={Cpu} name="TensorFlow.js AI" />
            <TechCell icon={Smartphone} name="Expo SDK 51" />
            <TechCell icon={Smartphone} name="React Native app" />
            <TechCell icon={Smartphone} name="Reanimated 3" />
            <TechCell icon={Shield} name="AES-256 Protocol" />
          </div>
        </SectionReveal>

        {/* Section 5: Localization & Support Ticket Form */}
        <SectionReveal delay={0.3} className="pt-12 border-t border-white/5 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-white">Omnora Labs LLC</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  We license software and build localized local-network solutions for textile mills, rice processing units, and cold storage warehouses across South Asia and global industrial centers.
                </p>
                <div className="space-y-2 pt-2 text-[11px] text-gray-500">
                  <p>© 2026 Omnora Labs. All rights reserved.</p>
                  <p>Noxis and its logos are trademarks of Omnora Labs.</p>
                </div>
                <div className="flex space-x-6 pt-2 text-[10px] font-bold uppercase tracking-wider text-sandstone-gold">
                  <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
                  <Link href="/terms" className="hover:underline">Terms of Service</Link>
                </div>
              </div>

              <div className="h-[1px] bg-white/5" />

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-white font-mono">Operations & Support</h4>
                <div className="flex items-center space-x-3 group">
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-gray-400 group-hover:text-white transition-colors">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Inquiries & Escalations</p>
                    <a href="mailto:omnorainfo28@gmail.com" className="text-xs text-gray-300 font-bold hover:text-white transition-colors">omnorainfo28@gmail.com</a>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <SupportForm />
            </div>
          </div>
        </SectionReveal>

      </main>

      {/* Footer Navigation */}
      <footer className="border-t border-white/[0.06] bg-[#050607] py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center">
              <Image 
                src="/logos/noxis.png" 
                alt="Noxis" 
                width={14} 
                height={14} 
                className="object-contain" 
              />
            </div>
            <span className="font-extrabold text-sm tracking-wider">NOXIS</span>
            <span className="text-xs text-gray-600">by Omnora Labs</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-xs font-semibold uppercase tracking-widest text-gray-500">
            {[
              { label: 'Download', href: '/download' }, 
              { label: 'Pricing', href: '/pricing' }, 
              { label: 'Reviews', href: '/reviews' }, 
              { label: 'Blog', href: '/blog' }, 
              { label: 'Docs', href: '/docs' }, 
              { label: 'Privacy', href: '/privacy' },
              { label: 'About', href: '/about' }
            ].map((l) => (
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

    </div>
  );
}

function TechCell({ icon: Icon, name }: { icon: any, name: string }) {
  return (
    <div className="flex items-center space-x-3 px-4 py-3 bg-[#0F1114]/40 border border-white/5 rounded-sm hover:bg-white/[0.03] hover:border-white/10 transition-all group">
      <Icon size={14} className="text-gray-500 group-hover:text-sandstone-gold transition-colors" />
      <span className="text-[10px] font-mono font-medium text-gray-400 uppercase tracking-tight">{name}</span>
    </div>
  );
}

const SupportForm = () => {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Software Feedback",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      const response = await fetch("https://formspree.io/f/xvgzkpee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", phone: "", subject: "Software Feedback", message: "" });
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#0C0E12] border border-white/5 p-6 rounded-lg space-y-4 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-sandstone-gold/40" />
      <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2 flex items-center">
        <Mail size={14} className="text-sandstone-gold mr-2 animate-pulse" />
        Submit Support Ticket
      </h4>
      <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
        Submit feedback, feature requests, or license upgrading inquiries directly to Omnora Labs support engineers.
      </p>

      {status === "success" ? (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
          <div className="w-10 h-10 bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] flex items-center justify-center rounded-full text-lg">
            ✓
          </div>
          <h5 className="text-[10px] font-black text-white uppercase tracking-tight">Support Ticket Received</h5>
          <p className="text-[9px] text-slate-500 max-w-xs leading-relaxed font-semibold">
            Thank you! Your ticket has been logged with Formspree. Our team will review the system parameters and email you.
          </p>
          <button 
            type="button" 
            onClick={() => setStatus("idle")} 
            className="text-[9px] font-black text-sandstone-gold uppercase tracking-widest hover:underline pt-2"
          >
            Create new ticket
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#080A0C] border border-white/5 focus:border-sandstone-gold focus:outline-none px-3 py-2 text-[10px] text-white uppercase tracking-wider font-semibold rounded-none transition-colors"
                placeholder="YOUR NAME"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#080A0C] border border-white/5 focus:border-sandstone-gold focus:outline-none px-3 py-2 text-[10px] text-white font-mono rounded-none transition-colors"
                placeholder="you@factory.com"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Phone / WhatsApp</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#080A0C] border border-white/5 focus:border-sandstone-gold focus:outline-none px-3 py-2 text-[10px] text-white font-mono rounded-none transition-colors"
                placeholder="+923000000000"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-[#080A0C] border border-white/5 focus:border-sandstone-gold focus:outline-none px-3 py-2 text-[10px] text-white uppercase tracking-wider font-semibold rounded-none transition-colors"
              >
                <option value="Software Feedback">Software Feedback</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Report Bug / Anomaly">Report Bug / Anomaly</option>
                <option value="Hardware Integration">Hardware Integration</option>
                <option value="Upgrade Inquiry">Upgrade Inquiry</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Support Request Details</label>
            <textarea
              required
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-[#080A0C] border border-white/5 focus:border-sandstone-gold focus:outline-none px-3 py-2 text-[10px] text-white tracking-wider rounded-none transition-colors resize-none"
              placeholder="SPECIFY SYSTEM DETAILS, OR ANY ISSUES ENCOUNTERED..."
            />
          </div>

          {status === "error" && (
            <div className="text-[9px] font-black text-[#EF4444] uppercase tracking-widest bg-[#EF4444]/5 p-2 border border-[#EF4444]/20 text-center">
              ⚠️ Transmission failed. Please email omnorainfo28@gmail.com instead.
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-sandstone-gold text-black py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.01] hover:bg-[#D4B77A] disabled:opacity-50 transition-all cursor-pointer"
          >
            {status === "submitting" ? "Transmitting Support Ticket..." : "Submit Support Ticket"}
          </button>
        </>
      )}
    </form>
  );
};
