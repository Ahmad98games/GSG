"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Key, Shield, Ban, Database, Scale, MapPin, MessageSquare, Mail, ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface TermsSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

export default function TermsOfServicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07080A] flex items-center justify-center text-gray-500 uppercase tracking-widest text-[10px] font-mono">Loading Terms of Service...</div>}>
      <TermsContent />
    </Suspense>
  );
}

function TermsContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  const [activeSection, setActiveSection] = useState('product');

  const returnHref = source === 'hub' ? '/dashboard' : '/';
  const returnLabel = source === 'hub' ? 'Return to Hub' : 'Back to Home';

  const sections: TermsSection[] = [
    {
      id: "product",
      icon: <FileText className="w-4 h-4" />,
      title: "1. What Is Noxis Hub",
      content: (
        <div className="space-y-4">
          <p>
            Noxis Hub is a proprietary, offline-first Enterprise Resource Planning (ERP) software application developed and maintained by <strong className="text-white">Omnora Labs</strong>, a software development company based in Lahore, Pakistan.
          </p>
          <p>
            Noxis Hub is designed specifically for manufacturing and industrial businesses operating in Pakistan, UAE, Saudi Arabia, Bangladesh, and other markets. The software operates as a Windows desktop application (the "Hub") that stores all business data locally on the customer's hardware and optionally syncs to Supabase cloud for backup and multi-device access.
          </p>
          <p className="text-slate-400">
            By downloading, installing, activating, or otherwise using Noxis Hub, you ("the Customer" or "Licensee") agree to be bound by these Terms of Service. If you do not agree, you must immediately uninstall the software and contact <a href="mailto:support@noxis.app" className="text-[#C5A059] hover:underline">support@noxis.app</a> to request a refund within 14 days of purchase.
          </p>
        </div>
      ),
    },
    {
      id: "license",
      icon: <Key className="w-4 h-4" />,
      title: "2. License Tiers & Inclusions",
      content: (
        <div className="space-y-4">
          <p>Noxis Hub is sold as a perpetual software license with an optional annual maintenance subscription. The following tiers are available:</p>
          <div className="space-y-3">
            {[
              { tier: "Trial", desc: "14-day free trial with full feature access. No payment required. Trial data is preserved if you upgrade.", limit: "1 device, watermarked exports" },
              { tier: "Lite", desc: "Core ERP features: Invoicing, Ledger (Khata), basic Inventory, and Karigar attendance.", limit: "1 device, up to 2 staff accounts" },
              { tier: "Pro", desc: "All Lite features plus: Advanced Inventory, Production Tracking, Payroll, Client Portal, and WhatsApp Messaging.", limit: "Up to 3 devices, up to 10 staff accounts" },
              { tier: "Elite", desc: "All Pro features plus: Multi-branch support, CCTV Sentinel module, custom report builder, and priority support SLA.", limit: "Up to 10 devices, unlimited staff accounts" },
            ].map((t) => (
              <div key={t.tier} className="bg-white/[0.02] border border-white/[0.04] rounded p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">{t.tier}</span>
                  <span className="text-[10px] text-slate-500 font-mono bg-white/[0.03] px-2 py-0.5 rounded">{t.limit}</span>
                </div>
                <p className="text-xs text-slate-400">{t.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-xs">
            License prices are listed at <Link href="/pricing" className="text-[#C5A059] hover:underline">noxishub.app/pricing</Link>. Prices are subject to change; existing customers are grandfathered at their purchase price for 12 months.
          </p>
        </div>
      ),
    },
    {
      id: "acceptable-use",
      icon: <Shield className="w-4 h-4" />,
      title: "3. Acceptable Use",
      content: (
        <div className="space-y-4">
          <p>Noxis Hub is licensed for <strong className="text-white">lawful commercial business operations only</strong>. You agree that you will use Noxis Hub only to manage legitimate business activities including but not limited to:</p>
          <ul className="space-y-2 list-none">
            {[
              "Managing invoices, purchase orders, and customer payments",
              "Tracking inventory, raw materials, and finished goods",
              "Recording worker attendance and calculating lawful wages",
              "Managing business ledgers and cash flow",
              "Generating tax-compliant invoices and reports",
              "Monitoring CCTV recordings for business security",
            ].map((use) => (
              <li key={use} className="flex gap-3 text-slate-400">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>{use}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: "prohibited",
      icon: <Ban className="w-4 h-4" />,
      title: "4. Prohibited Uses",
      content: (
        <div className="space-y-4">
          <p>The following uses are strictly prohibited and will result in immediate license termination without refund:</p>
          <ul className="space-y-2 list-none">
            {[
              { act: "Resale or Sublicensing", detail: "You may not resell, sublicense, or transfer your license to a third party without written consent from Omnora Labs." },
              { act: "Reverse Engineering", detail: "You may not decompile, disassemble, or attempt to derive the source code of Noxis Hub." },
              { act: "Illegal Activities", detail: "Using Noxis Hub to manage, track, or facilitate any activity that is illegal under applicable law." },
              { act: "License Bypass", detail: "Attempting to circumvent, spoof, or hack the license activation system." },
              { act: "Unauthorized Distribution", detail: "Distributing the Noxis Hub installer or its binaries without authorization." },
              { act: "Competitive Intelligence", detail: "Using Noxis Hub to benchmark, copy, or inform the development of competing software products." },
            ].map((item) => (
              <li key={item.act} className="flex gap-3">
                <span className="text-red-500 mt-1">✕</span>
                <span><strong className="text-white">{item.act}:</strong> {item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: "data-ownership",
      icon: <Database className="w-4 h-4" />,
      title: "5. Data Ownership",
      content: (
        <div className="space-y-4">
          <p>
            <strong className="text-white">You own your data completely and unconditionally.</strong> Omnora Labs claims no ownership, license, or rights over any business data, financial records, or personal information you enter into Noxis Hub.
          </p>
          <p>
            We do not use your business data for advertising, benchmarking, training machine learning models, or any purpose beyond delivering the Noxis Hub service to you. Your data is your intellectual property.
          </p>
          <p className="text-slate-400">
            You may export all your data at any time from Settings → Data Export. Upon account termination, you may request a full data export before deletion is processed (see Privacy Policy, Section 4).
          </p>
        </div>
      ),
    },
    {
      id: "liability",
      icon: <Scale className="w-4 h-4" />,
      title: "6. Limitation of Liability",
      content: (
        <div className="space-y-4">
          <p>
            To the maximum extent permitted by applicable law, Omnora Labs and its officers, employees, and contractors shall not be liable for:
          </p>
          <ul className="space-y-2 list-none">
            {[
              "Loss of business revenue, profits, or contracts arising from software downtime or data loss",
              "Errors or inaccuracies in financial calculations produced by the software",
              "Data loss due to hardware failure, malware, or user error on the customer's own devices",
              "Inability to access the software due to internet connectivity issues (the software is designed to work offline)",
              "Indirect, incidental, punitive, or consequential damages of any kind",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-slate-400">
                <span className="text-slate-600 mt-1">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>
            Our maximum aggregate liability to you for any claim under these Terms shall not exceed the total amount paid by you for the Noxis Hub license in the 12 months preceding the claim.
          </p>
          <p className="text-slate-400">
            Noxis Hub is provided "as is." While we work hard to ensure accuracy, you are responsible for verifying all financial calculations, tax amounts, and payroll figures against applicable law and regulations in your jurisdiction before relying on them for business or legal purposes.
          </p>
        </div>
      ),
    },
    {
      id: "governing-law",
      icon: <MapPin className="w-4 h-4" />,
      title: "7. Governing Law",
      content: (
        <div className="space-y-4">
          <p>
            These Terms of Service are governed by and construed in accordance with the laws of the <strong className="text-white">Islamic Republic of Pakistan</strong>, without regard to its conflict of law provisions.
          </p>
          <p>
            Any legal action or proceeding arising under or relating to these Terms shall be brought exclusively in the courts of <strong className="text-white">Lahore, Punjab, Pakistan</strong>, and the parties irrevocably consent to the jurisdiction and venue thereof.
          </p>
        </div>
      ),
    },
    {
      id: "disputes",
      icon: <MessageSquare className="w-4 h-4" />,
      title: "8. Dispute Resolution",
      content: (
        <div className="space-y-4">
          <p>
            Before initiating any formal legal proceeding, both parties agree to attempt in good faith to resolve any dispute informally.
          </p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-[#C5A059] font-bold font-mono text-xs mt-1">01</span>
              <div>
                <p className="text-white font-bold text-sm">Contact First</p>
                <p>Contact us at <a href="mailto:legal@noxishub.app" className="text-[#C5A059] hover:underline">legal@noxishub.app</a> describing the dispute in writing.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-[#C5A059] font-bold font-mono text-xs mt-1">02</span>
              <div>
                <p className="text-white font-bold text-sm">30-Day Resolution Period</p>
                <p>We will respond within 5 business days and attempt to resolve the issue within 30 days.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-[#C5A059] font-bold font-mono text-xs mt-1">03</span>
              <div>
                <p className="text-white font-bold text-sm">Formal Proceedings</p>
                <p>If the dispute cannot be resolved informally, either party may pursue formal legal remedies under the governing law stated in Section 7.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      icon: <Mail className="w-4 h-4" />,
      title: "9. Legal Contact",
      content: (
        <div className="space-y-4">
          <p>For all legal matters, contract inquiries, and Terms of Service questions, contact our specific departments:</p>
          <div className="grid gap-4 mt-4">
            <div className="border border-white/[0.04] bg-[#0A0D10]/40 p-4 rounded space-y-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block font-mono">Support & General Contact</span>
              <p className="text-xs text-slate-400">For customer assistance, license questions, or general queries, write to our support desk:</p>
              <a href="mailto:support@noxis.app" className="text-[#C5A059] font-extrabold text-sm hover:underline font-mono">support@noxis.app</a>
            </div>
            
            <div className="border border-white/[0.04] bg-[#0A0D10]/40 p-4 rounded space-y-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block font-mono">Legal & Compliance</span>
              <p className="text-xs text-slate-400">For EULA compliance, licensing terms verification, and dispute notices, contact our legal desk:</p>
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
                <span>VALIDATED EULA v13.0</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8 space-y-16 z-10">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest bg-[#C5A059]/10 border border-[#C5A059]/20 px-3 py-1 rounded-full">
                Legal Framework
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none uppercase">
                Terms of <span className="text-[#C5A059]">Service</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                Last updated July 13, 2026. This document governs your use of Noxis Hub software, license terms, acceptable use policy, data ownership, and liability limitations.
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
              <span>Noxis Hub EULA v13.0 · Pakistan Law</span>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/refund" className="hover:text-white transition-colors">Refund</Link>
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
