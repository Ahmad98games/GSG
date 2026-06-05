"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Users, Smartphone, ChevronRight, 
  CheckCircle2, ArrowRight, X, Play
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface WelcomeGuideProps {
  ownerName: string;
  businessName: string;
  industry: string;
  onClose: (skipped?: boolean) => void;
  hasActivity?: boolean;
}

export default function WelcomeGuide({ 
  ownerName, 
  businessName, 
  industry, 
  onClose,
  hasActivity = false
}: WelcomeGuideProps) {
  // If activity exists, start directly at Step 3 (Choose actions), otherwise Step 1 (Intro)
  const [step, setStep] = useState(hasActivity ? 3 : 1);
  const router = useRouter();

  const firstName = ownerName.split(' ')[0];

  const handleAction = (path: string) => {
    router.push(path);
  };

  const handleSkip = () => {
    onClose(true);
  };

  const handleComplete = () => {
    onClose(false);
  };

  const cards = [
    {
      title: industry === 'textile' ? "Add fabrics & raw materials" : 
             industry === 'pharma' ? "Add medicines & products" : 
             "Add products",
      desc: "Create inventory catalog. Specify purchase costs, sale rates, and barcodes.",
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "hover:border-blue-500/50",
      button: "Go to Inventory",
      path: "/inventory"
    },
    {
      title: industry === 'textile' ? "Add buyers and suppliers" : "Add customers & parties",
      desc: "Register parties. Invoices will automatically post to their accounts.",
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "hover:border-emerald-500/50",
      button: "Add a Party",
      path: "/parties"
    },
    {
      title: "Pair your Android phone",
      desc: "Connect your phone for barcode scanning and instant production floor updates.",
      icon: Smartphone,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "hover:border-amber-500/50",
      button: "Pair Device",
      path: "/pairing"
    }
  ];

  const tutorialSteps = [
    {
      num: "01",
      title: "Manage Inventory",
      desc: "Go to Inventory to log raw materials, finished stock, or packaging. Track reorder levels and scan barcodes.",
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      num: "02",
      title: "Log Production & Wages",
      desc: "Create Production Batches. Select your Karigars (workers) to automatically compute and record their piece-rate wages in ledgers.",
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      num: "03",
      title: "Issue Invoices",
      desc: "Create Invoices for Buyers. The system automatically updates stock levels and records accounts receivable.",
      icon: CheckCircle2,
      color: "text-amber-400",
      bg: "bg-amber-500/10"
    },
    {
      num: "04",
      title: "Pair Phone & Work Offline",
      desc: "Pair your phone to scan barcodes. Noxis operates entirely locally on your machine—no internet required for daily tasks.",
      icon: Smartphone,
      color: "text-purple-400",
      bg: "bg-purple-500/10"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#0A0A0B]/98 flex flex-col items-center justify-center p-6 overflow-y-auto"
    >
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/2 -right-24 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="max-w-2xl w-full text-center space-y-10 z-10"
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="w-20 h-20 relative">
                <Image src="/logos/noxis.png" alt="Noxis Logo" fill className="object-contain" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                  Welcome to Noxis, <span className="text-blue-500">{firstName}.</span>
                </h1>
                <p className="text-xl text-gray-400 font-medium">
                  Workspace for {businessName} is fully ready.
                </p>
              </div>
              <p className="text-gray-500 uppercase tracking-[0.2em] text-xs font-bold pt-4">
                Let's take a quick look at how to use the ERP.
              </p>
            </div>

            <button 
              onClick={() => setStep(2)}
              className="px-10 py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] group flex items-center mx-auto"
            >
              Start Quick Tutorial <ChevronRight className="ml-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="max-w-4xl w-full space-y-8 z-10"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
                How to Use <span className="text-blue-500">Noxis Hub</span>
              </h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Your daily workflow in 4 simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tutorialSteps.map((tut, i) => (
                <div 
                  key={i}
                  className="bg-noxis-surface border border-noxis-border p-6 rounded relative group hover:border-white/10 transition-colors"
                >
                  <div className="absolute top-4 right-4 font-mono font-bold text-lg text-white/5 group-hover:text-white/10 transition-colors">
                    {tut.num}
                  </div>
                  <div className="flex items-center space-x-4 mb-3">
                    <div className={cn("w-10 h-10 rounded flex items-center justify-center text-white", tut.bg, tut.color)}>
                      <tut.icon size={20} />
                    </div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wider">
                      {tut.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {tut.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-white/5">
              <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                Step 2 of 3 • Learn Workflow
              </span>
              <button 
                onClick={() => setStep(3)}
                className="px-8 py-4 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                Proceed to Actions <ChevronRight className="ml-2" size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="max-w-6xl w-full space-y-8 z-10"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
                Choose your first action
              </h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Get your business operational in minutes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cards.map((card, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  onClick={() => handleAction(card.path)}
                  className={cn(
                    "bg-noxis-surface border border-noxis-border p-6 space-y-6 cursor-pointer transition-all relative group rounded",
                    card.border
                  )}
                >
                  <div className={cn("w-14 h-14 rounded flex items-center justify-center transition-colors", card.bg, card.color)}>
                    <card.icon size={26} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      {card.title}
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <button className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 group-hover:translate-x-2 transition-transform">
                    {card.button} <ArrowRight size={14} className="ml-2" />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 flex flex-col space-y-4">
              <button 
                onClick={handleComplete}
                className="w-full py-4 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center"
              >
                Go to Dashboard <ChevronRight className="ml-3" size={14} />
              </button>
              <div className="text-center">
                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                  Step 3 of 3 • Initialize
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={handleSkip}
        className="absolute bottom-8 text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white transition-colors"
      >
        Skip tutorial for now
      </button>
    </motion.div>
  );
}
