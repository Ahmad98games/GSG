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

  const firstName = (ownerName || 'User').split(' ')[0] || 'User';

  const handleAction = (path: string) => {
    onClose(false); // Mark onboarding as complete
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
      className="fixed inset-0 z-[100] bg-[#07090E]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 overflow-y-auto"
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            className="max-w-xl w-full text-center space-y-8 z-10 bg-[#0B0F17] p-8 sm:p-10 rounded-xl border border-white/10 shadow-2xl"
          >
            <div className="flex flex-col items-center space-y-5">
              <div className="w-16 h-16 relative">
                <Image src="/logos/noxis.png" alt="Noxis Logo" fill className="object-contain" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Welcome to Noxis, <span className="text-blue-400">{firstName}</span>
                </h1>
                <p className="text-base text-slate-400 font-normal">
                  Your workspace for <strong className="text-white">{businessName || 'Your Business'}</strong> is ready.
                </p>
              </div>
              <p className="text-slate-400 text-xs font-medium">
                Let's take a quick look at your daily workflow.
              </p>
            </div>

            <button 
              onClick={() => setStep(2)}
              className="px-8 py-3.5 bg-blue-600 text-white text-xs font-semibold uppercase tracking-wider rounded-md hover:bg-blue-500 transition-colors shadow-sm group flex items-center mx-auto cursor-pointer"
            >
              Start Quick Tutorial <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            className="max-w-4xl w-full space-y-6 z-10 bg-[#0B0F17] p-8 rounded-xl border border-white/10 shadow-2xl"
          >
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                How to Use Noxis Hub
              </h2>
              <p className="text-slate-400 text-xs font-medium">
                Your daily factory workflow in 4 simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tutorialSteps.map((tut, i) => (
                <div 
                  key={i}
                  className="bg-[#0E131F] border border-white/10 p-5 rounded-lg relative group hover:border-white/20 transition-colors"
                >
                  <div className="absolute top-4 right-4 font-mono font-bold text-sm text-slate-600">
                    {tut.num}
                  </div>
                  <div className="flex items-center space-x-3.5 mb-2.5">
                    <div className={cn("w-9 h-9 rounded-md flex items-center justify-center text-white", tut.bg, tut.color)}>
                      <tut.icon size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {tut.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {tut.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-white/10">
              <span className="text-xs font-medium text-slate-500">
                Step 2 of 3 • Workflow Overview
              </span>
              <button 
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-500 transition-colors flex items-center cursor-pointer shadow-sm"
              >
                Proceed to Actions <ChevronRight className="ml-1.5" size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            className="max-w-5xl w-full space-y-6 z-10 bg-[#0B0F17] p-8 rounded-xl border border-white/10 shadow-2xl"
          >
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Choose Your First Action
              </h2>
              <p className="text-slate-400 text-xs font-medium">
                Get your business operations rolling in minutes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cards.map((card, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -3 }}
                  onClick={() => handleAction(card.path)}
                  className={cn(
                    "bg-[#0E131F] border border-white/10 p-5 space-y-4 cursor-pointer transition-all relative group rounded-lg hover:border-blue-500/40",
                    card.border
                  )}
                >
                  <div className={cn("w-11 h-11 rounded-md flex items-center justify-center transition-colors", card.bg, card.color)}>
                    <card.icon size={22} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {card.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
                    {card.button} <ArrowRight size={13} className="ml-1.5" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col space-y-3">
              <button 
                onClick={handleComplete}
                className="w-full py-3 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-500 transition-colors flex items-center justify-center shadow-sm cursor-pointer"
              >
                Go to Dashboard <ChevronRight className="ml-2" size={14} />
              </button>
              <div className="text-center">
                <span className="text-xs text-slate-500 font-medium">
                  Step 3 of 3 • Ready to Operate
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={handleSkip}
        className="mt-6 text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors cursor-pointer"
      >
        Skip tutorial for now
      </button>
    </motion.div>
  );
}
