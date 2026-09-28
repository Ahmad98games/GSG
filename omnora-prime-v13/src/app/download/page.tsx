'use client';

import { useState } from 'react';
import PublicNavbar from '@/components/shell/PublicNavbar';
import { 
  Download, Check, MessageCircle, ChevronDown, 
  Sparkles, CheckCircle2, ShieldCheck, Terminal, Cpu, HardDrive, Wifi, Lock
} from 'lucide-react';

const DOWNLOAD_EXE_URL = '/api/download-software?trial=true&redirect=true';
const WHATSAPP_SUPPORT_URL = 'https://wa.me/923264742678?text=Salam%20Omnora,%20I%20have%20installed%20Noxis%20Hub%20and%20want%20to%20activate%20my%20license.%20My%20Machine%20ID%20is:%20';

const FAQS = [
  {
    q: "DO I NEED AN INTERNET CONNECTION TO RUN NOXIS HUB?",
    a: "No. The core software works completely offline. You only need internet for WhatsApp invoicing, cloud backup, or software updates."
  },
  {
    q: "HOW DO ANDROID PHONES CONNECT TO THE OFFICE PC WITHOUT INTERNET?",
    a: "They connect via your local office Wi-Fi router. No external internet access is required for the phone-to-PC mesh."
  },
  {
    q: "WHAT HAPPENS TO MY DATA AFTER THE 14-DAY TRIAL ENDS?",
    a: "Your data stays on your PC forever. We never lock or delete your files. After 14 days, you can continue using the Free tier (POS counter, customer balance search, and full Excel/PDF export) or WhatsApp us to activate an offline permanent license key."
  },
  {
    q: "IS MY FACTORY DATA KEPT PRIVATE?",
    a: "Yes, 100%. All invoices, ledger books, worker salaries, and inventory records are stored in a local SQLite file directly on your hard drive. We do not upload your data anywhere. Optional cloud backup is strictly opt-in and under your control."
  },
  {
    q: "CAN I MOVE MY LICENSE IF MY PC GETS DAMAGED OR REPLACED?",
    a: "Yes. Simply install Noxis Hub on your new PC, restore your database backup from your USB drive, and WhatsApp our support team (+92 326 4742678) with your new Machine ID to re-bind your license key to your new computer's motherboard."
  }
];

