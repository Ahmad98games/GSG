'use client';

import { useState } from 'react';
import PublicNavbar from '@/components/shell/PublicNavbar';
import { 
  Download, CheckCircle2, ShieldCheck, Monitor, HardDrive, 
  Layers, Smartphone, Users, FileText, ArrowRight,
  Sparkles, Key, Check, HelpCircle, MessageCircle, ChevronDown
} from 'lucide-react';
import Link from 'next/link';

const DOWNLOAD_EXE_URL = '/api/download-software?trial=true&redirect=true';

const FAQS = [
  {
    q: "Do I need internet to use Noxis Hub?",
    a: "No. Noxis Hub stores all data locally on your PC. Internet is optional for cloud backup. You can run forever offline."
  },
  {
    q: "Is my data safe if I stop paying?",
    a: "Yes. Your data is never deleted. The Free plan keeps all your existing data accessible forever."
  },
  {
    q: "Can I use it on multiple computers?",
    a: "One license is for one PC. For additional PCs contact us on WhatsApp. Each PC gets its own license."
  },
  {
    q: "How do mobile devices connect?",
    a: "The Noxis Mobile app connects to your PC via WiFi. Up to 50 phones can connect simultaneously on Elite."
  },
  {
    q: "What if my PC dies or I get a new one?",
    a: "WhatsApp us with your new HWID. License transfer is free and takes 5 minutes. Your data can be restored from cloud backup."
  }
];

