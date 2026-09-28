"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ShieldCheck, Zap, Globe, Copy, ExternalLink, Cpu, Loader, Sparkles } from "lucide-react";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { formatCurrency } from "@/lib/currency/currencyEngine";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingOrb } from "@/components/ui/AnimatedComponents";
import PublicNavbar from "@/components/shell/PublicNavbar";
import HWIDActivationModal from "@/components/pricing/HWIDActivationModal";

const FAQS = [
  { 
    q: "Why do I pay manually via WhatsApp instead of automated card checkout?", 
    a: "Most textile mill and factory owners prefer direct bank transfers (NayaPay, Raast, JazzCash, or bank wire) without third-party card processing fees. Once payment is confirmed, we issue your permanent offline license key locked to your PC's motherboard within 30 minutes." 
  },
  { 
    q: "Can I use Noxis Hub without an internet connection?", 
    a: "Yes, 100% offline. All core ERP logic, Karigar piece-rate calculations, inventory ledgers, and on-site RTSP camera feeds run directly on your computer's local SQLite database. Cloud backup is completely optional." 
  },
  { 
    q: "What happens after the 14-day trial finishes?", 
    a: "Your data stays on your hard drive forever. We never delete or lock your records. You can continue using the Free tier (POS counter, basic ledger, and full Excel/PDF export) or WhatsApp us to activate an offline permanent license key." 
  },
  { 
    q: "Can I upgrade from Lite to Pro later?", 
    a: "Yes. You can upgrade your license tier at any time by messaging our support line. Your existing customer Khata, raw material inventory, and worker payroll records remain completely intact." 
  },
  { 
    q: "What computer hardware do I need?", 
    a: "Noxis Hub is built for standard Windows 10 and 11 (64-bit) computers. A computer with at least 4GB RAM is required (8GB recommended if viewing multiple on-site RTSP camera streams simultaneously)." 
  },
  { 
    q: "Is my factory data safe and private?", 
    a: "Yes. All your records are stored in a local SQLite file on your office computer's hard drive, never on public servers. We have zero access to your sales, pricing, or worker wage logs." 
  }
];

