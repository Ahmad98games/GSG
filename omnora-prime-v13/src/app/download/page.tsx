'use client';

import { useState } from 'react';
import PublicNavbar from '@/components/shell/PublicNavbar';
import QRCode from 'react-qr-code';
import { 
  Download, Check, MessageCircle, ChevronDown, 
  Sparkles, CheckCircle2, ShieldCheck, Terminal, Cpu, HardDrive, Wifi, Lock,
  FolderArchive, MousePointerClick, X, Loader2, ArrowRight, User, Building, Phone, MapPin,
  Smartphone, QrCode, ExternalLink, FileCheck2, Server, Laptop
} from 'lucide-react';

const DOWNLOAD_ZIP_URL = '/api/download-software?format=zip&trial=true&redirect=true';
const CLOUDFLARE_APK_URL = 'https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/noxis-preview.apk';
const APK_DOWNLOAD_URL = '/api/download-apk';
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
    q: "WHAT HAPPENS TO MY DATA AFTER THE 7-DAY TRIAL ENDS?",
    a: "Your data stays on your PC forever. We never lock or delete your files. After 7 days, you can continue using the Free tier (POS counter, customer balance search, and full Excel/PDF export) or WhatsApp us to activate an offline permanent license key."
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
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showApkQr, setShowApkQr] = useState(false);

  const handleStartDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    setSubmitting(true);
    try {
      await fetch('/api/download-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          businessName,
          city,
        })
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('noxis_lead_name', fullName.trim());
        localStorage.setItem('noxis_lead_phone', phone.trim());
        localStorage.setItem('noxis_lead_business', (businessName && businessName.trim()) ? businessName.trim() : `${fullName.trim()}'s Business`);
      }
    } catch {}

    window.location.href = DOWNLOAD_ZIP_URL;
    setShowModal(false);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-sans selection:bg-[#08EBF6]/30 selection:text-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-16 px-6 sm:px-12 max-w-6xl mx-auto text-center space-y-6">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[550px] h-[250px] bg-[#08EBF6]/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#08EBF6]/10 border border-[#08EBF6]/30 text-[#08EBF6] text-[10px] font-mono font-bold uppercase tracking-widest">
          <Sparkles size={12} />
          <span>Commercial Factory Suite &bull; Official v14.0.0 Releases</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto uppercase leading-tight">
          DOWNLOAD NOXIS HUB <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#08EBF6] via-white to-[#5FA5FA]">&amp; MOBILE TERMINAL</span>
        </h1>

        <div className="space-y-2 max-w-2xl mx-auto">
          <p className="text-sm sm:text-base text-white font-semibold leading-relaxed">
            Industrial Textile &amp; Factory System. Works Offline on Local Wi-Fi Mesh.
          </p>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
            Run the core Database Hub on your Windows PC and pair Android companion handhelds on the production floor for Karigar wages, POS counter, and real-time stock sync with zero external internet required.
          </p>
        </div>

        {/* Dual Platform Download Cards (Windows & Android) */}
        <div className="pt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
          
          {/* Card 1: Windows Desktop Hub */}
          <div className="relative p-6 sm:p-8 bg-[#07090E] border border-white/10 hover:border-[#08EBF6]/40 rounded-xl transition-all flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#08EBF6]/10 border border-[#08EBF6]/30 flex items-center justify-center text-[#08EBF6]">
                    <Laptop size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight">Noxis Hub (PC)</h2>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                        v14.0.0 Stable
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">Desktop Database &amp; Central Factory Server</p>
                  </div>
                </div>
              </div>

              {/* Windows Specs */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Check size={13} className="text-[#08EBF6]" />
                  <span>Windows 10 / 11 (64-bit)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={13} className="text-[#08EBF6]" />
                  <span>210 MB Portable (.zip)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={13} className="text-[#08EBF6]" />
                  <span>Local SQLite &bull; 100% Private</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={13} className="text-[#08EBF6]" />
                  <span>7-Day Full Pro Evaluation</span>
                </div>
              </div>

              {/* Extraction Steps */}
              <div className="p-3.5 bg-black/40 border border-white/5 rounded-lg space-y-2">
                <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Quick Setup &bull; No Installer Needed</p>
                <div className="space-y-1.5 text-[11px] text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#08EBF6]/20 text-[#08EBF6] text-[10px] font-mono font-bold flex items-center justify-center">1</span>
                    <span>Right-click downloaded .zip &rarr; Extract All</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#08EBF6]/20 text-[#08EBF6] text-[10px] font-mono font-bold flex items-center justify-center">2</span>
                    <span>Open folder &rarr; Double-click <strong>NoxisHub.exe</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Windows CTA */}
            <div className="pt-6 space-y-2">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#08EBF6] hover:bg-[#5FA5FA] text-black font-mono font-black uppercase tracking-wider text-xs rounded transition-all shadow-[0_0_20px_rgba(8,235,246,0.25)] hover:scale-[1.01] cursor-pointer"
              >
                <Download size={16} />
                <span>Download for Windows (.zip)</span>
              </button>
              <p className="text-[10px] text-zinc-500 font-mono text-center">
                Portable Archive &bull; Runs without admin installation
              </p>
            </div>
          </div>

          {/* Card 2: Android Mobile Terminal (APK) */}
          <div className="relative p-6 sm:p-8 bg-[#07090E] border border-white/10 hover:border-[#60A5FA]/40 rounded-xl transition-all flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#60A5FA]/10 border border-[#60A5FA]/30 flex items-center justify-center text-[#60A5FA]">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight">Mobile Terminal</h2>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                        v14.0.0 APK
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">Android Floor Companion &amp; Karigar Terminal</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApkQr(!showApkQr)}
                  className="px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Show Phone Scan QR"
                >
                  <QrCode size={12} className="text-[#60A5FA]" />
                  <span>{showApkQr ? 'Hide QR' : 'Phone QR'}</span>
                </button>
              </div>

              {/* Android Specs */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Check size={13} className="text-[#60A5FA]" />
                  <span>Android 8.0+ (ARM64 / x86_64)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={13} className="text-[#60A5FA]" />
                  <span>116 MB Package (.apk)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={13} className="text-[#60A5FA]" />
                  <span>Direct Wi-Fi PC Mesh Sync</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={13} className="text-[#60A5FA]" />
                  <span>SHA-256 Verified &bull; v2/v3 Signed</span>
                </div>
              </div>

              {/* QR Code / Phone Setup View */}
              {showApkQr ? (
                <div className="p-4 bg-white rounded-lg flex flex-col sm:flex-row items-center gap-4 text-zinc-900 animate-in fade-in duration-200">
                  <div className="p-1 bg-white border border-zinc-200 rounded shrink-0">
                    <QRCode
                      value={CLOUDFLARE_APK_URL}
                      size={110}
                      bgColor="#FFFFFF"
                      fgColor="#030712"
                      level="M"
                    />
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-xs font-bold font-mono uppercase tracking-wider text-black">Scan to Download on Phone</p>
                    <p className="text-[11px] text-zinc-600 leading-snug">
                      Point your Android camera at this QR code to download the APK directly onto your phone without needing a computer cable.
                    </p>
                    <span className="inline-block text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Cloudflare High-Speed Edge CDN
                    </span>
                  </div>
                </div>
              ) : (
                /* Feature Highlights */
                <div className="p-3.5 bg-black/40 border border-white/5 rounded-lg space-y-2">
                  <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Terminal Capabilities</p>
                  <div className="space-y-1 text-[11px] text-zinc-300">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]"></span>
                      <span>Piece-rate Karigar production logging &amp; Peshgi advances</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]"></span>
                      <span>Instant camera barcode scanning for rolls, SKUs &amp; invoices</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]"></span>
                      <span>Real-time bidirectional synchronization with PC Hub over LAN</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Android CTA */}
            <div className="pt-6 space-y-2">
              <a
                href={CLOUDFLARE_APK_URL}
                download="Noxis-Mobile-Terminal-v14.0.0.apk"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#60A5FA] to-[#08EBF6] hover:opacity-95 text-black font-mono font-black uppercase tracking-wider text-xs rounded transition-all shadow-[0_0_20px_rgba(96,165,250,0.25)] hover:scale-[1.01] cursor-pointer"
              >
                <Download size={16} />
                <span>Download Android APK (v14.0.0)</span>
              </a>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono px-1">
                <span>File: noxis-preview.apk</span>
                <button
                  type="button"
                  onClick={() => setShowApkQr(!showApkQr)}
                  className="text-[#60A5FA] hover:underline cursor-pointer"
                >
                  {showApkQr ? 'Hide QR Code' : 'Scan via Phone QR'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Matrix */}
      <section className="py-14 px-6 sm:px-12 max-w-6xl mx-auto space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white uppercase tracking-wider">
            Feature Comparison &amp; Modules
          </h2>
          <p className="text-xs text-gray-400">
            Compare functionality across operational tiers. The download includes full Pro/Elite access for your first 7 days.
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
                  Pro / 7-Day Free Evaluation
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
                { feature: 'Database Storage Location', free: 'Local Hard Drive (100% Offline)', lite: 'Local Hard Drive (100% Offline)', elite: 'Local Hard Drive (100% Private by default • Cloud backup is strictly optional)' },
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
          How Evaluation &amp; Activation Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-[#080A0F] border border-[#08EBF6]/30 rounded-lg space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#08EBF6] bg-[#08EBF6]/10 px-2 py-0.5 rounded">
              Days 1–7 (Full Pro Access)
            </span>
            <h3 className="text-base font-bold text-white uppercase font-mono">7-Day Free Evaluation (Days 1–7)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Download the .zip, extract to any folder, and run NoxisHub.exe directly — no installer needed. No credit card, no email registration, and no internet required. All features are fully unlocked so you can test piece-rate wages, Khata entries, and inventory tracking on your actual factory floor.
            </p>
          </div>

          <div className="p-6 bg-[#080A0F] border border-white/10 rounded-lg space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
              Day 8+ (Free Forever Fallback)
            </span>
            <h3 className="text-base font-bold text-white uppercase font-mono">Paid Activation (Day 8+)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              To keep using premium features after 7 days, copy your machine's ID from Settings and WhatsApp us to receive your offline permanent license key. If you choose not to activate, your data is never locked — the Free Forever tier keeps POS counter and search permanently active.
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
          <p className="text-xs text-zinc-400 font-mono">License key locked to your PC's motherboard &bull; Works without an internet connection</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
          <div className="p-5 bg-[#080A0F] border border-white/10 rounded-lg space-y-2">
            <div className="w-8 h-8 rounded bg-[#08EBF6]/10 border border-[#08EBF6]/30 flex items-center justify-center text-[#08EBF6] text-xs font-bold">
              01
            </div>
            <h4 className="text-sm font-bold text-white uppercase">Copy Machine ID</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Open Noxis Hub &rarr; Go to Settings &rarr; License. Click &quot;Copy Machine ID&quot; (a unique hardware fingerprint).
            </p>
          </div>

          <div className="p-5 bg-[#080A0F] border border-white/10 rounded-lg space-y-2">
            <div className="w-8 h-8 rounded bg-[#08EBF6]/10 border border-[#08EBF6]/30 flex items-center justify-center text-[#08EBF6] text-xs font-bold">
              02
            </div>
            <h4 className="text-sm font-bold text-white uppercase">Send via WhatsApp</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              WhatsApp your Machine ID and business name to our team (+92 326 4742678). Pay via Bank Transfer or JazzCash.
            </p>
          </div>

          <div className="p-5 bg-[#080A0F] border border-white/10 rounded-lg space-y-2">
            <div className="w-8 h-8 rounded bg-[#08EBF6]/10 border border-[#08EBF6]/30 flex items-center justify-center text-[#08EBF6] text-xs font-bold">
              03
            </div>
            <h4 className="text-sm font-bold text-white uppercase">Paste &amp; Unlock</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              We send you a cryptographically signed license file. Paste it into Settings &rarr; License to unlock permanent access forever.
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <a
            href={WHATSAPP_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
          >
            <MessageCircle size={15} />
            <span>Chat with Licensing Support (+92 326 4742678)</span>
          </a>
        </div>
      </section>

      {/* Hardware Requirements */}
      <section className="py-14 px-6 sm:px-12 max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white uppercase tracking-wider">
            System &amp; Hardware Requirements
          </h2>
          <p className="text-xs text-zinc-400 font-mono">Compatible with standard office computers and budget Android handhelds</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
          {/* PC Requirements */}
          <div className="p-5 bg-[#080A0F] border border-white/10 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-white text-xs font-bold uppercase">
              <Laptop size={14} className="text-[#08EBF6]" />
              <span>Windows PC Hub Requirements</span>
            </div>
            <div className="space-y-2 text-xs text-zinc-400 font-sans">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 font-mono text-[11px]">
                <span className="text-zinc-500">Operating System:</span>
                <span className="text-white">Windows 10 / 11 (64-bit)</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 font-mono text-[11px]">
                <span className="text-zinc-500">Processor:</span>
                <span className="text-white">Intel Core i3 (4th Gen+) or AMD equivalent</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 font-mono text-[11px]">
                <span className="text-zinc-500">RAM:</span>
                <span className="text-white">4 GB minimum (8 GB recommended)</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 font-mono text-[11px]">
                <span className="text-zinc-500">Disk Space:</span>
                <span className="text-white">500 MB free space on SSD / HDD</span>
              </div>
            </div>
          </div>

          {/* Android Mobile Requirements */}
          <div className="p-5 bg-[#080A0F] border border-white/10 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-white text-xs font-bold uppercase">
              <Smartphone size={14} className="text-[#60A5FA]" />
              <span>Android Terminal Requirements</span>
            </div>
            <div className="space-y-2 text-xs text-zinc-400 font-sans">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 font-mono text-[11px]">
                <span className="text-zinc-500">Android Version:</span>
                <span className="text-white">Android 8.0 (Oreo) or later</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 font-mono text-[11px]">
                <span className="text-zinc-500">Architecture:</span>
                <span className="text-white">ARM64 / ARMv7 / x86_64</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 font-mono text-[11px]">
                <span className="text-zinc-500">Camera:</span>
                <span className="text-white">Autofocus camera for barcode &amp; QR scan</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 font-mono text-[11px]">
                <span className="text-zinc-500">Network:</span>
                <span className="text-white">Local Wi-Fi connection to PC Hub</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-14 px-6 sm:px-12 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white uppercase tracking-wider">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-zinc-400 font-mono">Answers regarding offline reliability, hardware security, and license transfers</p>
        </div>

        <div className="space-y-3 font-mono">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="border border-white/10 rounded-lg overflow-hidden bg-[#07090E] transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 text-xs font-bold text-white hover:text-[#08EBF6] transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={14}
                  className={`transform transition-transform ${openFaq === idx ? 'rotate-180 text-[#08EBF6]' : 'text-zinc-500'}`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-zinc-400 font-sans leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Registration & Download Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#07090E] border border-[#08EBF6]/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(8,235,246,0.15)] text-left">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#08EBF6]/10 border border-[#08EBF6]/30 flex items-center justify-center text-[#08EBF6]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wide">
                  Direct Download &amp; Instant Trial
                </h3>
                <p className="text-xs text-zinc-400">
                  Register your business workstation to start the 7-day evaluation.
                </p>
              </div>
            </div>

            <form onSubmit={handleStartDownload} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-[#08EBF6]" />
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#08EBF6] transition-colors font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-[#08EBF6]" />
                  WhatsApp / Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#08EBF6] transition-colors font-sans"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">Used to verify your 7-day trial and send license recovery keys.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1.5 flex items-center gap-1.5">
                    <Building size={13} className="text-[#08EBF6]" />
                    Business / Mill Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Madina Garments"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#08EBF6] transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1.5 flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#08EBF6]" />
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Faisalabad, Lahore, Karachi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#08EBF6] transition-colors font-sans"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-[#08EBF6] to-[#5FA5FA] hover:opacity-95 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(8,235,246,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Initiating Download...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Start Download (.zip portable)</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 font-mono text-center pt-1">
                <Lock size={11} className="text-emerald-400" />
                <span>100% Secure &bull; No payment required &bull; Portable offline archive</span>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t border-white/5 bg-[#020304] py-6 text-center text-[10px] font-mono text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Omnora. Industrial ERP for Textile Mills &amp; Wholesale Traders.</p>
      </footer>
    </div>
  );
}
