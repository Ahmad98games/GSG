'use client';

import { useState } from 'react';
import PublicNavbar from '@/components/shell/PublicNavbar';
import { 
  Download, Check, MessageCircle, ChevronDown, 
  Sparkles, CheckCircle2, ShieldCheck, Terminal, Cpu
} from 'lucide-react';

const DOWNLOAD_EXE_URL = '/api/download-software?trial=true&redirect=true';
const WHATSAPP_SUPPORT_URL = 'https://wa.me/923000000000?text=Salam%20Omnora,%20I%20have%20installed%20Noxis%20Hub%20and%20want%20to%20activate%20my%20license.%20My%20HWID%20is:%20';

const FAQS = [
  {
    q: "Do I need internet to use Noxis Hub?",
    a: "No. Noxis Hub writes directly to your local partition. Internet is only required if you choose to enable cloud disaster recovery snapshots."
  },
  {
    q: "Is my historical data accessible if the trial ends?",
    a: "Yes. Your data remains in your local SQLite engine forever. The Free tier continues to allow search, historical lookups, and basic POS operation."
  },
  {
    q: "Can I use one license on multiple computers?",
    a: "Each license key signs against the machine's individual Hardware ID (HWID). Additional PC nodes within the local mesh can be provisioned via multi-seat packs."
  },
  {
    q: "How do mobile devices connect to the workstation offline?",
    a: "The PC workstation initializes a WebSocket listener over your local subnet router. Companion devices transmit piece-rate updates across LAN without cellular or external WAN traffic."
  },
  {
    q: "What happens if our office PC fails or needs replacement?",
    a: "Export your database backup or pull from your encrypted snapshot. HWID re-binding for your new PC takes under 5 minutes via support."
  }
];

