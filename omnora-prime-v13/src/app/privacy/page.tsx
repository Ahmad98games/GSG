"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Cloud, Globe, Database, Eye, Trash2, Cookie, Mail, ArrowLeft, ChevronRight, Server } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface PolicySection {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07080A] flex items-center justify-center text-gray-500 uppercase tracking-widest text-[10px] font-mono">Loading Privacy Policy...</div>}>
      <PrivacyContent />
    </Suspense>
  );
}

function PrivacyContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  const [activeSection, setActiveSection] = useState('data-collected');

  const returnHref = source === 'hub' ? '/dashboard' : '/';
  const returnLabel = source === 'hub' ? 'Return to Hub' : 'Back to Home';

  const sections: PolicySection[] = [
    {
      id: "data-collected",
      icon: <Database className="w-4 h-4" />,
      title: "1. Data We Collect",
      content: (
        <div className="space-y-4">
          <p>
            Noxis Hub collects and processes the following categories of data, all of which belong solely to you and your business:
          </p>
          <ul className="space-y-2 list-none">
            {[
              { label: "Business Profile", detail: "Business name, owner name, address, contact numbers, industry type, and logo." },
              { label: "Financial Records", detail: "Invoices, payments, ledger entries, purchase orders, cashflow journals, and tax records." },
              { label: "Worker / Karigar Records", detail: "Names, attendance logs, production output (piece rate), wage calculations, and payroll runs. No biometric data is collected." },
              { label: "Inventory & Stock", detail: "SKU names, quantities, movement logs, and supplier/party records." },
              { label: "Device Information", detail: "Non-personally-identifiable device fingerprint data (platform, timezone, language) collected during license activation for multi-device enforcement. No hardware serial numbers or MAC addresses are stored." },
              { label: "Account Credentials", detail: "Email address and hashed authentication token managed by Supabase Auth. Noxis Hub never stores plain-text passwords." },
            ].map((item) => (
              <li key={item.label} className="flex gap-3">
                <span className="text-[#C5A059] mt-1">▸</span>
                <span><strong className="text-white">{item.label}:</strong> {item.detail}</span>
              </li>
            ))}
          </ul>
          <p className="text-slate-400">
            We do not collect browsing history, personal communications, social media data, or any information beyond what is directly entered into Noxis Hub by you or your staff.
          </p>
        </div>
      ),
    },
    {
      id: "data-storage",
      icon: <Lock className="w-4 h-4" />,
      title: "2. How Data Is Stored",
      content: (
        <div className="space-y-4">
          <p>
            Noxis Hub uses a two-tier storage architecture designed for maximum security and offline resilience:
          </p>
          <div className="space-y-4">
            <div className="bg-white/[0.02] border border-white/[0.04] rounded p-4 space-y-2">
              <p className="text-white font-bold text-xs uppercase tracking-widest">Local Storage (Primary)</p>
              <p>
                All business data — invoices, karigars, inventory, ledgers — is stored on your own device in a locally encrypted <strong className="text-white">SQLite database secured with SQLCipher</strong>. The encryption key is derived from a machine-specific identifier, meaning the database cannot be opened on a different device even if the file is copied.
              </p>
              <p className="text-slate-500 text-xs">Location: Windows AppData folder on your PC. You own and control this file completely.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded p-4 space-y-2">
              <p className="text-white font-bold text-xs uppercase tracking-widest">Cloud Backup (Secondary)</p>
              <p>
                A copy of your data is synced to <strong className="text-white">Supabase</strong> (hosted on AWS) for cross-device access and disaster recovery. All data in Supabase is protected by <strong className="text-white">Row Level Security (RLS)</strong> — a database-level policy that makes it technically impossible for one business's data to be read by any other account, including Omnora Labs staff.
              </p>
              <p className="text-slate-500 text-xs">All data in transit uses HTTPS/TLS encryption. Data at rest uses AES-256 encryption on Supabase infrastructure.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "data-access",
      icon: <Eye className="w-4 h-4" />,
      title: "3. Who Can Access Your Data",
      content: (
        <div className="space-y-4">
          <p>
            <strong className="text-white">Only you and the staff accounts you explicitly authorize</strong> can access your business data.
          </p>
          <ul className="space-y-3 list-none">
            {[
              { who: "You (Account Owner)", access: "Full read and write access to all your business data." },
              { who: "Your Staff (Sub-Users)", access: "Access limited by the role you assign: Manager, Operator, Viewer, or Accountant. Each role has explicit permission gates — for example, a Viewer cannot modify invoices." },
              { who: "Omnora Labs", access: "No access to your business records. Our Supabase RLS policies are enforced at the database engine level and cannot be bypassed by application code. In the event of a technical support request that requires database inspection, we will always ask for your explicit written consent first." },
              { who: "Third Parties", access: "We do not sell, rent, or share your data with any third party for commercial purposes. Data is only shared with sub-processors listed in Section 6 for the purpose of providing the service." },
            ].map((item) => (
              <li key={item.who} className="flex gap-3">
                <span className="text-[#C5A059] mt-1">▸</span>
                <span><strong className="text-white">{item.who}:</strong> {item.access}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: "data-deletion",
      icon: <Trash2 className="w-4 h-4" />,
      title: "4. Data Deletion",
      content: (
        <div className="space-y-4">
          <p>You have the right to request full deletion of your data at any time. Here is what happens:</p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-[#C5A059] font-bold font-mono text-xs mt-1">01</span>
              <div>
                <p className="text-white font-bold text-sm">Local Data</p>
                <p>You can delete your local database at any time by uninstalling Noxis Hub and deleting the AppData folder. This immediately and permanently removes all locally stored records from your device.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-[#C5A059] font-bold font-mono text-xs mt-1">02</span>
              <div>
                <p className="text-white font-bold text-sm">Cloud Data</p>
                <p>To request deletion of your cloud data from Supabase, email <a href="mailto:support@noxis.app" className="text-[#C5A059] hover:underline">support@noxis.app</a> from your registered account email with the subject line <strong className="text-white">"Data Deletion Request"</strong>. We will permanently delete all your records from our cloud database <strong className="text-white">within 30 days</strong> and confirm via email when complete.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-[#C5A059] font-bold font-mono text-xs mt-1">03</span>
              <div>
                <p className="text-white font-bold text-sm">Backup Retention</p>
                <p>Supabase maintains encrypted point-in-time backups for 7 days. After your deletion request is processed, your data will be fully purged from all backup snapshots within 30 days.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "cookies",
      icon: <Cookie className="w-4 h-4" />,
      title: "5. Cookies & Local Storage",
      content: (
        <div className="space-y-4">
          <p>Noxis Hub uses a minimal, functional-only cookie policy. We do not use advertising cookies, tracking pixels, or behavioral analytics.</p>
          <div className="space-y-3">
            {[
              { name: "Supabase Auth Session", type: "HttpOnly Cookie", purpose: "Maintains your authenticated session. Expires when you log out or after 7 days of inactivity.", essential: true },
              { name: "NOXIS_LOCALE", type: "Cookie", purpose: "Stores your selected language preference (e.g. Urdu, Arabic, English) across sessions.", essential: true },
              { name: "noxis-locale", type: "localStorage", purpose: "Client-side language preference backup for instant rendering.", essential: true },
              { name: "noxis_license", type: "localStorage", purpose: "Cached license data to allow offline operation without re-validating against the server every session.", essential: true },
            ].map((cookie) => (
              <div key={cookie.name} className="bg-white/[0.02] border border-white/[0.03] rounded p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-xs">{cookie.name}</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">Essential</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">{cookie.type}</p>
                <p className="text-xs text-slate-400">{cookie.purpose}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-xs">We do not use Google Analytics, Facebook Pixel, Hotjar, or any third-party tracking scripts on the Noxis Hub application.</p>
        </div>
      ),
    },
    {
      id: "third-party",
      icon: <Cloud className="w-4 h-4" />,
      title: "6. Third-Party Services",
      content: (
        <div className="space-y-4">
          <p>We use the following sub-processors to deliver Noxis Hub. Each is bound by their own privacy policies and data processing agreements:</p>
          <div className="space-y-3">
            {[
              { name: "Supabase", role: "Database & Authentication", data: "Business profile, encrypted business records, auth tokens", location: "AWS us-east-1", link: "https://supabase.com/privacy" },
              { name: "Cloudflare", role: "Website hosting, CDN, DNS", data: "Website traffic metadata (no business data)", location: "Global CDN", link: "https://www.cloudflare.com/privacy" },
              { name: "GitHub", role: "Source code hosting & release distribution", data: "Installer binaries only — no user data", location: "USA", link: "https://docs.github.com/privacy" },
            ].map((sp) => (
              <div key={sp.name} className="bg-white/[0.02] border border-white/[0.03] rounded p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-sm">{sp.name}</span>
                  <a href={sp.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#C5A059] hover:underline font-mono">Privacy Policy ↗</a>
                </div>
                <p className="text-xs text-slate-400"><strong className="text-slate-300">Role:</strong> {sp.role}</p>
                <p className="text-xs text-slate-400"><strong className="text-slate-300">Data shared:</strong> {sp.data}</p>
                <p className="text-xs text-slate-500 font-mono">{sp.location}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "gdpr",
      icon: <Globe className="w-4 h-4" />,
      title: "7. GDPR Rights (EU Users)",
      content: (
        <div className="space-y-4">
          <p>If you are located in the European Union or European Economic Area, you have the following rights under the General Data Protection Regulation (GDPR):</p>
          <div className="grid gap-2">
            {[
              { right: "Right to Access", desc: "Request a copy of all personal data we hold about you." },
              { right: "Right to Rectification", desc: "Request correction of any inaccurate personal data." },
              { right: "Right to Erasure", desc: "Request deletion of your personal data ('Right to be Forgotten'). See Section 4." },
              { right: "Right to Portability", desc: "Request your data in a machine-readable format (JSON/CSV export available in Settings → Data Export)." },
              { right: "Right to Restrict Processing", desc: "Request that we stop processing your data while a dispute is resolved." },
              { right: "Right to Object", desc: "Object to processing based on legitimate interests." },
              { right: "Right to Withdraw Consent", desc: "Withdraw consent at any time without affecting prior processing." },
            ].map((item) => (
              <div key={item.right} className="flex gap-3 py-2 border-b border-white/[0.03] last:border-0">
                <span className="text-[#C5A059] mt-0.5">▸</span>
                <span><strong className="text-white">{item.right}:</strong> {item.desc}</span>
              </div>
            ))}
          </div>
          <p>To exercise any of these rights, contact us at <a href="mailto:support@noxis.app" className="text-[#C5A059] hover:underline">support@noxis.app</a>. We will respond within <strong className="text-white">30 days</strong>.</p>
          <p className="text-slate-400">Our data controller is Omnora Labs. For EU-related inquiries, you also have the right to lodge a complaint with your local Data Protection Authority.</p>
        </div>
      ),
    },
    {
      id: "contact",
      icon: <Mail className="w-4 h-4" />,
      title: "8. Contact Us",
      content: (
        <div className="space-y-4">
          <p>For any privacy-related questions, data requests, or concerns, contact our specific departments:</p>
          <div className="grid gap-4 mt-4">
            <div className="border border-white/[0.04] bg-[#0A0D10]/40 p-4 rounded space-y-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block font-mono">Support & General Contact</span>
              <p className="text-xs text-slate-400">For customer assistance, billing queries, and support questions, write to our primary support address:</p>
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
                <span>RLS ENFORCED</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8 space-y-16 z-10">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest bg-[#C5A059]/10 border border-[#C5A059]/20 px-3 py-1 rounded-full">
                Your Data. Your Control.
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none uppercase">
                Privacy <span className="text-[#C5A059]">Policy</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                Last updated July 13, 2026. This policy explains what data Noxis Hub collects, how it is stored and protected, who can access it, and your rights as a user.
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
              <span>Noxis Hub Privacy Policy v13.0</span>
              <div className="flex items-center gap-4">
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
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
