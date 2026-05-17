"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Users, Smartphone, ChevronRight, 
  CheckCircle2, ArrowRight, X
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface WelcomeGuideProps {
  ownerName: string;
  businessName: string;
  industry: string;
  onClose: (skipped?: boolean) => void;
  hasActivity?: boolean; // did they add at least 1 SKU or 1 party?
}

export default function WelcomeGuide({ 
  ownerName, 
  businessName, 
  industry, 
  onClose,
  hasActivity = false
}: WelcomeGuideProps) {
  const [step, setStep] = useState(hasActivity ? 3 : 1);
  const router = useRouter();

  const firstName = ownerName.split(' ')[0];

  const handleAction = (path: string) => {
    router.push(path);
    // Note: The guide will re-appear when they return if step 3 is not met,
    // but the dashboard will handle the visibility logic.
  };

  const handleSkip = () => {
    onClose(true);
  };

  const handleComplete = () => {
    onClose(false);
  };

  const cards = [
    {
      title: industry === 'textile' ? "Add your fabrics and materials" : 
             industry === 'pharma' ? "Add your medicines and products" : 
             "Add your products",
      desc: "Start by adding the items you sell or make. You can import a CSV or add them one by one.",
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "hover:border-blue-500/50",
      button: "Go to Inventory",
      path: "/inventory"
    },
    {
      title: industry === 'textile' ? "Add your buyers and suppliers" : "Add your customers",
      desc: "Add the businesses or people you sell to. You can create invoices for them.",
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "hover:border-emerald-500/50",
      button: "Add a Party",
      path: "/parties"
    },
    {
      title: "Pair your phone",
      desc: "Connect your Android phone to get alerts, scan barcodes, and log production on the go.",
      icon: Smartphone,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "hover:border-amber-500/50",
      button: "Pair Device",
      path: "/pairing"
    }
  ];

  const features = [
    { text: "Scan barcodes on mobile — stock updates instantly", icon: Smartphone },
    { text: "Create invoices — ledger posts automatically", icon: Package },
    { text: "Set reorder alerts — never run out of stock", icon: CheckCircle2 },
    { text: "Run payroll — Karigar wages calculated automatically", icon: Users },
    { text: "Cash flow forecast — see 90 days ahead", icon: ArrowRight },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-noxis-bg flex flex-col items-center justify-center p-8 overflow-y-auto"
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="max-w-2xl w-full text-center space-y-12"
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="w-24 h-24 relative">
                <Image src="/logos/noxis.png" alt="Noxis Logo" fill className="object-contain" />
              </div>
              <div className="space-y-2">
                <h1 className="text-5xl font-black text-white tracking-tighter">
                  Welcome to Noxis, <span className="text-blue-500">{firstName}.</span>
                </h1>
                <p className="text-2xl text-gray-400 font-medium">
                  {businessName} is ready.
                </p>
              </div>
              <p className="text-gray-500 uppercase tracking-[0.2em] text-sm font-bold pt-4">
                Here is what to do first.
              </p>
            </div>

            <button 
              onClick={() => setStep(2)}
              className="px-12 py-5 bg-blue-600 text-white text-lg font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] group flex items-center mx-auto"
            >
              Let&apos;s begin <ChevronRight className="ml-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="max-w-6xl w-full space-y-12"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Choose your first action</h2>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Get your business operational in minutes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cards.map((card, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  onClick={() => handleAction(card.path)}
                  className={cn(
                    "bg-noxis-surface border border-noxis-border p-8 space-y-6 cursor-pointer transition-all relative group",
                    card.border
                  )}
                >
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-colors", card.bg, card.color)}>
                    <card.icon size={32} />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{card.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                  <button className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 group-hover:translate-x-2 transition-transform">
                    {card.button} <ArrowRight size={14} className="ml-2" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="max-w-4xl w-full space-y-12"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">You are set up.</h2>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Here is what Noxis can do.</p>
            </div>

            <div className="flex overflow-x-auto space-x-4 pb-8 custom-scrollbar snap-x no-scrollbar">
              {features.map((feature, i) => (
                <div 
                  key={i} 
                  className="min-w-[280px] bg-noxis-surface border border-noxis-border p-6 space-y-4 snap-center"
                >
                  <div className="w-10 h-10 bg-white/5 flex items-center justify-center text-blue-500 rounded-lg">
                    <feature.icon size={20} />
                  </div>
                  <p className="text-sm font-bold text-gray-300 leading-snug">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>

            <button 
              onClick={handleComplete}
              className="w-full py-5 bg-noxis-text text-noxis-bg text-lg font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center"
            >
              Go to Dashboard <ChevronRight className="ml-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={handleSkip}
        className="absolute bottom-12 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white transition-colors"
      >
        Skip for now
      </button>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }
      `}</style>
    </motion.div>
  );
}