export default function PricingClient() {
  const router = useRouter();
  const { profile } = useBusinessProfile();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [displayCurrency, setDisplayCurrency] = useState<'LOCAL' | 'USD'>('LOCAL');

  // Checkout & HWID Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [hwidModalOpen, setHwidModalOpen] = useState(false);
  const [selectedTierForHwid, setSelectedTierForHwid] = useState('lite');
  const [selectedPlan, setSelectedPlan] = useState<{ tier: string; price: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'nayapay' | 'jazzcash' | 'easypaisa'>('nayapay');
  const [copied, setCopied] = useState(false);
  const [txId, setTxId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [hwidInput, setHwidInput] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handleActivateHwid = (tier: string) => {
    setSelectedTierForHwid(tier);
    setHwidModalOpen(true);
  };

  const region = profile?.region || 'south_asian';
  const localCurrency = (profile?.currency || 'PKR') as any;

  useEffect(() => {
    if (region === 'international') {
      setDisplayCurrency('USD');
    }
  }, [region]);

  const handlePurchase = (plan: string, price: string) => {
    setSelectedPlan({ tier: plan, price });
    setCheckoutError('');
    setCheckoutModalOpen(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    if (!selectedPlan) return;
    const formattedMethodName = 
      paymentMethod === 'nayapay' ? 'NayaPay IBAN (Raast)' :
      paymentMethod === 'jazzcash' ? 'JazzCash Mobile Account' :
      'EasyPaisa Mobile Account';
    
    const methodDetails =
      paymentMethod === 'nayapay' ? 'PK74NAYA1234503218338768' : '0321-8338768';

    const cleanBiz = customerName.trim() || profile?.business_name || '';
    const cleanHwid = hwidInput.trim();

    if (cleanHwid) {
      navigator.clipboard.writeText(cleanHwid);
    }

    const msg = encodeURIComponent(
      `Assalam o Alaikum Omnora Labs,\n\n` +
      `I have sent the payment of ${selectedPlan.price} for the Noxis *${selectedPlan.tier} Plan*.\n\n` +
      `🏢 Business: ${cleanBiz || 'Not provided'}\n` +
      `💻 Machine ID: ${cleanHwid || 'Not provided'}\n` +
      `💳 Payment Method: ${formattedMethodName} (${methodDetails})\n` +
      `🧾 Transaction ID (TID): ${txId || 'N/A'}\n\n` +
      `Please issue my verified offline permanent license key.`
    );
    window.open(`https://wa.me/923264742678?text=${msg}`, '_blank');
    setCheckoutModalOpen(false);
  };

  const handleInstantKeyGeneration = async () => {
    if (!selectedPlan) return;
    const cleanBiz = customerName.trim() || profile?.business_name || '';
    if (!cleanBiz) {
      setCheckoutError('Please enter your business or customer name');
      return;
    }

    setIsGeneratingKey(true);
    setCheckoutError('');

    try {
      const res = await fetch('/api/license/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedPlan.tier,
          paymentMethod,
          txId: txId.trim(),
          customerName: cleanBiz,
          hwid: hwidInput.trim(),
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to issue license key');
      }

      setCheckoutModalOpen(false);
      router.push(`/purchase/success?key=${encodeURIComponent(data.licenseKey)}&tier=${encodeURIComponent(data.tier)}&hwid=${encodeURIComponent(data.hwid || '')}`);
    } catch (err: any) {
      setCheckoutError(err.message || 'Error generating key. Please use WhatsApp activation.');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="bg-[#0A0C0E] min-h-screen text-gray-400 font-inter selection:bg-blue-500 selection:text-black pt-24 pb-20 overflow-x-hidden relative">
      <PublicNavbar />
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <FloatingOrb color="rgba(96,165,250,0.06)" size={600} x="15%" y="25%" delay={0} blur={130} />
        <FloatingOrb color="rgba(197,160,89,0.04)" size={500} x="85%" y="65%" delay={3} blur={125} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 pt-8"
        >
          <div className="inline-flex items-center gap-2 bg-[#08EBF6]/10 border border-[#08EBF6]/30 px-4 py-1.5 rounded-full mb-6 shadow-[0_0_15px_rgba(8,235,246,0.15)]">
            <ShieldCheck size={14} className="text-[#08EBF6]" />
            <span className="text-[10px] font-black text-[#08EBF6] uppercase tracking-widest">
              Built for Textile Mills &amp; Manufacturing · Local SQLite File Stored on Your Hard Drive
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4 uppercase">
            Noxis<span className="text-[#08EBF6]">Hub</span> Pricing
          </h1>
          <p className="text-[#5FA5FA] uppercase tracking-[0.25em] text-[10px] sm:text-xs font-bold max-w-2xl mx-auto">
            Local-first software for textile mills, garment factories, and wholesale traders. Works without an internet connection.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
            {/* Billing Toggle */}
            <div className="bg-[#030712] p-1.5 rounded-md border border-[#08EBF6]/30 flex w-fit shadow-2xl">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  "px-6 sm:px-8 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-md cursor-pointer",
                  billingCycle === 'monthly' ? 'bg-[#08EBF6] text-black shadow-[0_0_15px_rgba(8,235,246,0.4)]' : 'text-slate-400 hover:text-white'
                )}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('annual')}
                className={cn(
                  "px-6 sm:px-8 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all relative rounded-md cursor-pointer",
                  billingCycle === 'annual' ? 'bg-[#08EBF6] text-black shadow-[0_0_15px_rgba(8,235,246,0.4)]' : 'text-slate-400 hover:text-white'
                )}
              >
                Annual
                <span className="absolute -top-3.5 -right-3.5 bg-[#5FA5FA] text-[8px] px-2 py-0.5 rounded-md text-black font-black uppercase shadow-md">SAVE 20%</span>
              </button>
            </div>

            {/* Currency Toggle (International only) */}
            {region === 'international' && (
              <div className="bg-[#121417] p-1.5 rounded-sm border border-white/5 flex w-fit">
                <button 
                  onClick={() => setDisplayCurrency('LOCAL')}
                  className={cn(
                    "px-4 sm:px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm cursor-pointer",
                    displayCurrency === 'LOCAL' ? 'bg-white/10 text-white' : 'text-gray-600'
                  )}
                >
                  {localCurrency}
                </button>
                <button 
                  onClick={() => setDisplayCurrency('USD')}
                  className={cn(
                    "px-4 sm:px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm cursor-pointer",
                    displayCurrency === 'USD' ? 'bg-white/10 text-white' : 'text-gray-600'
                  )}
                >
                  USD
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══ 14-DAY TRIAL & FREEMIUM GUARANTEE BANNER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12 bg-gradient-to-r from-[#0E131F] via-[#121826] to-[#0E131F] border border-blue-500/20 p-8 rounded-sm shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                  Free 14-Day Evaluation + Free Forever Fallback
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Test Every Feature on Your Factory PC. <span className="text-blue-400">Zero Risk of Data Loss.</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl font-normal">
                Download the installer, run setup, and start using immediately. No credit card, no email registration, and no internet required. After 14 days, your data stays completely safe on your hard drive — continue using the <strong className="text-white">Free Forever</strong> tier (POS counter, basic ledger, and full data access forever) or WhatsApp us to activate an offline permanent license key locked to your PC&apos;s motherboard.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <div className="bg-white/5 border border-white/10 p-4 rounded-sm space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-white uppercase tracking-wider">
                  <span>14-Day Free Evaluation</span>
                  <span className="text-emerald-400">All Features Unlocked</span>
                </div>
                <p className="text-[10px] text-slate-400">Karigar Piece-Rates, Fabric Inventory, Khata, Vouchers &amp; Phone Pairing</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-sm space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-white uppercase tracking-wider">
                  <span>After Day 14</span>
                  <span className="text-blue-400">Free Forever Tier</span>
                </div>
                <p className="text-[10px] text-slate-400">POS Counter Open Forever · 200 SKUs · 50 Parties · Full PDF/Excel Export</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards Grid */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {/* Free Forever */}
          <PricingCard 
            tier="Free Forever"
            region={region}
            displayCurrency={displayCurrency}
            localCurrency={localCurrency}
            pricePKR={0}
            priceUSD={0}
            sub="Capped at 200 SKUs, 50 Parties, POS counter unlocked forever."
            features={[
              { label: "100% POS Counter Unlocked", included: true, highlight: true },
              { label: "Up to 200 Inventory SKUs", included: true },
              { label: "Up to 50 Party Accounts", included: true },
              { label: "1 Local Workstation PC", included: true },
              { label: "Full PDF/Excel Ledger Export", included: true },
              { label: "Zero Data Deletion Guarantee", included: true },
            ]}
            cta="Download Free Version"
            onPurchase={() => window.location.href = '/download'}
            variant={fadeInUp}
          />

          {/* Lite Tier */}
          <PricingCard 
            tier="Lite Tier"
            region={region}
            displayCurrency={displayCurrency}
            localCurrency={localCurrency}
            pricePKR={25000}
            priceUSD={150}
            period="yr"
            sub="5 PCs on local network, 5 phones on office Wi-Fi."
            features={[
              { label: "Up to 5 Workstation PCs on Local Network", included: true, highlight: true },
              { label: "5 Android Phones on Office Wi-Fi", included: true },
              { label: "Local SQLite File Stored on Your Hard Drive", included: true },
              { label: "Unlimited Raw Material & Fabric SKUs", included: true },
              { label: "Double-Entry Wholesale Khata Ledger", included: true },
              { label: "PDF Invoices & Thermal Slip Printing", included: true },
            ]}
            cta="Activate License"
            onPurchase={() => handleActivateHwid('lite')}
            variant={fadeInUp}
          />

          {/* Pro Tier */}
          <PricingCard 
            tier="Pro Tier"
            popular
            region={region}
            displayCurrency={displayCurrency}
            localCurrency={localCurrency}
            pricePKR={60000}
            priceUSD={360}
            period="yr"
            sub="15 PCs, 15 phones on office Wi-Fi, Karigar piece-rate payroll, on-site IP cameras."
            features={[
              { label: "Up to 15 Workstation PCs on Local Network", included: true, highlight: true },
              { label: "15 Android Phones on Office Wi-Fi", included: true },
              { label: "Karigar Piece-Rate Payroll & Peshgi Ledger", included: true, highlight: true },
              { label: "Connect up to 4 on-site IP cameras via RTSP", included: true, highlight: true },
              { label: "Automatic Reorder Alerts for Raw Materials", included: true },
              { label: "Automated WhatsApp Invoices & Payment Slips", included: true },
            ]}
            cta="Activate License"
            onPurchase={() => handleActivateHwid('pro')}
            variant={fadeInUp}
          />

          {/* Elite Tier */}
          <PricingCard 
            tier="Elite Tier"
            region={region}
            displayCurrency={displayCurrency}
            localCurrency={localCurrency}
            pricePKR={120000}
            priceUSD={720}
            period="yr"
            sub="50 PCs, 50 phones on office Wi-Fi, multi-branch, tripwire camera alerts."
            features={[
              { label: "Up to 50 Workstation PCs on Local Network", included: true, highlight: true },
              { label: "Up to 50 Android devices logging output over Wi-Fi", included: true },
              { label: "Connect up to 6 on-site IP cameras via RTSP with motion tripwires", included: true, highlight: true },
              { label: "Automatic reorder alerts & 30-day raw material demand forecasting", included: true },
              { label: "Multi-Branch Factory Operations & Stock Transfer", included: true, highlight: true },
              { label: "Dedicated WhatsApp Support Desk (+92 326 4742678)", included: true },
            ]}
            cta="Activate License"
            onPurchase={() => handleActivateHwid('elite')}
            primary
            variant={fadeInUp}
          />
        </motion.div>

        {/* HWID Activation Modal */}
        <HWIDActivationModal 
          isOpen={hwidModalOpen}
          onClose={() => setHwidModalOpen(false)}
          initialTier={selectedTierForHwid}
        />

        {/* Checkout Modal */}
        <AnimatePresence>
          {checkoutModalOpen && selectedPlan && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0C0E12] border border-white/10 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-[#C5A059] to-purple-600 animate-pulse" />

                <button
                  onClick={() => {
                    setCheckoutModalOpen(false);
                    setTxId('');
                  }}
                  className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="p-6 pb-4 border-b border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#C5A059]">Order Details</span>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mt-1">
                    Activate Noxis {selectedPlan.tier}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    Plan amount: <span className="text-white font-bold">{selectedPlan.price}</span>
                  </p>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
                  <div className="bg-[#121417] p-1 rounded-sm border border-white/5 flex">
                    {[
                      { id: 'nayapay', label: 'NayaPay IBAN' },
                      { id: 'jazzcash', label: 'JazzCash' },
                      { id: 'easypaisa', label: 'EasyPaisa' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setPaymentMethod(tab.id as any)}
                        className={cn(
                          "flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm cursor-pointer",
                          paymentMethod === tab.id ? 'bg-[#C5A059] text-black font-black shadow-[0_0_12px_rgba(197,160,89,0.2)]' : 'text-gray-500 hover:text-gray-300'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white/5 border border-white/5 p-4 rounded-sm space-y-4">
                    {paymentMethod === 'nayapay' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 uppercase tracking-wider text-[10px]">Bank Partner</span>
                          <span className="text-white font-bold">NayaPay</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 uppercase tracking-wider text-[10px]">Account Name</span>
                          <span className="text-white font-bold">Ahmad Mahboob</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-500 uppercase tracking-wider text-[10px] block">IBAN / Raast Account</span>
                          <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-sm">
                            <code className="text-xs font-mono text-gray-300 break-all">PK74NAYA1234503218338768</code>
                            <button
                              onClick={() => handleCopy('PK74NAYA1234503218338768')}
                              className="text-[#C5A059] hover:text-[#D4B06A] ml-2 shrink-0 transition-colors cursor-pointer"
                            >
                              {copied ? 'Copied' : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'jazzcash' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 uppercase tracking-wider text-[10px]">Provider</span>
                          <span className="text-[#E51C24] font-bold">JazzCash Mobile</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 uppercase tracking-wider text-[10px]">Account Title</span>
                          <span className="text-white font-bold">Razia Sultana</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-500 uppercase tracking-wider text-[10px] block">Mobile Account Number</span>
                          <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-sm">
                            <code className="text-xs font-mono text-gray-300">03218338768</code>
                            <button
                              onClick={() => handleCopy('03218338768')}
                              className="text-[#C5A059] hover:text-[#D4B06A] ml-2 shrink-0 transition-colors cursor-pointer"
                            >
                              {copied ? 'Copied' : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'easypaisa' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 uppercase tracking-wider text-[10px]">Provider</span>
                          <span className="text-[#00A859] font-bold">EasyPaisa Mobile</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 uppercase tracking-wider text-[10px]">Account Title</span>
                          <span className="text-white font-bold">Razia Sultana</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-500 uppercase tracking-wider text-[10px] block">Mobile Account Number</span>
                          <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-sm">
                            <code className="text-xs font-mono text-gray-300">03218338768</code>
                            <button
                              onClick={() => handleCopy('03218338768')}
                              className="text-[#C5A059] hover:text-[#D4B06A] ml-2 shrink-0 transition-colors cursor-pointer"
                            >
                              {copied ? 'Copied' : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                        Business / Mill Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Al-Hamid Textiles"
                        className="w-full bg-[#121417] border border-white/10 p-3 text-xs text-white placeholder-gray-600 rounded-sm focus:border-[#08EBF6] outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                        Machine ID (Hardware ID)
                      </label>
                      <input
                        type="text"
                        value={hwidInput}
                        onChange={(e) => setHwidInput(e.target.value.toUpperCase())}
                        placeholder="e.g. A1B2-C3D4-E5F6-7890"
                        className="w-full bg-[#121417] border border-white/10 p-3 text-xs text-emerald-400 font-mono placeholder-gray-600 rounded-sm focus:border-[#08EBF6] outline-none transition-colors"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        💡 Found in Noxis Hub Desktop → Settings → License &amp; System
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                        Transaction ID (TID) / Payment Reference
                      </label>
                      <input
                        type="text"
                        value={txId}
                        onChange={(e) => setTxId(e.target.value)}
                        placeholder="Enter TID from bank payment slip"
                        className="w-full bg-[#121417] border border-white/10 p-3 text-xs text-white font-mono placeholder-gray-600 rounded-sm focus:border-[#08EBF6] outline-none transition-colors"
                      />
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                        Transfer the fee to the selected account, then send your confirmation to WhatsApp to receive your key.
                      </p>
                    </div>

                    {checkoutError && (
                      <div className="bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 rounded-sm">
                        {checkoutError}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-black/40 space-y-3">
                  <button
                    onClick={handleInstantKeyGeneration}
                    disabled={isGeneratingKey}
                    className="w-full py-3.5 bg-[#08EBF6] text-black hover:bg-[#08EBF6]/90 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(8,235,246,0.35)] cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingKey ? (
                      <>
                        <Loader size={15} className="animate-spin" />
                        <span>Verifying &amp; Unlocking...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        <span>Generate &amp; Unlock License</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleVerify}
                    className="w-full py-3 bg-white/10 text-white hover:bg-white/20 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>Activate via WhatsApp (+92 326 4742678)</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Payment Channels Info Box */}
        <div className="p-6 bg-[#0F1114] border border-white/5 rounded-sm max-w-lg mx-auto mb-20">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 text-center">
            Accepted Local Payment Methods
          </p>
          <div className="space-y-2">
            {[
              { method: 'NayaPay IBAN (Raast)', number: 'PK74NAYA1234503218338768', note: 'Ahmad Mahboob • Direct Bank Transfer' },
              { method: 'JazzCash Mobile', number: '0321-8338768', numberRaw: '03218338768', note: 'Razia Sultana • Wallet Transfer' },
              { method: 'EasyPaisa Mobile', number: '0321-8338768', numberRaw: '03218338768', note: 'Razia Sultana • Wallet Transfer' },
            ].map(p => (
              <div key={p.method} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-xs font-medium text-white">{p.method}</p>
                  <p className="text-[10px] text-gray-500">{p.note}</p>
                </div>
                <p 
                  onClick={() => handleCopy(p.numberRaw || p.number)}
                  className="text-xs font-mono text-gray-400 break-all cursor-pointer hover:text-white transition-colors select-all"
                  title="Click to copy"
                >
                  {p.number}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-3 leading-relaxed text-center font-normal">
            Send your payment screenshot and Machine ID via WhatsApp (+92 326 4742678). Your permanent offline license key will be issued within 30 minutes.
          </p>
        </div>

        {/* Localized Infrastructure Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-[#121417] border border-white/5 p-8 md:p-12 relative overflow-hidden rounded-sm mb-24"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase italic mb-4">
                Built for Physical Manufacturing Realities
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                Noxis Hub is tailored for local trade and factory floor conditions: Lakh and Crore accounting formats, maund and yard measurement units, piece-rate Karigar wage calculations, and double-entry Khata statements ready to print or WhatsApp.
              </p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-300">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Audit-Verified Accounting
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-300">
                  <Globe size={14} className="text-blue-400" />
                  Multi-Currency &amp; Tax Ready
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/40 border border-white/5 space-y-4 rounded-sm">
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Local Manufacturing</p>
                <div className="space-y-2 font-mono text-[10px] text-gray-400">
                  <p>✔ Karigar Piece-Rate Wage Logs</p>
                  <p>✔ Yarn &amp; Fabric Batch Tracking</p>
                  <p>✔ Local Wi-Fi Android Floor Logging</p>
                </div>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 space-y-4 rounded-sm">
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Wholesale &amp; Retail</p>
                <div className="space-y-2 font-mono text-[10px] text-gray-400">
                  <p>✔ Double-Entry Wholesale Khata</p>
                  <p>✔ 58mm/80mm Thermal Receipt Printing</p>
                  <p>✔ Automated WhatsApp Billing</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
 
        {/* FAQs */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase italic text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FAQS.map((faq, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 2) * 0.1 }}
                className="bg-[#121417]/50 border border-white/5 p-6 rounded-sm hover:border-white/10 transition-colors"
              >
                <h4 className="text-xs sm:text-sm font-bold text-white mb-2 uppercase tracking-wide">{faq.q}</h4>
                <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed font-normal">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
 
function PricingCard({ 
  tier, pricePKR, priceUSD, period = 'yr', sub, features, cta, onPurchase, 
  popular, primary, region, displayCurrency, localCurrency, variant 
}: any) {
  
  const isSA = region === 'south_asian';
  const useUSD = displayCurrency === 'USD';
  
  const displayPrice = isSA 
    ? formatCurrency(pricePKR, 'PKR')
    : useUSD 
      ? formatCurrency(priceUSD, 'USD')
      : formatCurrency(pricePKR, localCurrency);

  return (
    <motion.div 
      variants={variant}
      className={cn(
        "relative flex flex-col p-6 border transition-all duration-300 rounded-md",
        popular 
          ? "bg-[#0B0F17] border-[#08EBF6] shadow-[0_0_30px_rgba(8,235,246,0.2)] z-10" 
          : "bg-[#030712] border-white/10 hover:border-[#08EBF6]/40"
      )}
    >
      {popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#08EBF6] text-black text-[9px] font-black uppercase tracking-[0.25em] px-4 py-1 whitespace-nowrap rounded-md shadow-[0_0_12px_#08EBF6]">
          Most Popular for Mills
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{tier}</h3>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed h-8">{sub}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">{displayPrice.split(' ')[1]}</span>
          <span className="text-[9px] font-bold text-[#5FA5FA] uppercase">{displayPrice.split(' ')[0]} / {period.toUpperCase()}</span>
        </div>
        {pricePKR > 0 && (isSA || !useUSD) && (
          <p className="text-[8px] text-slate-500 font-bold uppercase mt-1.5 italic">≈ {formatCurrency(priceUSD, 'USD')}</p>
        )}
      </div>

      <div className="flex-1 space-y-3.5 mb-10">
        {features.map((f: any, i: number) => (
          <div key={i} className={cn("flex items-start space-x-3 text-[11px]", f.included ? "text-slate-300" : "text-slate-600")}>
            {f.included ? (
              <Check size={14} className={f.highlight ? "text-[#08EBF6] shrink-0 font-bold" : "text-emerald-400 shrink-0"} />
            ) : (
              <X size={14} className="text-slate-700 shrink-0" />
            )}
            <span className={cn(f.highlight && "text-white font-black uppercase tracking-tight")}>{f.label}</span>
          </div>
        ))}
      </div>

      <button 
        onClick={() => onPurchase(tier, displayPrice)}
        className={cn(
          "block w-full py-3.5 text-center text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-md cursor-pointer",
          primary 
            ? "bg-gradient-to-r from-[#08EBF6] to-[#5FA5FA] text-black hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(8,235,246,0.3)]" 
            : popular 
              ? "bg-[#08EBF6] text-black hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(8,235,246,0.35)]" 
              : "bg-white/10 text-white hover:bg-white/20 hover:text-[#08EBF6] border border-white/10 active:scale-95"
        )}
      >
        {cta}
      </button>
    </motion.div>
  );
}