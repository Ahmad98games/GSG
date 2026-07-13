"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Landmark, AlertCircle, Calendar, ShieldCheck, Mail, ArrowLeft, ChevronRight, HelpCircle, PhoneCall } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface RefundSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

export default function RefundPolicyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07080A] flex items-center justify-center text-gray-500 uppercase tracking-widest text-[10px] font-mono">Loading Refund Policy...</div>}>
      <RefundContent />
    </Suspense>
  );
}

function RefundContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  const [activeSection, setActiveSection] = useState('guarantee');

  const returnHref = source === 'hub' ? '/dashboard' : '/';
  const returnLabel = source === 'hub' ? 'Return to Hub' : 'Back to Home';

  const sections: RefundSection[] = [
    {
      id: "guarantee",
      icon: <ShieldCheck className="w-4 h-4" />,
      title: "1. 14-Day Money Back Guarantee",
      content: (
        <div className="space-y-4">
          <p>
            We want you to be completely satisfied with Noxis Hub. We offer a <strong className="text-white">14-day money back guarantee</strong> on all software license plans (Lite, Pro, and Elite).
          </p>
          <p>
            If Noxis Hub does not meet your business expectations, or if you experience technical issues that we cannot resolve, you can request a full refund of your software purchase price within 14 calendar days of your initial payment.
          </p>
          <p className="text-slate-400">
            No refund requests will be accepted after the 14-day period has expired. We encourage you to utilize our 14-day free trial before purchasing to ensure the software matches your hardware and workflow.
          </p>
        </div>
      ),
    },
    {
      id: "request",
      icon: <PhoneCall className="w-4 h-4" />,
      title: "2. How to Request a Refund",
      content: (
        <div className="space-y-4">
          <p>
            To initiate a refund request, you must submit a ticket or message us directly via our support channels. We require requests to be submitted through <strong className="text-white">WhatsApp</strong> to verify identity and ensure rapid processing:
          </p>
          <div className="bg-white/[0.02] border border-white/[0.04] rounded p-4 space-y-3">
            <p className="text-white font-bold text-xs uppercase tracking-widest">WhatsApp Support Numbers</p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between border-b border-white/[0.02] pb-2">
                <span>Primary WhatsApp Support:</span>
                <a href="https://wa.me/923334355475" className="text-[#C5A059] font-bold hover:underline">+92 333 435 5475</a>
              </li>
              <li className="flex justify-between">
                <span>Secondary WhatsApp Support:</span>
                <a href="https://wa.me/923264742678" className="text-[#C5A059] font-bold hover:underline">+92 326 474 2678</a>
              </li>
            </ul>
          </div>
          <p>
            Please provide your <strong className="text-white">Registered Business Email</strong>, the <strong className="text-white">License Key</strong>, and the invoice or transaction receipt number with your message. You may also email our dedicated support desk at <a href="mailto:support@noxis.app" className="text-[#C5A059] hover:underline">support@noxis.app</a> to log the request.
          </p>
        </div>
      ),
    },
    {
      id: "coverage",
      icon: <Landmark className="w-4 h-4" />,
      title: "3. What Refunds Cover",
      content: (
        <div className="space-y-4">
          <p>
            It is critical to distinguish between software licensing costs and implementation services:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#0A100A]/40 border border-emerald-500/10 rounded p-4 space-y-2">
              <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">Eligible for Refund (Covered)</p>
              <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                <li>Lite license fees</li>
                <li>Pro license fees</li>
                <li>Elite license fees</li>
                <li>Annual maintenance renewals</li>
              </ul>
            </div>
            <div className="bg-[#100A0A]/40 border border-red-500/10 rounded p-4 space-y-2">
              <p className="text-red-400 font-bold text-xs uppercase tracking-widest">Non-Refundable (Not Covered)</p>
              <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                <li>Custom data migration services</li>
                <li>On-site hardware setups</li>
                <li>Karigar training & consulting fees</li>
                <li>Transaction / Gateway processing fees</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "processing",
      icon: <Calendar className="w-4 h-4" />,
      title: "4. Processing Time",
      content: (
        <div className="space-y-4">
          <p>
            Once a refund is approved by our team, we will process the transaction back to your original payment method.
          </p>
          <ul className="space-y-2 list-none">
            <li className="flex gap-3">
              <span className="text-[#C5A059] mt-1">▸</span>
              <span><strong className="text-white">Processing window:</strong> It takes <strong className="text-white">3 to 5 business days</strong> for the funds to leave our account.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#C5A059] mt-1">▸</span>
              <span><strong className="text-white">Bank clearance:</strong> Depending on your banking institution (or mobile wallet such as EasyPaisa or JazzCash), it may take an additional 1 to 3 business days for the funds to clear into your account.</span>
            </li>
          </ul>
          <p className="text-slate-400">
            You will receive a confirmation PDF receipt via WhatsApp/Email when the refund is processed on our end.
          </p>
        </div>
      ),
    },
    {
      id: "contact",
      icon: <Mail className="w-4 h-4" />,
      title: "5. Contact & Support",
      content: (
        <div className="space-y-4">
          <p>For any refund inquiries or billing disputes, reach out to our specific departments:</p>
          <div className="grid gap-4 mt-4">
            <div className="border border-white/[0.04] bg-[#0A0D10]/40 p-4 rounded space-y-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block font-mono">Support & General Contact</span>
              <p className="text-xs text-slate-400">For customer assistance, billing queries, and refund submissions, write to our support desk:</p>
              <a href="mailto:support@noxis.app" className="text-[#C5A059] font-extrabold text-sm hover:underline font-mono">support@noxis.app</a>
            </div>
            
            <div className="border border-white/[0.04] bg-[#0A0D10]/40 p-4 rounded space-y-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block font-mono">Legal & Compliance</span>
              <p className="text-xs text-slate-400">For EULA compliance, licensing terms verification, and dispute resolution, contact our legal desk:</p>
              <a href="mailto:legal@noxishub.app" className="text-[#C5A059] font-extrabold text-sm hover:underline font-mono">legal@noxishub.app</a>
            </div>

            <div className="border border-white/[0.04] bg-[#0A0D10]/40 p-4 rounded space-y-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block font-mono">Main Corporate Office</span>
              <p className="text-xs text-slate-400">For corporate partnerships, vendor contracts, or business owner inquiries, contact Omnora Labs:</p>
              <a href="mailto:omnora@noxishub.app" className="text-[#C5A059] font-extrabold text-sm hover:underline font-mono">omnora@noxishub.app</a>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: '#040608', color: '#94A3B8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 relative">

          {/* Left Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Link href={returnHref} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
              <ArrowLeft className="w-3 h-3" />
              {returnLabel}
            </Link>

            <div className="lg:sticky lg:top-10 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Contents</p>
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSection(s.id);
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-left transition-all text-xs font-medium ${activeSection === s.id ? 'text-white bg-white/[0.04] border border-white/[0.06]' : 'text-slate-500 hover:text-white hover:bg-white/[0.02]'}`}
                  >
                    <span className={activeSection === s.id ? 'text-[#C5A059]' : 'text-slate-600'}>{s.icon}</span>
                    <span>{s.title}</span>
                    {activeSection === s.id && <ChevronRight className="w-3 h-3 ml-auto text-[#C5A059]" />}
                  </button>
                ))}
              </div>

              <div className="bg-[#0A0D10] border border-white/[0.04] p-4 rounded space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Last Updated</p>
                <p className="text-white font-bold text-sm">July 13, 2026</p>
              </div>

              <div className="bg-[#0A0D10] border border-white/[0.04] p-5 rounded flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600">
                <span>REFUND SECURED</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8 space-y-16 z-10">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest bg-[#C5A059]/10 border border-[#C5A059]/20 px-3 py-1 rounded-full">
                14-Day Money Back Guarantee
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none uppercase">
                Refund <span className="text-[#C5A059]">Policy</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                Last updated July 13, 2026. This policy outlines eligibility for software licensing refunds, request procedures via WhatsApp, coverage exceptions, and processing timelines.
              </p>
            </motion.div>

            <div className="space-y-16">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="pt-12 border-t border-white/[0.05] scroll-mt-28">
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white tracking-tight uppercase flex items-center gap-3">
                      <span className="text-[#C5A059] font-mono text-sm">0{sections.indexOf(section) + 1}.</span>
                      {section.title.split('. ').slice(1).join('. ')}
                    </h2>
                    <div className="text-sm text-[#94A3B8] leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                      {section.content}
                    </div>
                  </div>
                </section>
              ))}
            </div>

            {/* Footer */}
            <footer className="pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-slate-600">
              <span>Noxis Hub Refund Policy v13.0</span>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                <span>© {new Date().getFullYear()} Omnora Labs</span>
              </div>
            </footer>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'JetBrains+Mono', monospace; }
        body { background-color: #040608; }
      `}</style>
    </div>
  );
}
