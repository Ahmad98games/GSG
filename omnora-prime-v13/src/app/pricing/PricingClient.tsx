"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Check, X, ShieldCheck, Zap, Globe } from "lucide-react";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { formatCurrency } from "@/lib/currency/currencyEngine";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { FloatingOrb } from "@/components/ui/AnimatedComponents";

const FAQS = [
  { q: "Can I use it without internet?", a: "Yes, fully offline. All core industrial logic runs on your local machine. Cloud sync is only used for license verification and optional multi-location data aggregation." },
  { q: "What happens if I stop paying?", a: "Your data stays on your PC. You retain read access to your records and can export everything to CSV or PDF at any time. Active transactions and CCTV security features require an active license." },
  { q: "Can I switch from Lite to Pro?", a: "Yes. You can upgrade your tier at any time through the billing portal. Your data will automatically migrate to include the new Pro/Elite features." },
  { q: "Does it work on all Windows versions?", a: "Noxis is optimized for Windows 10 and 11 (64-bit). It requires a minimum of 4GB RAM, though 8GB is recommended for CCTV security operations." },
  { q: "Is my data safe?", a: "Your financial and industrial data is stored on your own hard drive, not our servers. We never have access to your Khata, payroll, or stock records." },
  { q: "How many devices can I connect?", a: "Limits vary by plan: Lite supports 5 devices, Pro supports 15, and Elite supports up to 50 devices within a local mesh network." },
  { q: "Is there a setup fee?", a: "No. We believe in transparency. You only pay the monthly or annual subscription fee. Remote setup assistance is included in Pro and Elite plans." },
  { q: "Do you support custom industry requests?", a: "Yes. The Elite plan includes priority access to our engineering team for specialized terminology or feature requests relevant to your specific sector." }
];

export default function PricingClient() {
  const { profile } = useBusinessProfile();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [displayCurrency, setDisplayCurrency] = useState<'LOCAL' | 'USD'>('LOCAL');

  const region = profile?.region || 'south_asian';
  const localCurrency = (profile?.currency || 'PKR') as any;

  useEffect(() => {
    if (region === 'international') {
      setDisplayCurrency('USD');
    }
  }, [region]);

  const handlePurchase = (plan: string, price: string) => {
    const msg = encodeURIComponent(
      `Assalam o Alaikum,\n\nI want to purchase Noxis ${plan} plan (${price}/month).\n\nPlease share payment details.\n\nMy business: \nCity: `
    )
    window.open(
      `https://wa.me/923334355475?text=${msg}`,
      '_blank'
    )
  }


  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
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
                  billingCycle === 'monthly' 
                    ? 'bg-blue-500 text-black shadow-2xl' 
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('annual')}
                className={cn(
                  "px-6 sm:px-8 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all relative rounded-sm",
                  billingCycle === 'annual' 
                    ? 'bg-blue-500 text-black shadow-2xl' 
                    : 'text-gray-500 hover:text-gray-300'
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
            sub="Small Industrial Outlets & Shops"
            features={[
              { label: "Double-entry Khata (Ledger)", included: true },
              { label: "Inventory & Stock Tracking", included: true },
              { label: "Dynamic Invoice Generation", included: true },
              { label: "Up to 5 Paired Devices", included: true },
              { label: "2 CCTV Monitoring Nodes", included: true },
              { label: "10 Document Scans Per Day", included: true },
              { label: "1GB Document Storage", included: true },
              { label: "WhatsApp Sharing (Manual)", included: true },
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
            sub="Growing Factories & Warehouses"
            features={[
              { label: "All Lite Features", included: true, highlight: true },
              { label: "Up to 15 Paired Devices", included: true },
              { label: "8 CCTV AI Detection Zones", included: true },
              { label: "Unlimited Document Scans", included: true },
              { label: "Scheduled WhatsApp Summaries", included: true },
              { label: "Up to 5 Staff Users", included: true },
              { label: "10GB Document Storage", included: true },
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
            sub="Enterprise-Scale Multi-Location"
            features={[
              { label: "All Pro Features", included: true, highlight: true },
              { label: "Up to 50 Paired Devices", included: true },
              { label: "20 CCTV AI Detection Zones", included: true },
              { label: "Up to 25 Staff Users", included: true },
              { label: "Fire & Intrusion Detection", included: true },
              { label: "50GB Document Storage", included: true },
              { label: "Priority Engineering Support", included: true },
            ]}
            cta="Request Elite"
            onPurchase={handlePurchase}
            primary
            variant={fadeInUp}
          />
        </motion.div>

        {/* Payment Methods Section */}
        <div className="mt-8 p-6 bg-[#0F1114]
          border border-white/6 rounded-sm
          max-w-md mx-auto mb-24">
          <p className="text-[10px] font-semibold
            uppercase tracking-widest text-gray-500
            mb-3">
            How to pay
          </p>
          <div className="space-y-2">
            {[
              {
                method: 'JazzCash',
                number: '0333-4355475',
                note: 'Send to mobile account'
              },
              {
                method: 'EasyPaisa',
                number: '0333-4355475',
                note: 'Send to mobile account'
              },
              {
                method: 'Bank Transfer',
                number: 'Share on WhatsApp',
                note: 'Account details on request'
              },
            ].map(p => (
              <div key={p.method}
                className="flex items-center
                justify-between py-2 border-b
                border-white/4 last:border-0">
                <div>
                  <p className="text-xs font-medium
                    text-white">{p.method}</p>
                  <p className="text-[10px] text-gray-600">
                    {p.note}
                  </p>
                </div>
                <p className="text-xs font-mono
                  text-gray-400">{p.number}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-700 mt-3
            leading-relaxed">
            After payment: send screenshot on WhatsApp.
            License key delivered within 30 minutes.
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
                Noxis is a global-first platform. We automatically adapt our core logic for tax compliance, 
                currency formatting (Lakh/Crore vs Million/Billion), and language based on your business profile.
              </p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-300">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  PCI Secure
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-300">
                  <Globe size={14} className="text-blue-400" />
                  30+ Currencies
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/40 border border-white/5 space-y-4 rounded-sm">
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">South Asia</p>
                <div className="space-y-2 opacity-50 font-mono text-[9px] text-gray-400">
                  <p>✔ JazzCash Local</p>
                  <p>✔ EasyPaisa Instants</p>
                  <p>✔ PKR Local Invoicing</p>
                </div>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 space-y-4 rounded-sm">
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">International</p>
                <div className="space-y-2 opacity-50 font-mono text-[9px] text-gray-400">
                  <p>✔ Stripe Integration</p>
                  <p>✔ Paddle Checkouts</p>
                  <p>✔ SWIFT Transfers</p>
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
       : formatCurrency(pricePKR, localCurrency); // approximated
 
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