export default function DownloadPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-sans selection:bg-[#08EBF6]/30 selection:text-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-6 sm:px-12 max-w-5xl mx-auto text-center space-y-6">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[550px] h-[250px] bg-[#08EBF6]/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#08EBF6]/10 border border-[#08EBF6]/30 text-[#08EBF6] text-[10px] font-mono font-bold uppercase tracking-widest">
          <Sparkles size={12} />
          <span>Complete 14-Day Free Evaluation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-3xl mx-auto uppercase leading-tight">
          DOWNLOAD NOXIS HUB <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#08EBF6] via-white to-[#5FA5FA]">DESKTOP</span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Full offline industrial operating suite. Zero registration, no credit cards, and deterministic database isolation on your local hardware.
        </p>

        {/* Primary CTA */}
        <div className="pt-4 flex flex-col items-center space-y-3">
          <a
            href={DOWNLOAD_EXE_URL}
            className="inline-flex items-center justify-center gap-3 px-10 py-4.5 bg-[#08EBF6] hover:bg-[#5FA5FA] text-black font-mono font-black uppercase tracking-wider text-xs rounded transition-all shadow-[0_0_25px_rgba(8,235,246,0.3)] hover:scale-[1.02]"
          >
            <Download size={18} />
            <span>Download for Windows (.exe)</span>
          </a>

          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
            <span>v13.0.1 Stable</span>
            <span>•</span>
            <span>217MB Standalone Installer</span>
            <span>•</span>
            <span className="text-[#08EBF6]">Windows 10 / 11 (64-bit)</span>
          </div>
          <p className="text-[10px] text-gray-400 font-mono">
            SHA-256 Verified Binary · Local SQLite 3 Architecture
          </p>
        </div>
      </section>

      {/* Feature Matrix */}
      <section className="py-14 px-6 sm:px-12 max-w-6xl mx-auto space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white uppercase tracking-wider">
            Evaluation Matrix & Modules
          </h2>
          <p className="text-xs text-gray-400">
            Compare features across operational tiers. The evaluation build grants complete Elite access for 14 days.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#07090E]">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-[#040507]">
                <th className="p-4 text-gray-400 font-bold uppercase tracking-wider">Operational Engine</th>
                <th className="p-4 text-gray-400 font-bold uppercase tracking-wider">Free Tier</th>
                <th className="p-4 text-gray-400 font-bold uppercase tracking-wider">Lite Deployment</th>
                <th className="p-4 bg-[#08EBF6]/10 text-[#08EBF6] border-x border-[#08EBF6]/30 font-bold uppercase tracking-wider">
                  Elite / 14-Day Trial
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {[
                { feature: 'POS Counter & Thermal Printing', free: 'Basic Native', lite: 'Full Hardware Hooks', elite: 'Full Hardware Hooks' },
                { feature: 'Inventory SKU Relational Ledger', free: 'Up to 100 SKUs', lite: 'Unlimited', elite: 'Unlimited' },
                { feature: 'Customer & Supplier Accounts', free: '30 Accounts', lite: 'Unlimited', elite: 'Unlimited' },
                { feature: 'Karigar Piece-Rate Wage Pipeline', free: 'Manual Ledger Entry', lite: 'Automated Rates', elite: 'Automated Rates' },
                { feature: 'WhatsApp Invoice Dispatch', free: '—', lite: 'Enabled', elite: 'Enabled' },
                { feature: 'Audit, PDF & Excel Exports', free: '—', lite: 'Enabled', elite: 'Enabled' },
                { feature: 'RTSP CCTV Input Streams', free: '—', lite: '2 RTSP Feeds', elite: '6 Streams + AI Vision Alerts' },
                { feature: 'Foresight AI Projections', free: '—', lite: '—', elite: 'Active Model Pipeline' },
                { feature: 'Floor Companion Phone Mesh', free: '1 Device', lite: '5 Devices', elite: '50 Connected Nodes' },
                { feature: 'Disk Data Sovereignty', free: 'Permanent Local Lock', lite: 'Permanent Local Lock', elite: 'Permanent Local Lock' },
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

      {/* Trial Expiry Protocol */}
      <section className="py-14 px-6 sm:px-12 max-w-5xl mx-auto space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold font-mono text-white uppercase tracking-wider text-center">
          Lifecycle After 14 Days
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-[#080A0F] border border-[#08EBF6]/30 rounded-lg space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#08EBF6] bg-[#08EBF6]/10 px-2 py-0.5 rounded">
              Days 1–14
            </span>
            <h3 className="text-base font-bold text-white uppercase font-mono">Full Elite Runtime</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              All native modules operational: high-speed POS, real-time Karigar wage calculations, localized RTSP feeds, and floor mesh pairing.
            </p>
          </div>

          <div className="p-6 bg-[#080A0F] border border-white/10 rounded-lg space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
              Day 14+
            </span>
            <h3 className="text-base font-bold text-white uppercase font-mono">Automated Free Mode</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              No database lockouts. Your ledger balances, customer lists, and raw operational history remain queryable directly from your hard drive.
            </p>
          </div>
        </div>
      </section>

      {/* Licensing Conduit */}
      <section className="py-14 px-6 sm:px-12 max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white uppercase tracking-wider">
            License Activation Pipeline
          </h2>
          <p className="text-xs text-zinc-400 font-mono">Cryptographic HWID validation · Zero cloud round-trips</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
          <div className="p-5 bg-[#080A0F] border border-white/10 rounded-lg space-y-2">
            <div className="w-7 h-7 rounded bg-white/5 border border-white/15 flex items-center justify-center font-bold text-xs text-white">
              01
            </div>
            <h4 className="text-xs font-bold text-white uppercase">Copy Unique HWID</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Open Noxis Hub on your workstation, navigate to Settings → License, and click Copy Machine HWID.
            </p>
          </div>

          <div className="p-5 bg-[#080A0F] border border-[#25D366]/30 rounded-lg space-y-2">
            <div className="w-7 h-7 rounded bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center font-bold text-xs text-[#25D366]">
              02
            </div>
            <h4 className="text-xs font-bold text-white uppercase">Dispatch HWID</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Forward your generated HWID to support for tier authorization and RSA license generation.
            </p>
            <a
              href={WHATSAPP_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-[#25D366] font-bold uppercase tracking-wider hover:underline pt-1"
            >
              <MessageCircle size={12} />
              <span>Open Support Dispatch</span>
            </a>
          </div>

          <div className="p-5 bg-[#080A0F] border border-white/10 rounded-lg space-y-2">
            <div className="w-7 h-7 rounded bg-white/5 border border-white/15 flex items-center justify-center font-bold text-xs text-white">
              03
            </div>
            <h4 className="text-xs font-bold text-white uppercase">Inject Cryptographic Key</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Paste the signed license key into the desktop interface. Cryptographic unlocking commits locally in &lt;1 second.
            </p>
          </div>
        </div>
      </section>

      {/* Production Metrics */}
      <section className="py-10 px-6 sm:px-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-[#06080C] border border-white/10 rounded-lg text-center font-mono">
          <div className="space-y-1">
            <p className="text-3xl font-bold text-white">140+</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Active Industrial Deployments</p>
          </div>
          <div className="space-y-1 sm:border-x sm:border-white/10">
            <p className="text-3xl font-bold text-[#08EBF6]">1,200+</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Karigar Nodes Tracked Monthly</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-[#5FA5FA]">45,000+</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Invoices Processed Locally</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-6 sm:px-12 max-w-4xl mx-auto space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold font-mono text-white uppercase tracking-wider text-center">
          Engineering & Storage FAQ
        </h2>

        <div className="space-y-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="border border-white/10 rounded bg-[#07090E] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-mono font-bold text-white hover:bg-white/[0.02] transition-colors uppercase tracking-wide"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180 text-[#08EBF6]' : 'text-zinc-500'}`} />
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-zinc-400 leading-relaxed font-sans border-t border-white/5 bg-black/20">
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
        <h3 className="text-2xl font-bold font-mono text-white uppercase">Initialize Production Evaluation</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Start your 14-day fully featured evaluation runtime on your Windows workstation.
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
        <p>© {new Date().getFullYear()} Omnora. Industrial Runtime Engineering.</p>
      </footer>
    </div>
  );
}