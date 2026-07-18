"use client";

import React, { useState, useEffect } from "react";
import { Check, X, ShieldCheck, Zap, Globe, Copy, ExternalLink } from "lucide-react";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { formatCurrency } from "@/lib/currency/currencyEngine";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingOrb } from "@/components/ui/AnimatedComponents";

const FAQS = [
  { q: "Why do I have to pay manually instead of using an automated gateway?", a: "Since we are in an early stage, we prioritize minimizing overhead costs. Manual processing allows us to pass maximum pricing value directly to industrial operations without gateway processing fee cuts." },
  { q: "Can I use it without internet?", a: "Yes, fully offline. All core industrial logic and CCTV AI human detection analytics run 100% locally on your local machine. Cloud sync is optional for remote data backups." },
  { q: "What happens if I stop paying?", a: "Your data stays completely safe on your local drive. You retain read-only access to all historical logs and can export everything to CSV/PDF. Active transactions and live CCTV streams require an active subscription." },
  { q: "Can I switch from Lite to Pro?", a: "Yes. You can upgrade your tier configuration at any time through the workspace. Your internal data schemas automatically migrate to include the expanded multi-device tracking features." },
  { q: "Does it work on all Windows versions?", a: "Noxis Hub is optimized for Windows 10 and 11 (64-bit). It requires a minimum of 4GB RAM, though 8GB is highly recommended when running concurrent CCTV camera feeds." },
  { q: "Is my data safe?", a: "Your financial and industrial data is stored natively on your own hard drive, never on our servers. We maintain a zero-access posture to your private logs, payroll, and stock parameters." }
];