export default function DownloadPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#07090B] text-slate-300 font-inter selection:bg-[#C5A059] selection:text-black">
      <PublicNavbar />

      {/* ══════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-20 px-6 sm:px-12 max-w-6xl mx-auto text-center space-y-6">
        {/* Glow ambient */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[280px] bg-[#C5A059]/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-[10px] font-mono font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(197,160,89,0.2)]">
          <Sparkles size={12} />
          <span>Complete 14-Day Free Access</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-3xl mx-auto leading-tight">
          Download Noxis Hub Free
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
          14-day Elite trial. No credit card. No registration. Your data stays even after trial.
        </p>

        {/* Big Download Button */}
        <div className="pt-4 space-y-3">
          <a
            href={DOWNLOAD_EXE_URL}
            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#C5A059] hover:bg-[#D4B06A] text-black font-black uppercase tracking-wider text-sm rounded-sm transition-all shadow-[0_4px_30px_rgba(197,160,89,0.35)] transform hover:-translate-y-0.5"
          >
            <Download size={20} />
            <span>Download for Windows</span>
          </a>

          <p className="text-xs text-zinc-400 font-mono">
            Version 13.0.1 · 86MB · Windows 10/11 64-bit
          </p>

          <p className="text-[11px] text-zinc-600 font-mono">
            Mac and Linux versions coming Q3 2026
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHAT YOU GET IN TRIAL (FEATURE MATRIX)
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 sm:px-12 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            What You Get in Trial
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Compare plans. During your 14-day trial, you experience full Elite access.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-white/10 rounded-lg overflow-hidden bg-[#0D0F14]">
            <thead>
              <tr className="border-b border-white/10 bg-black/60 text-xs font-black uppercase tracking-wider">
                <th className="p-4 text-zinc-400">Feature</th>
                <th className="p-4 text-zinc-400">Free Plan</th>
                <th className="p-4 text-zinc-400">Lite Plan</th>
                <th className="p-4 bg-[#C5A059]/15 text-[#C5A059] border-x border-[#C5A059]/40 relative">
                  <div className="flex items-center justify-between">
                    <span>Elite Plan</span>
                    <span className="text-[9px] bg-[#C5A059] text-black px-2 py-0.5 rounded font-black tracking-widest uppercase">
                      Your 14-day access
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {[
                { feature: 'POS Counter & Thermal Printing', free: 'Basic (Included)', lite: 'Full', elite: 'Full' },
                { feature: 'Inventory SKU Limit', free: '100 SKUs', lite: 'Unlimited', elite: 'Unlimited' },
                { feature: 'Customer & Supplier Accounts', free: '30 Parties', lite: 'Unlimited', elite: 'Unlimited' },
                { feature: 'Karigar Payroll & Piece-Rate', free: 'Manual Log only', lite: 'Automated Runs', elite: 'Automated Runs' },
                { feature: 'WhatsApp Invoice Automation', free: '—', lite: 'Included', elite: 'Included' },
                { feature: 'PDF & Excel Report Exports', free: '—', lite: 'Included', elite: 'Included' },
                { feature: 'CCTV Camera Feeds', free: '—', lite: '2 Cameras', elite: '6 Cameras with AI Sentinel' },
                { feature: 'Foresight AI Predictions', free: '—', lite: '—', elite: 'Full Engine' },
                { feature: 'Mobile Devices Paired', free: '1 Device', lite: '5 Devices', elite: '50 Devices' },
                { feature: 'Data Retention Guarantee', free: 'Forever (100% safe)', lite: 'Forever (100% safe)', elite: 'Forever (100% safe)' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-semibold text-white">{row.feature}</td>
                  <td className="p-4 text-zinc-400">{row.free}</td>
                  <td className="p-4 text-zinc-300">{row.lite}</td>
                  <td className="p-4 bg-[#C5A059]/5 border-x border-[#C5A059]/20 font-bold text-[#C5A059]">
                    <div className="flex items-center gap-1.5">
                      <Check size={14} className="text-[#C5A059]" />
                      <span>{row.elite}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHAT HAPPENS AFTER 14 DAYS
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 sm:px-12 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            What Happens After 14 Days
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            No surprise billing. No lockouts. Seamless transition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-[#0E1015] border border-cyan-500/30 rounded-lg space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">
              Day 1–14
            </span>
            <h3 className="text-lg font-bold text-white">
              Full Elite Access
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every advanced module is unlocked: fast POS, Karigar piece-rate payroll, CCTV RTSP feeds, mobile companion devices, and AI predictions.
            </p>
          </div>

          <div className="p-6 bg-[#0E1015] border border-emerald-500/30 rounded-lg space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
              Day 14+
            </span>
            <h3 className="text-lg font-bold text-white">
              Automatic Free Plan
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No interruption to POS counter. No data deleted. Ever. Your Khata ledger, basic reports, and historical records remain accessible on your PC.
            </p>
          </div>
        </div>

        <div className="p-4 bg-black/60 border border-white/5 rounded-sm text-center">
          <p className="text-xs font-bold text-zinc-300">
            🔒 No interruption to POS. No data deleted. Ever.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW TO UPGRADE (3 STEPS)
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 sm:px-12 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            How Upgrading Works
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Works offline. Activates in 30 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#0D0F14] border border-white/10 rounded-lg space-y-2.5">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/15 flex items-center justify-center font-mono font-bold text-xs text-white">
              1
            </div>
            <h4 className="text-sm font-bold text-white">Step 1: Open Settings → License</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Navigate to the License tab in your desktop app to view your machine's unique identifier.
            </p>
          </div>

          <div className="p-6 bg-[#0D0F14] border border-white/10 rounded-lg space-y-2.5">
            <div className="w-8 h-8 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center font-mono font-bold text-xs text-[#25D366]">
              2
            </div>
            <h4 className="text-sm font-bold text-white">Step 2: Copy HWID & WhatsApp Us</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Click the Copy HWID button and message Omnora Labs with your selected plan (Lite, Pro, or Elite).
            </p>
          </div>

          <div className="p-6 bg-[#0D0F14] border border-white/10 rounded-lg space-y-2.5">
            <div className="w-8 h-8 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center font-mono font-bold text-xs text-[#C5A059]">
              3
            </div>
            <h4 className="text-sm font-bold text-white">Step 3: Receive Key, Paste, Done</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Paste the RSA-signed key into your app. Activation is instant and works 100% offline.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SOCIAL PROOF SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 sm:px-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-8 bg-[#0D0F14] border border-white/10 rounded-xl text-center">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-white font-mono">140+</p>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Businesses in Pakistan & UAE Running Noxis
            </p>
          </div>
          <div className="space-y-1 sm:border-x sm:border-white/10">
            <p className="text-3xl sm:text-4xl font-black text-[#C5A059] font-mono">1,200+</p>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Karigars & Workers Tracked Monthly
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono">45,000+</p>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Invoices Generated Safely Offline
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 sm:px-12 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Clear, honest answers about privacy, offline storage, and licensing.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="border border-white/10 rounded-sm bg-[#0D0F14] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-sm font-bold text-white hover:bg-white/[0.02] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180 text-[#C5A059]' : 'text-zinc-500'}`} />
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-zinc-400 leading-relaxed border-t border-white/5 bg-black/20">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-6 sm:px-12 text-center border-t border-white/10 max-w-4xl mx-auto space-y-4">
        <h3 className="text-2xl font-black text-white">Ready to streamline your operations?</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Start your 14-day Elite trial now. No payment information required.
        </p>
        <a
          href={DOWNLOAD_EXE_URL}
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#C5A059] hover:bg-[#D4B06A] text-black font-black uppercase tracking-wider text-xs rounded-sm transition-all shadow-[0_4px_20px_rgba(197,160,89,0.3)]"
        >
          <Download size={16} />
          <span>Download Noxis Hub (Windows)</span>
        </a>
      </section>
    </div>
  );
}
