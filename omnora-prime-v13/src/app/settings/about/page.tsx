"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Info, Shield, ExternalLink, Mail, 
  Globe, Code2, Cpu, Database, 
  Layers, Smartphone, Braces, Terminal
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { useSidebarState } from "@/hooks/useSidebarState";

const BUILD_DATE = new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

export default function AboutPage() {
  const { isCollapsed } = useSidebarState();
  

  return (
    <div className="min-h-screen bg-[#080A0C] text-slate-200 font-inter flex overflow-x-hidden">
      
      
      <main className={cn( "flex-1 transition-all duration-300 min-h-screen flex flex-col items-center")}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-3xl px-8 py-20 space-y-24"
        >
          
          {/* SECTION 1: Product Identity */}
          <section className="flex flex-col items-center text-center space-y-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative w-32 h-32"
            >
              <Image 
                src="/logos/noxis.png" 
                alt="Noxis Logo" 
                fill 
                className="object-contain"
                priority
              />
            </motion.div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-[0.5em] text-white uppercase">Noxis</h1>
              <p className="text-[11px] font-bold text-electric-blue uppercase tracking-[0.3em]">
                v13.0 — Industrial Edition
              </p>
              <p className="text-[9px] text-gray-600 font-mono uppercase tracking-widest">
                Build: {BUILD_DATE}
              </p>
            </div>
            <div className="w-16 h-px bg-white/10" />
          </section>

          {/* SECTION 2: Built By */}
          <section className="space-y-12">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative w-20 h-10">
                <Image 
                  src="/logos/omnoralabs.png" 
                  alt="Omnora Labs Logo" 
                  fill 
                  className="object-contain opacity-80"
                />
              </div>
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white">Omnora Labs</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest -mt-4">
                Industrial Software Engineering
              </p>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-400 text-sm leading-relaxed text-center font-medium max-w-2xl mx-auto italic">
                "This software is specially developed , Designed and engineered for industries all around the World , not  for the boardroom and single region . Our tools are designed for the people who are related to Industry Eg : textile owners, managers, supervisors, workers, garment exporters All Around the world.
                <br /><br />
                Noxis is our flagship platform — a complete industrial ERP that works without the internet, speaks your language, and understands how South Asian and international industrial and business actually operate."
              </p>
            </div>
          </section>

          {/* SECTION 3: Founder */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3 mb-6">
              <Terminal size={16} className="text-gray-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">The Architect</h3>
            </div>
            
            <div className="glass-panel border border-white/5 p-8 rounded-sm flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 hover:border-white/10 transition-colors group">
              <div className="shrink-0">
                <div className="w-20 h-20 rounded-full bg-electric-blue/10 border-2 border-electric-blue flex items-center justify-center text-2xl font-black text-electric-blue font-mono shadow-[0_0_20px_rgba(0,183,255,0.2)]">
                  AM
                </div>
              </div>
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Ahmad Mahboob</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Founder & Lead Engineer, Omnora Labs</p>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <Pill>Web Development</Pill>
                  <Pill>Game Development</Pill>
                  <Pill>Digital Media</Pill>
                  <Pill>Industrial Software</Pill>
                  <Pill className="border-electric-blue/20 text-electric-blue">5.5 Years Experience</Pill>
                </div>
                
                <p className="text-gray-500 text-[11px] leading-relaxed font-medium">
                  Ahmad leads product and engineering at Omnora Labs. With 5.5 years across web development, game development, and digital media, he brings a unique perspective to industrial software — building tools that are as fast and intuitive as consumer apps but as reliable as enterprise systems.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 4: Technical Stack */}
          <section className="space-y-10">
             <div className="flex items-center space-x-3 mb-6">
              <Cpu size={16} className="text-gray-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Core Engine Stack</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <TechItem icon={Globe} name="Next.js 16" />
              <TechItem icon={Layers} name="Electron" />
              <TechItem icon={Braces} name="React 19" />
              <TechItem icon={Database} name="Supabase" />
              <TechItem icon={Database} name="SQLite" />
              <TechItem icon={Code2} name="Drizzle ORM" />
              <TechItem icon={Braces} name="TypeScript" />
              <TechItem icon={Cpu} name="TailwindCSS" />
              <TechItem icon={Smartphone} name="Framer Motion" />
              <TechItem icon={Terminal} name="Python" />
              <TechItem icon={Cpu} name="OpenCV" />
              <TechItem icon={Cpu} name="TensorFlow.js" />
              <TechItem icon={Smartphone} name="Expo SDK 51" />
              <TechItem icon={Smartphone} name="React Native" />
              <TechItem icon={Smartphone} name="Reanimated 3" />
            </div>
          </section>

          {/* SECTION 5: Legal & Contact */}
          <section className="pt-12 border-t border-white/5 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Legal</h4>
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-600 font-medium">© 2025 Omnora Labs. All rights reserved.</p>
                  <p className="text-[10px] text-gray-600 font-medium">Noxis is a trademark of Omnora Labs.</p>
                </div>
                <div className="flex space-x-4 pt-2">
                  <Link href="/privacy" className="text-[10px] text-electric-blue font-bold uppercase tracking-widest hover:underline">Privacy Policy</Link>
                  <Link href="/terms" className="text-[10px] text-electric-blue font-bold uppercase tracking-widest hover:underline">Terms of Service</Link>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Contact & Support</h4>
                <div className="space-y-3">
                  <ContactLink icon={Mail} label="Support" email="omnorainfo28@gmail.com" />
                  <ContactLink icon={Shield} label="Sales" email="omnorainfo28@gmail.com" />
                </div>
              </div>
            </div>
            
            <div className="text-center pt-12">
               <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.5em]">Engineered for Industry</p>
            </div>
          </section>

        </motion.div>
      </main>
    </div>
  );
}

function Pill({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn(
      "px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400",
      className
    )}>
      {children}
    </span>
  );
}

function TechItem({ icon: Icon, name }: { icon: any, name: string }) {
  return (
    <div className="flex items-center space-x-3 px-4 py-3 bg-white/[0.01] border border-white/[0.03] rounded-sm hover:bg-white/[0.03] transition-all group">
      <Icon size={14} className="text-gray-600 group-hover:text-electric-blue transition-colors" />
      <span className="text-[10px] font-mono font-medium text-gray-500 uppercase tracking-tight">{name}</span>
    </div>
  );
}

function ContactLink({ icon: Icon, label, email }: { icon: any, label: string, email: string }) {
  return (
    <div className="flex items-center space-x-3 group">
      <div className="p-2 bg-white/5 rounded-sm text-gray-500 group-hover:text-white transition-colors">
        <Icon size={14} />
      </div>
      <div>
        <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">{label}</p>
        <a href={`mailto:${email}`} className="text-[10px] text-gray-400 font-bold hover:text-white transition-colors">{email}</a>
      </div>
    </div>
  );
}