export default function PricingClient() {
  const { profile } = useBusinessProfile();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [displayCurrency, setDisplayCurrency] = useState<'LOCAL' | 'USD'>('LOCAL');

  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ tier: string; price: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'nayapay' | 'jazzcash' | 'easypaisa'>('nayapay');
  const [copied, setCopied] = useState(false);
  const [txId, setTxId] = useState('');

  const region = profile?.region || 'south_asian';
  const localCurrency = (profile?.currency || 'PKR') as any;

  useEffect(() => {
    if (region === 'international') {
      setDisplayCurrency('USD');
    }
  }, [region]);

  const handlePurchase = (plan: string, price: string) => {
    setSelectedPlan({ tier: plan, price });
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

    const msg = encodeURIComponent(
      `Assalam o Alaikum,\n\nI have sent the payment of ${selectedPlan.price} for the Noxis ${selectedPlan.tier} plan.\n\n` +
      `Payment Method: ${formattedMethodName} (${methodDetails})\n` +
      `Transaction ID / TID: ${txId || 'N/A'}\n\n` +
      `Please activate my license key.\nMy business: ${profile?.business_name || ''}\nCity: ${profile?.city || ''}`
    );
    window.open(`https://wa.me/923264742678?text=${msg}`, '_blank');
    setCheckoutModalOpen(false);
    setTxId('');
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
          className="text-center mb-16 pt-8"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4 italic uppercase">
            Noxis<span className="text-blue-400">Hub</span> Pricing
          </h1>
          <p className="text-gray-500 uppercase tracking-[0.3em] text-[9px] sm:text-[10px] font-black">
            Industrial Scalability. Predictable Growth.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
            {/* Billing Toggle */}
            <div className="bg-[#121417] p-1.5 rounded-sm border border-white/5 flex w-fit">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  "px-6 sm:px-8 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm",
                  billingCycle === 'monthly' ? 'bg-blue-500 text-black shadow-2xl' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('annual')}
                className={cn(
                  "px-6 sm:px-8 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all relative rounded-sm",
                  billingCycle === 'annual' ? 'bg-blue-500 text-black shadow-2xl' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                Annual
                <span className="absolute -top-4 -right-4 bg-emerald-500 text-[8px] px-2 py-0.5 rounded-sm text-black font-black">SAVE 20%</span>
              </button>
            </div>

            {/* Currency Toggle (International only) */}
            {region === 'international' && (
              <div className="bg-[#121417] p-1.5 rounded-sm border border-white/5 flex w-fit">
                <button 
                  onClick={() => setDisplayCurrency('LOCAL')}
                  className={cn(
                    "px-4 sm:px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm",
                    displayCurrency === 'LOCAL' ? 'bg-white/10 text-white' : 'text-gray-600'
                  )}
                >
                  {localCurrency}
                </button>
                <button 
                  onClick={() => setDisplayCurrency('USD')}
                  className={cn(
                    "px-4 sm:px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm",
                    displayCurrency === 'USD' ? 'bg-white/10 text-white' : 'text-gray-600'
                  )}
                >
                  USD
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards Grid */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8"
        >
          <PricingCard 
            tier="Lite"
            region={region}
            displayCurrency={displayCurrency}
            localCurrency={localCurrency}
            pricePKR={billingCycle === 'monthly' ? 2500 : 25000}
            priceUSD={billingCycle === 'monthly' ? 15 : 150}
            sub="Best for small retail setups & single-desk shops."
            features={[
              { label: "Double-entry Khata (Ledger)", included: true },
              { label: "Inventory & Stock Tracking", included: true },
              { label: "Dynamic Invoice Generation", included: true },
              { label: "Up to 2 Paired Mesh Devices", included: true },
              { label: "2 CCTV Auto-Discovery Channels", included: true, highlight: true },
              { label: "Smart Event-Based Recording", included: true },
              { label: "10 AI Document Scans Per Day", included: true },
              { label: "1GB Local Secure Storage", included: true },
              { label: "Manual WhatsApp Sharing", included: true },
              { label: "1 Noxis Mobile Device (Coming Soon)", included: true },
            ]}
            cta="Deploy Lite"
            onPurchase={handlePurchase}
            variant={fadeInUp}
          />

          <PricingCard 
            tier="Pro"
            popular
            region={region}
            displayCurrency={displayCurrency}
            localCurrency={localCurrency}
            pricePKR={billingCycle === 'monthly' ? 6500 : 65000}
            priceUSD={billingCycle === 'monthly' ? 40 : 400}
            sub="Optimized for growing stockrooms & localized warehouses."
            features={[
              { label: "All Lite Infrastructure Features", included: true, highlight: true },
              { label: "Up to 5 Paired Mesh Devices", included: true },
              { label: "4 CCTV Auto-Discovery Channels", included: true, highlight: true },
              { label: "Local Human Detection AI Alerts", included: true },
              { label: "Unlimited Document Scans", included: true },
              { label: "Scheduled WhatsApp Summaries", included: true },
              { label: "Up to 5 Synchronized Staff Users", included: true },
              { label: "5GB Local Secure Storage", included: true },
              { label: "4 Noxis Mobile Devices (Coming Soon)", included: true },
            ]}
            cta="Deploy Pro"
            onPurchase={handlePurchase}
            variant={fadeInUp}
          />

          <PricingCard 
            tier="Elite"
            region={region}
            displayCurrency={displayCurrency}
            localCurrency={localCurrency}
            pricePKR={billingCycle === 'monthly' ? 14000 : 140000}
            priceUSD={billingCycle === 'monthly' ? 85 : 850}
            sub="Engineered for industrial multi-grid factory floors."
            features={[
              { label: "All Pro Infrastructure Features", included: true, highlight: true },
              { label: "Up to 10 Paired Mesh Devices", included: true },
              { label: "6 CCTV Auto-Discovery Channels", included: true, highlight: true },
              { label: "Advanced Noxis Foresight Dashboard", included: true },
              { label: "Up to 25 Synchronized Staff Users", included: true },
              { label: "Industrial Safety Analytics", included: true },
              { label: "10GB Local Secure Storage", included: true },
              { label: "Priority Engineering Support Matrix", included: true },
              { label: "15 Noxis Mobile Devices (Coming Soon)", included: true, highlight: true },
            ]}
            cta="Request Elite"
            onPurchase={handlePurchase}
            primary
            variant={fadeInUp}
          />
        </motion.div>

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
                  className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="p-6 pb-4 border-b border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#C5A059]">Checkout Workspace</span>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mt-1">
                    Activate Noxis {selectedPlan.tier}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    Plan pricing: <span className="text-white font-bold">{selectedPlan.price}</span>
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
                          "flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm",
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
                              className="text-[#C5A059] hover:text-[#D4B06A] ml-2 shrink-0 transition-colors"
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
                              className="text-[#C5A059] hover:text-[#D4B06A] ml-2 shrink-0 transition-colors"
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
                          <span className="text-[#39B54A] font-bold">EasyPaisa Mobile</span>
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
                              className="text-[#C5A059] hover:text-[#D4B06A] ml-2 shrink-0 transition-colors"
                            >
                              {copied ? 'Copied' : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                      Transaction ID (TID) / Ref Number
                    </label>
                    <input
                      type="text"
                      value={txId}
                      onChange={(e) => setTxId(e.target.value)}
                      placeholder="Enter TID from confirmation message"
                      className="w-full bg-[#121417] border border-white/5 p-3 text-xs text-white placeholder-gray-600 rounded-sm focus:border-[#C5A059]/50 outline-none transition-colors"
                    />
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      Transfer the exact billing amount to the selected account, enter your Transaction ID above, and submit to verify on WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/20">
                  <button
                    onClick={handleVerify}
                    className="w-full py-4 bg-[#C5A059] text-black hover:bg-[#D4B06A] transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center shadow-[0_0_15px_rgba(197,160,89,0.2)] active:scale-[0.99]"
                  >
                    Verify Payment on WhatsApp <ExternalLink size={14} className="ml-2" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Storage Bonus Banner */}
        <div className="mt-8 p-6 bg-[#0F1114] border border-white/5 rounded-sm max-w-xl mx-auto mb-16 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">
            ⚡ Annual Deployment Bonus
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 leading-relaxed">
            Annual registration doubles the local document secure storage threshold allocation instantly. Camera channel locks and paired peripheral devices match global standard limits.
          </p>
        </div> 

        {/* Payment Methods Info Box */}
        <div className="p-6 bg-[#0F1114] border border-white/5 rounded-sm max-w-md mx-auto mb-24">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
            Offline Billing Channels
          </p>
          <div className="space-y-2">
            {[
              { method: 'NayaPay IBAN (Raast)', number: 'PK74NAYA1234503218338768', note: 'Ahmad Mahboob • Direct Wire' },
              { method: 'JazzCash Mobile', number: '0326-4742678', numberRaw: '03264742678', note: 'Ahmad Mahboob • Wallet Transfer' },
              { method: 'EasyPaisa Mobile', number: '0326-4742678', numberRaw: '03264742678', note: '(Prefer JazzCash Allocation Channel)' },
            ].map(p => (
              <div key={p.method} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-xs font-medium text-white">{p.method}</p>
                  <p className="text-[10px] text-gray-600">{p.note}</p>
                </div>
                <p 
                  onClick={() => handleCopy(p.numberRaw || p.number)}
                  className="text-xs font-mono text-gray-400 break-all cursor-pointer hover:text-white transition-colors select-all"
                >
                  {p.number}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-700 mt-3 leading-relaxed">
            After submitting via the checkout console, route your operational asset confirmation receipt to our WhatsApp pipeline. System activation keys resolve within a 30-minute matrix.
          </p>
        </div>

        {/* Global Infrastructure Banner */}
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
                Localized Infrastructure
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                Noxis Hub runs localized architectural configurations. We seamlessly parse regional metrics, native monetary systems (Lakh/Crore matrices vs Global Millions), and compliance formatting parameters automatically.
              </p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-300">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  PCI Engine Verified
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-300">
                  <Globe size={14} className="text-blue-400" />
                  Multi-Currency Parsers
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/40 border border-white/5 space-y-4 rounded-sm">
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">South Asia Core</p>
                <div className="space-y-2 opacity-50 font-mono text-[9px] text-gray-400">
                  <p>✔ JazzCash Integrations</p>
                  <p>✔ EasyPaisa Endpoints</p>
                  <p>✔ Localized Invoicing Matrix</p>
                </div>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 space-y-4 rounded-sm">
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">International Core</p>
                <div className="space-y-2 opacity-50 font-mono text-[9px] text-gray-400">
                  <p>✔ Stripe Elements Pipeline</p>
                  <p>✔ Paddle Unified Checkouts</p>
                  <p>✔ SWIFT Settlement Arrays</p>
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
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed font-medium">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
 
function PricingCard({ 
  tier, pricePKR, priceUSD, sub, features, cta, onPurchase, 
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
        "relative flex flex-col p-8 sm:p-10 border transition-all duration-300 rounded-sm",
        popular 
          ? "bg-[#121417] border-blue-500 shadow-[0_20px_50px_rgba(96,165,250,0.1)] lg:scale-105 z-10" 
          : "bg-[#0F1113] border-white/5 hover:border-white/10"
      )}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-black text-[9px] font-black uppercase tracking-[0.3em] px-6 py-2.5 whitespace-nowrap rounded-sm">
          Industrial Standard
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">{tier}</h3>
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed h-8">{sub}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tighter">{displayPrice.split(' ')[1]}</span>
          <span className="text-[9px] font-bold text-gray-500 uppercase">{displayPrice.split(' ')[0]} / Mo</span>
        </div>
        {(isSA || !useUSD) && (
          <p className="text-[8px] text-gray-600 font-bold uppercase mt-1.5 italic">≈ {formatCurrency(priceUSD, 'USD')}</p>
        )}
      </div>

      <div className="flex-1 space-y-3.5 mb-10">
        {features.map((f: any, i: number) => (
          <div key={i} className={cn("flex items-start space-x-3 text-[11px]", f.included ? "text-gray-400" : "text-gray-700")}>
            {f.included ? (
              <Check size={14} className={f.highlight ? "text-blue-400 shrink-0" : "text-emerald-500 shrink-0"} />
            ) : (
              <X size={14} className="text-gray-800 shrink-0" />
            )}
            <span className={cn(f.highlight && "text-white font-black uppercase tracking-tighter")}>{f.label}</span>
          </div>
        ))}
      </div>

      <button 
        onClick={() => onPurchase(tier, displayPrice)}
        className={cn(
          "block w-full py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-sm cursor-pointer",
          primary 
            ? "bg-[#C5A059] text-black hover:brightness-110 active:scale-95" 
            : popular 
              ? "bg-blue-500 text-black hover:brightness-110 active:scale-95 shadow-lg shadow-blue-500/20" 
              : "bg-white/5 text-white hover:bg-white/10 active:scale-95"
        )}
      >
        {cta}
      </button>
    </motion.div>
  );
}