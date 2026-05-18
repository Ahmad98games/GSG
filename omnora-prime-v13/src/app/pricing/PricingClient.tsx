"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Check, X, ShieldCheck, Zap, Globe } from "lucide-react";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { formatCurrency } from "@/lib/currency/currencyEngine";
import { cn } from "@/lib/utils";

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

  return (
    <div className="bg-[#0A0C0E] min-h-screen text-gray-400 font-inter selection:bg-electric-blue selection:text-onyx pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4 italic uppercase">Noxis<span className="text-electric-blue">Hub</span> Pricing</h1>
          <p className="text-gray-600 uppercase tracking-[0.4em] text-[9px] font-black">Industrial Scalability. Predictable Growth.</p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-12">
            {/* Billing Toggle */}
            <div className="bg-[#121417] p-1.5 rounded-sm border border-white/5 flex">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-electric-blue text-onyx shadow-2xl' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('annual')}
                className={`px-8 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all relative ${billingCycle === 'annual' ? 'bg-electric-blue text-onyx shadow-2xl' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Annual
                <span className="absolute -top-4 -right-4 bg-emerald text-[8px] px-2 py-0.5 rounded-none text-onyx font-black">SAVE 20%</span>
              </button>
            </div>

            {/* Currency Toggle (International only) */}
            {region === 'international' && (
              <div className="bg-[#121417] p-1.5 rounded-sm border border-white/5 flex">
                <button 
                  onClick={() => setDisplayCurrency('LOCAL')}
                  className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${displayCurrency === 'LOCAL' ? 'bg-white/10 text-white' : 'text-gray-600'}`}
                >
                  {localCurrency}
                </button>
                <button 
                  onClick={() => setDisplayCurrency('USD')}
                  className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${displayCurrency === 'USD' ? 'bg-white/10 text-white' : 'text-gray-600'}`}
                >
                  USD
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-10 mb-32">
          <PricingCard 
            tier="Lite"
            region={region}
            displayCurrency={displayCurrency}
            localCurrency={localCurrency}
            pricePKR={billingCycle === 'monthly' ? 2500 : 25000}
            priceUSD={billingCycle === 'monthly' ? 15 : 150}
            sub="Small Industrial Outlets & Shops"
            features={[
              { label: "Double-entry Khata (Leger)", included: true },
              { label: "Inventory & Stock Tracking", included: true },
              { label: "Dynamic Invoice Generation", included: true },
              { label: "Up to 5 Paired Devices", included: true },
              { label: "2 CCTV Monitoring Nodes", included: true },
              { label: "10 Document Scans Per Day", included: true },
              { label: "1GB Document Storage", included: true },
              { label: "WhatsApp Sharing (Manual)", included: true },
            ]}
            cta="Deploy Lite"
            href="/purchase?plan=lite"
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
            href="/purchase?plan=pro"
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
            href="/purchase?plan=elite"
            primary
          />
        </div>

        {/* Global Infrastructure Banner */}
        <div className="bg-[#121417] border border-white/5 p-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-electric-blue/5 rounded-full blur-3xl -mr-32 -mt-32" />
           <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                 <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic mb-4">Localized Infrastructure</h2>
                 <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    Noxis is a global-first platform. We automatically adapt our core logic for tax compliance, 
                    currency formatting (Lakh/Crore vs Million/Billion), and language based on your business profile.
                 </p>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                       <ShieldCheck size={14} className="text-emerald" />
                       PCI Secure
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                       <Globe size={14} className="text-electric-blue" />
                       30+ Currencies
                    </div>
                 </div>
              </div>
              <div className="flex justify-end gap-4">
                 <div className="p-6 bg-black/40 border border-white/5 space-y-4 w-48">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">South Asia</p>
                    <div className="space-y-2 opacity-30 grayscale">
                       <p className="text-[10px] font-bold text-white uppercase">JazzCash</p>
                       <p className="text-[10px] font-bold text-white uppercase">EasyPaisa</p>
                       <p className="text-[10px] font-bold text-white uppercase">Bank Wire</p>
                    </div>
                 </div>
                 <div className="p-6 bg-black/40 border border-white/5 space-y-4 w-48">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">International</p>
                    <div className="space-y-2 opacity-30 grayscale">
                       <p className="text-[10px] font-bold text-white uppercase">Stripe</p>
                       <p className="text-[10px] font-bold text-white uppercase">Paddle</p>
                       <p className="text-[10px] font-bold text-white uppercase">Swift</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* FAQs */}
        <div className="mt-32 max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic text-center mb-16">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-[#121417]/50 border border-white/5 p-8 rounded-sm">
                <h4 className="text-sm font-bold text-white mb-3">{faq.q}</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ 
  tier, pricePKR, priceUSD, sub, features, cta, href, 
  popular, primary, region, displayCurrency, localCurrency 
}: any) {
  
  const isSA = region === 'south_asian';
  const useUSD = displayCurrency === 'USD';
  
  const displayPrice = isSA 
    ? formatCurrency(pricePKR, 'PKR')
    : useUSD 
      ? formatCurrency(priceUSD, 'USD')
      : formatCurrency(pricePKR, localCurrency); // approximated

  return (
    <div className={cn(
      "relative flex flex-col p-10 border transition-all duration-500",
      popular ? "bg-[#121417] border-electric-blue shadow-[0_30px_60px_rgba(0,112,243,0.1)] sm:scale-105 z-10" : "bg-[#0F1113] border-white/5 hover:border-white/10"
    )}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-electric-blue text-onyx text-[9px] font-black uppercase tracking-[0.3em] px-6 py-2 whitespace-nowrap">
           Industrial Standard
        </div>
      )}

      <div className="mb-10">
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">{tier}</h3>
        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest leading-relaxed h-10">{sub}</p>
      </div>

      <div className="mb-10">
         <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white tracking-tighter font-mono">{displayPrice.split(' ')[1]}</span>
            <span className="text-[10px] font-black text-gray-600 uppercase">{displayPrice.split(' ')[0]} / Mo</span>
         </div>
         {!isSA && !useUSD && (
           <p className="text-[8px] text-gray-700 font-bold uppercase mt-1 italic">≈ {formatCurrency(priceUSD, 'USD')}</p>
         )}
         {isSA && (
           <p className="text-[8px] text-gray-700 font-bold uppercase mt-1 italic">≈ {formatCurrency(priceUSD, 'USD')}</p>
         )}
      </div>

      <div className="flex-1 space-y-4 mb-12">
        {features.map((f: any, i: number) => (
          <div key={i} className={cn("flex items-start space-x-3 text-[11px]", f.included ? "text-gray-400" : "text-gray-700")}>
            {f.included ? (
              <Check size={14} className={f.highlight ? "text-electric-blue shrink-0" : "text-emerald shrink-0"} />
            ) : (
              <X size={14} className="text-gray-800 shrink-0" />
            )}
            <span className={cn(f.highlight && "text-white font-black uppercase tracking-tighter")}>{f.label}</span>
          </div>
        ))}
      </div>

      <Link 
        href={href}
        className={cn(
          "w-full py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] transition-all",
          primary 
            ? "bg-sandstone-gold text-onyx hover:brightness-110" 
            : popular 
              ? "bg-electric-blue text-onyx hover:brightness-110 shadow-2xl" 
              : "bg-white/5 text-white hover:bg-white/10"
        )}
      >
        {cta}
      </Link>
    </div>
  );
}