export default function DownloadPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-sans selection:bg-[#08EBF6]/30 selection:text-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-6 sm:px-12 max-w-5xl mx-auto text-center space-y-6">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[550px] h-[250px] bg-[#08EBF6]/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#08EBF6]/10 border border-[#08EBF6]/30 text-[#08EBF6] text-[10px] font-mono font-bold uppercase tracking-widest">
          <Sparkles size={12} />
          <span>Free 14-Day Full Trial · No Registration Needed</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-3xl mx-auto uppercase leading-tight">
          DOWNLOAD NOXIS HUB <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#08EBF6] via-white to-[#5FA5FA]">FOR WINDOWS</span>
        </h1>

        <div className="space-y-3 max-w-2xl mx-auto">
          <p className="text-sm sm:text-base text-white font-semibold leading-relaxed">
            Works Offline for Daily Operations. Connect to WhatsApp/Internet Only When Needed.
          </p>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
            Core functions (POS, Inventory, Karigar Wages, Khata, CCTV) work 100% offline from your local hard drive. Features like WhatsApp invoice sharing, optional cloud backup, and software updates connect only when internet is available.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="pt-4 flex flex-col items-center space-y-3">
          <a
            href={DOWNLOAD_EXE_URL}
            className="inline-flex items-center justify-center gap-3 px-10 py-4.5 bg-[#08EBF6] hover:bg-[#5FA5FA] text-black font-mono font-black uppercase tracking-wider text-xs rounded transition-all shadow-[0_0_25px_rgba(8,235,246,0.3)] hover:scale-[1.02]"
          >
            <Download size={18} />
            <span>Download for Windows (.exe)</span>
          </a>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-gray-400">
            <span>v13.0.1 Stable</span>
            <span>•</span>
            <span>210 MB Standalone Installer</span>
            <span>•</span>
            <span className="text-[#08EBF6]">Windows 10 / 11 (64-bit)</span>
          </div>
          <p className="text-[10px] text-gray-400 font-mono">
            Local SQLite File Stored on Your Hard Drive · 100% Private by Default
          </p>
        </div>
      </section>

      {/* Feature Matrix */}
      <section className="py-14 px-6 sm:px-12 max-w-6xl mx-auto space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white uppercase tracking-wider">
            Feature Comparison & Modules
          </h2>
          <p className="text-xs text-gray-400">
            Compare functionality across operational tiers. The download includes full Elite access for your first 14 days.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#07090E]">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-[#040507]">
                <th className="p-4 text-gray-400 font-bold uppercase tracking-wider">Operational Feature</th>
                <th className="p-4 text-gray-400 font-bold uppercase tracking-wider">Free Forever (Post-Trial)</th>
                <th className="p-4 text-gray-400 font-bold uppercase tracking-wider">Lite License</th>
                <th className="p-4 bg-[#08EBF6]/10 text-[#08EBF6] border-x border-[#08EBF6]/30 font-bold uppercase tracking-wider">
                  Elite / 14-Day Trial
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {[
                { feature: 'POS Counter & Thermal Printing (58mm/80mm)', free: 'Full POS Access', lite: 'Full Hardware Support', elite: 'Full Hardware Support' },
                { feature: 'Raw Material & Fabric Stock Tracking', free: 'Up to 200 SKUs', lite: 'Unlimited SKUs', elite: 'Unlimited SKUs + Batch Yield' },
                { feature: 'Wholesale Customer & Supplier Khata', free: 'Up to 50 Accounts', lite: 'Unlimited Accounts', elite: 'Unlimited Accounts' },
                { feature: 'Karigar Piece-Rate Wage Log & Peshgi Advances', free: 'Manual Ledger Only', lite: 'Automatic Calculations', elite: 'Automatic Rates & Payslip Prints' },
                { feature: 'WhatsApp Invoice & Statement Sharing', free: '—', lite: 'Included (requires internet)', elite: 'Included (requires internet)' },
                { feature: 'PDF & Excel Accounting Ledger Exports', free: 'Standard Export', lite: 'Detailed Reports', elite: 'Detailed Reports + P&L' },
                { feature: 'On-Site RTSP IP Camera Video Feeds', free: '—', lite: '2 Camera Feeds', elite: 'Connect up to 6 on-site IP cameras via RTSP with motion tripwire alerts' },
                { feature: 'Inventory Demand Forecasting', free: '—', lite: 'Low-Stock Alerts', elite: 'Automatic reorder alerts & 30-day raw material demand forecasting' },
                { feature: 'Floor Companion Phone Connection', free: '1 Android Device', lite: 'Up to 5 Devices', elite: 'Up to 50 Android devices logging output & attendance over office Wi-Fi' },
                { feature: 'Database Storage Location', free: 'Local Hard Drive (100% Offline)', lite: 'Local Hard Drive (100% Offline)', elite: 'Local Hard Drive (100% Private by default · Cloud backup is strictly optional)' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-semibold text-white font-mono text-xs">{row.feature}</td>
                  <td className="p-4 text-zinc-400 text-xs">{row.free}</td>
                  <td className="p-4 text-zinc-300 text-xs">{row.lite}</td>
                  <td className="p-4 bg-[#08EBF6]/5 border-x border-[#08EBF6]/20 font-bold text-[#08EBF6] text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <Check size={14} className="text-[#08EBF6] shrink-0" />
                      <span>{row.elite}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trial vs License Activation Protocol */}
      <section className="py-14 px-6 sm:px-12 max-w-5xl mx-auto space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold font-mono text-white uppercase tracking-wider text-center">
          How Evaluation & Activation Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-[#080A0F] border border-[#08EBF6]/30 rounded-lg space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#08EBF6] bg-[#08EBF6]/10 px-2 py-0.5 rounded">
              Days 1–14
            </span>
            <h3 className="text-base font-bold text-white uppercase font-mono">Free Trial (Day 1–14)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Download the .exe, run the installer, and start using immediately. No credit card, no email registration, and no internet required. All features are fully unlocked so you can test piece-rate wages, Khata entries, and inventory tracking on your actual factory floor.
            </p>
          </div>

          <div className="p-6 bg-[#080A0F] border border-white/10 rounded-lg space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
              Day 14+
            </span>
            <h3 className="text-base font-bold text-white uppercase font-mono">Paid Activation (After Day 14)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              To keep using premium features after 14 days, copy your machine's ID from Settings and WhatsApp us to receive your offline permanent license key. If you choose not to activate, your data is never locked — the Free Forever tier keeps POS counter and search permanently active.
            </p>
          </div>
        </div>
      </section>

      {/* Licensing Activation Steps */}
      <section className="py-14 px-6 sm:px-12 max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white uppercase tracking-wider">
            3-Step Offline License Activation
          </h2>
          <p className="text-xs text-zinc-400 font-mono">License key locked to your PC's motherboard · Works without an internet connection</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
          <div className="p-5 bg-[#080A0F] border border-white/10 rounded-lg space-y-2">
            <div className="w-7 h-7 rounded bg-white/5 border border-white/15 flex items-center justify-center font-bold text-xs text-white">
              01
            </div>
            <h4 className="text-xs font-bold text-white uppercase">Copy Machine ID</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Open Noxis Hub on your office computer, navigate to Settings → License, and click &quot;Copy Machine ID&quot;.
            </p>
          </div>

          <div className="p-5 bg-[#080A0F] border border-[#25D366]/30 rounded-lg space-y-2">
            <div className="w-7 h-7 rounded bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center font-bold text-xs text-[#25D366]">
              02
            </div>
            <h4 className="text-xs font-bold text-white uppercase">WhatsApp Us</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Send your Machine ID and business name to our official WhatsApp support (+92 326 4742678) to generate your license.
            </p>
            <a
              href={WHATSAPP_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-[#25D366] font-bold uppercase tracking-wider hover:underline pt-1"
            >
              <MessageCircle size={12} />
              <span>WhatsApp Support (+92 326 4742678)</span>
            </a>
          </div>

          <div className="p-5 bg-[#080A0F] border border-white/10 rounded-lg space-y-2">
            <div className="w-7 h-7 rounded bg-white/5 border border-white/15 flex items-center justify-center font-bold text-xs text-white">
              03
            </div>
            <h4 className="text-xs font-bold text-white uppercase">Paste License Key</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Paste your offline license key directly into the software. Premium features unlock permanently on your PC in under one second.
            </p>
          </div>
        </div>
      </section>

      {/* Production Metrics */}
      <section className="py-10 px-6 sm:px-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-[#06080C] border border-white/10 rounded-lg text-center font-mono">
          <div className="space-y-1">
            <p className="text-3xl font-bold text-white">140+</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Mills & Factory Workstations</p>
          </div>
          <div className="space-y-1 sm:border-x sm:border-white/10">
            <p className="text-3xl font-bold text-[#08EBF6]">1,200+</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Karigars & Weavers Managed</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-[#5FA5FA]">45,000+</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Wholesale Invoices Recorded</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-6 sm:px-12 max-w-4xl mx-auto space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold font-mono text-white uppercase tracking-wider text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === null || openFaq === idx;
            return (
              <div key={idx} className="border border-white/10 rounded-lg bg-[#07090E] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-mono font-bold text-white hover:bg-white/[0.02] transition-colors uppercase tracking-wide cursor-pointer"
                >
                  <span className="text-[#08EBF6]">{faq.q}</span>
                  <ChevronDown size={14} className={`transform transition-transform ${openFaq === idx || openFaq === null ? 'rotate-180 text-[#08EBF6]' : 'text-zinc-500'}`} />
                </button>
                {(openFaq === null || openFaq === idx) && (
                  <div className="p-4 pt-0 text-xs text-zinc-300 leading-relaxed font-sans border-t border-white/5 bg-black/30">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-6 text-center border-t border-white/10 max-w-4xl mx-auto space-y-4">
        <h3 className="text-2xl font-bold font-mono text-white uppercase">Download and Test on Your Factory PC</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Start your 14-day full evaluation immediately. No sign-up, no credit card, and completely offline.
        </p>
        <a
          href={DOWNLOAD_EXE_URL}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#08EBF6] hover:bg-[#5FA5FA] text-black font-mono font-bold uppercase tracking-wider text-xs rounded transition-all shadow-[0_0_20px_rgba(8,235,246,0.25)]"
        >
          <Download size={16} />
          <span>Download Noxis Hub (.exe)</span>
        </a>
      </section>

      <footer className="border-t border-white/5 bg-[#020304] py-6 text-center text-[10px] font-mono text-zinc-500">
        <p>© {new Date().getFullYear()} Omnora. Industrial ERP for Textile Mills & Wholesale Traders.</p>
      </footer>
    </div>
  );
}