"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Check, X, ShieldCheck, Zap, Globe, Copy, ExternalLink, Cpu, Loader, 
  Sparkles, MessageCircle, Calculator, Building2, ChevronDown, ChevronUp,
  Award, RefreshCw, Lock, ArrowRight, CheckCircle2, Clock, Users, Flame,
  HardDrive, Wifi
} from "lucide-react";
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
    a: "Most textile mill and factory owners prefer direct bank transfers (Raqami Islamic Digital Bank, Raast, JazzCash, or bank wire) without third-party card processing fees. Once payment is confirmed, we issue your permanent offline license key locked to your PC's motherboard within 30 minutes." 
  },
  { 
    q: "Can I pay monthly instead of annually?", 
    a: "Yes! You can choose Monthly or Annual billing anytime. Monthly launch plans give full operational flexibility (Lite: Rs. 1,999/mo, Pro: Rs. 4,999/mo, Elite: Rs. 9,999/mo) with zero long-term commitment. Annual plans lock in maximum discounts (Lite: Rs. 18,000/yr, Pro: Rs. 45,000/yr, Elite: Rs. 90,000/yr) with free hardware motherboard re-binding." 
  },
  { 
    q: "Can I use Noxis Hub without an internet connection?", 
    a: "Yes, 100% offline. All core ERP logic, Karigar piece-rate calculations, inventory ledgers, and on-site RTSP camera feeds run directly on your computer's local SQLite database. Cloud backup is completely optional." 
  },
  { 
    q: "What happens after the 7-day trial finishes?", 
    a: "Your data stays on your hard drive forever. We never delete or lock your records. After 7 days, you can continue using the Free tier (POS counter, basic ledger, and full Excel/PDF export) or WhatsApp us to activate an offline permanent license key." 
  },
  { 
    q: "Can I upgrade from Lite to Pro or Elite later?", 
    a: "Yes. You can upgrade your license tier at any time by messaging our support line. Your existing customer Khata, raw material inventory, and worker payroll records remain completely intact." 
  },
  { 
    q: "What computer hardware do I need?", 
    a: "Noxis Hub is built for standard Windows 10 and 11 (64-bit) computers. A computer with at least 4GB RAM is required (8GB recommended if viewing multiple on-site RTSP camera streams simultaneously)." 
  },
  { 
    q: "Is my factory data safe and private?", 
    a: "Yes. All your records are stored in a local SQLite file on your office computer's hard drive, never on public servers. We have zero access to your sales, pricing, or worker wage logs." 
  },
  { 
    q: "What happens if my factory PC breaks or is replaced?", 
    a: "We provide free hardware motherboard re-binding. Simply send us your new Machine ID (HWID) along with your original purchase receipt on WhatsApp (+92 326 4742678), and we issue an updated key within minutes." 
  }
];

const PRICING_DATA = {
  free: {
    tierKey: 'free',
    name: 'Free Forever',
    monthlyPKR: 0,
    annualPKR: 0,
    monthlyUSD: 0,
    annualUSD: 0,
    sub: 'Capped at 200 SKUs, 50 Parties, POS counter unlocked forever.',
    devices: '1 Local PC',
    features: [
      { label: "100% POS Counter Unlocked Forever", included: true, highlight: true },
      { label: "Up to 200 Inventory SKUs & Fabrics", included: true },
      { label: "Up to 50 Party Accounts & Ledgers", included: true },
      { label: "1 Local Workstation PC (Motherboard Locked)", included: true },
      { label: "Full PDF/Excel Ledger Export", included: true },
      { label: "Zero Data Deletion Guarantee", included: true },
      { label: "Karigar Piece-Rate Wage Payroll", included: false },
      { label: "CCTV IP Camera Monitoring", included: false },
      { label: "Multi-Device Android Floor Sync", included: false },
    ],
    cta: "Download Free Version",
  },
  lite: {
    tierKey: 'lite',
    name: 'Lite Tier',
    monthlyPKR: 1999,
    originalMonthlyPKR: 2999,
    annualPKR: 18000,
    originalAnnualPKR: 25000,
    monthlyUSD: 10,
    originalMonthlyUSD: 15,
    annualUSD: 99,
    originalAnnualUSD: 150,
    monthlySavingsBadge: "Save Rs. 1,000 / mo (-33% Launch Offer)",
    annualSavingsBadge: "Save Rs. 5,988 / yr vs monthly (Was Rs. 25,000)",
    discountPercent: "-33%",
    sub: '5 PCs on local network, 5 phones on office Wi-Fi.',
    devices: '5 PCs + 5 Mobile Phones',
    features: [
      { label: "Up to 5 Workstation PCs on Local Network", included: true, highlight: true },
      { label: "5 Android Phones on Office Wi-Fi", included: true },
      { label: "Local SQLite File Stored on Your Hard Drive", included: true },
      { label: "Unlimited Raw Material & Fabric SKUs", included: true },
      { label: "Double-Entry Wholesale Khata Ledger", included: true },
      { label: "PDF Invoices & 58mm/80mm Thermal Printing", included: true },
      { label: "Automated Daily SQLite Local Backups", included: true },
      { label: "Karigar Piece-Rate Wage Payroll", included: false },
      { label: "CCTV IP Camera RTSP Feeds", included: false },
    ],
    cta: "Activate Lite License",
  },
  pro: {
    tierKey: 'pro',
    name: 'Pro Tier',
    popular: true,
    targetAudience: 'Standard Business / Mills',
    monthlyPKR: 4999,
    originalMonthlyPKR: 6999,
    annualPKR: 45000,
    originalAnnualPKR: 60000,
    monthlyUSD: 25,
    originalMonthlyUSD: 35,
    annualUSD: 225,
    originalAnnualUSD: 360,
    foundersOfferBadge: "RECOMMENDED FOR MILLS (-30%)",
    monthlySavingsBadge: "Includes 7 days of dedicated technical assistance",
    annualSavingsBadge: "1 Month Full Setup Assistance + 6 Months Free Updates (Recommended)",
    supportPackageMonthly: "Includes 7 days of dedicated technical assistance",
    supportPackageAnnual: "Includes 1 month of full setup assistance + 6 months of free software updates",
    discountPercent: "-30%",
    sub: 'Standard Business & Mills · Local-network mobile pairing, Karigar piece-rates & zero-internet reliability.',
    devices: '15 PCs + 15 Mobile Phones',
    features: [
      { label: "Local-Network Mobile-to-PC Secure Pairing (Office Wi-Fi)", included: true, highlight: true },
      { label: "AES-256 Encryption & Zero-Internet Local SQLite Engine", included: true, highlight: true },
      { label: "Karigar Piece-Rate Payroll & Peshgi (Advance) Ledger", included: true, highlight: true },
      { label: "Live Raw Material & Wholesale Inventory Management", included: true, highlight: true },
      { label: "Up to 15 Workstation PCs on Local Network", included: true },
      { label: "15 Android Phones on Office Wi-Fi", included: true },
      { label: "Connect up to 4 On-Site IP Cameras via RTSP", included: true },
      { label: "Automatic Reorder Alerts for Raw Materials", included: true },
      { label: "Roznamcha Cash Book & Profit/Loss Export", included: true },
      { label: "Multi-Branch Factory Operations", included: false },
    ],
    featuresMonthly: [
      { label: "7 Days Dedicated Technical Assistance Included", included: true, highlight: true },
      { label: "Local-Network Mobile-to-PC Secure Pairing (Office Wi-Fi)", included: true, highlight: true },
      { label: "AES-256 Encryption & Zero-Internet Local SQLite Engine", included: true, highlight: true },
      { label: "Karigar Piece-Rate Payroll & Peshgi (Advance) Ledger", included: true, highlight: true },
      { label: "Live Raw Material & Wholesale Inventory Management", included: true, highlight: true },
      { label: "Up to 15 Workstation PCs on Local Network", included: true },
      { label: "15 Android Phones on Office Wi-Fi", included: true },
      { label: "Connect up to 4 On-Site IP Cameras via RTSP", included: true },
      { label: "Automatic Reorder Alerts for Raw Materials", included: true },
      { label: "Roznamcha Cash Book & Profit/Loss Export", included: true },
      { label: "Multi-Branch Factory Operations", included: false },
    ],
    featuresAnnual: [
      { label: "1 Month Full Setup Assistance + 6 Months Free Updates", included: true, highlight: true },
      { label: "Local-Network Mobile-to-PC Secure Pairing (Office Wi-Fi)", included: true, highlight: true },
      { label: "AES-256 Encryption & Zero-Internet Local SQLite Engine", included: true, highlight: true },
      { label: "Karigar Piece-Rate Payroll & Peshgi (Advance) Ledger", included: true, highlight: true },
      { label: "Live Raw Material & Wholesale Inventory Management", included: true, highlight: true },
      { label: "Up to 15 Workstation PCs on Local Network", included: true },
      { label: "15 Android Phones on Office Wi-Fi", included: true },
      { label: "Connect up to 4 On-Site IP Cameras via RTSP", included: true },
      { label: "Automatic Reorder Alerts for Raw Materials", included: true },
      { label: "Roznamcha Cash Book & Profit/Loss Export", included: true },
      { label: "Multi-Branch Factory Operations", included: false },
    ],
    cta: "Activate Pro License",
  },
  elite: {
    tierKey: 'elite',
    name: 'Elite Tier',
    primary: true,
    targetAudience: 'Heavy Operations / Multi-Branch Enterprise',
    monthlyPKR: 9999,
    originalMonthlyPKR: 13999,
    annualPKR: 90000,
    originalAnnualPKR: 120000,
    monthlyUSD: 50,
    originalMonthlyUSD: 70,
    annualUSD: 450,
    originalAnnualUSD: 720,
    foundersOfferBadge: "ENTERPRISE VIP DEPLOYMENT",
    monthlySavingsBadge: "Includes 15 days of VIP priority support",
    annualSavingsBadge: "1.5 Months Onboarding Assistance + 12 Months Free Updates & Priority Support",
    supportPackageMonthly: "Includes 15 days of VIP priority support",
    supportPackageAnnual: "Includes 1.5 months of dedicated onboarding assistance + 12 months of free updates & priority support",
    discountPercent: "-29%",
    sub: 'Heavy Operations & Multi-Branch Enterprise · Biometric enclave security, multi-tier mills & VIP priority support.',
    devices: '50 PCs + 50 Mobile Phones',
    features: [
      { label: "Multi-Branch Factory Operations & Real-Time Stock Transfer", included: true, highlight: true },
      { label: "Biometric Hardware Enclave Auth (expo-secure-store & local auth)", included: true, highlight: true },
      { label: "Local-Network Mobile-to-PC Secure Pairing (Up to 50 Devices)", included: true, highlight: true },
      { label: "Advanced Karigar Piece-Rate Engine & Multi-Tier Peshgi Ledgers", included: true, highlight: true },
      { label: "Zero-Internet Offline-First Reliability (AES-256 Local SQLite)", included: true, highlight: true },
      { label: "RS232 Weighbridge Scale Bridge Integration", included: true, highlight: true },
      { label: "Connect up to 6 IP Cameras with Motion Tripwires", included: true },
      { label: "Automatic Reorder & 30-Day Material Predictive Forecasting", included: true },
      { label: "Custom Invoice & Thermal Format Design Studio", included: true },
    ],
    featuresMonthly: [
      { label: "15 Days VIP Priority Support Included", included: true, highlight: true },
      { label: "Multi-Branch Factory Operations & Real-Time Stock Transfer", included: true, highlight: true },
      { label: "Biometric Hardware Enclave Auth (expo-secure-store & local auth)", included: true, highlight: true },
      { label: "Local-Network Mobile-to-PC Secure Pairing (Up to 50 Devices)", included: true, highlight: true },
      { label: "Advanced Karigar Piece-Rate Engine & Multi-Tier Peshgi Ledgers", included: true, highlight: true },
      { label: "Zero-Internet Offline-First Reliability (AES-256 Local SQLite)", included: true, highlight: true },
      { label: "RS232 Weighbridge Scale Bridge Integration", included: true, highlight: true },
      { label: "Connect up to 6 IP Cameras with Motion Tripwires", included: true },
      { label: "Automatic Reorder & 30-Day Material Predictive Forecasting", included: true },
      { label: "Custom Invoice & Thermal Format Design Studio", included: true },
    ],
    featuresAnnual: [
      { label: "1.5 Months Dedicated Onboarding + 12 Months Free Updates & VIP Support", included: true, highlight: true },
      { label: "Multi-Branch Factory Operations & Real-Time Stock Transfer", included: true, highlight: true },
      { label: "Biometric Hardware Enclave Auth (expo-secure-store & local auth)", included: true, highlight: true },
      { label: "Local-Network Mobile-to-PC Secure Pairing (Up to 50 Devices)", included: true, highlight: true },
      { label: "Advanced Karigar Piece-Rate Engine & Multi-Tier Peshgi Ledgers", included: true, highlight: true },
      { label: "Zero-Internet Offline-First Reliability (AES-256 Local SQLite)", included: true, highlight: true },
      { label: "RS232 Weighbridge Scale Bridge Integration", included: true, highlight: true },
      { label: "Connect up to 6 IP Cameras with Motion Tripwires", included: true },
      { label: "Automatic Reorder & 30-Day Material Predictive Forecasting", included: true },
      { label: "Custom Invoice & Thermal Format Design Studio", included: true },
    ],
    cta: "Activate Elite License",
  },
};

const COMPARISON_CATEGORIES = [
  {
    category: "Hardware, Network & Scale",
    features: [
      { name: "Local Workstation PCs (Motherboard Locked)", free: "1 PC", lite: "5 PCs", pro: "15 PCs", elite: "50 PCs" },
      { name: "Android Floor Devices over Local Wi-Fi", free: "—", lite: "5 Devices", pro: "15 Devices", elite: "50 Devices" },
      { name: "Local-Network Mobile-to-PC Secure Pairing", free: "—", lite: "✔ Local Subnet", pro: "✔ High-Speed Bridge", elite: "✔ Multi-Terminal Cluster" },
      { name: "100% Offline SQLite Engine (Zero-Internet Dependency)", free: "✔", lite: "✔", pro: "✔", elite: "✔" },
      { name: "AES-256 Encryption & Biometric Enclave (expo-secure-store)", free: "Basic", lite: "✔", pro: "✔ Military-Grade", elite: "✔ Hardware Enclave" },
      { name: "Multi-Branch Mill Synchronization", free: "—", lite: "—", pro: "—", elite: "✔ Multi-Branch" },
      { name: "Motherboard Re-binding Guarantee", free: "—", lite: "✔", pro: "✔ Unlimited", elite: "✔ Priority" },
    ]
  },
  {
    category: "Manufacturing & Karigar Payroll",
    features: [
      { name: "Karigar Piece-Rate Calculations (Meters / Suits)", free: "—", lite: "—", pro: "✔ Full Engine", elite: "✔ Advanced Multi-Tier" },
      { name: "Peshgi (Advance) Ledger & Worker Balance", free: "—", lite: "—", pro: "✔ Automated", elite: "✔ Automated with Limits" },
      { name: "Daily Worker Attendance & Haazri Log", free: "—", lite: "—", pro: "✔ Included", elite: "✔ Biometric / App" },
      { name: "Yarn & Raw Material Consumption Batches", free: "Basic (200 SKUs)", lite: "Unlimited SKUs", pro: "Batch & Lot Tracking", elite: "30-Day Predictive Demand" },
      { name: "RS232 Weighbridge Scale Integration", free: "—", lite: "—", pro: "Optional Addon", elite: "✔ Built-in Direct Serial" },
    ]
  },
  {
    category: "Wholesale Khata & Financial Ledgers",
    features: [
      { name: "Double-Entry Wholesale Khata", free: "Up to 50 Parties", lite: "Unlimited Parties", pro: "Unlimited with Credit Limits", elite: "Unlimited Multi-Branch" },
      { name: "Roznamcha Daily Cash Book", free: "✔ Basic", lite: "✔ Full", pro: "✔ Advanced Daily Closing", elite: "✔ Audit-Locked Closing" },
      { name: "Lakh & Crore Pakistani Format Reporting", free: "✔", lite: "✔", pro: "✔", elite: "✔" },
      { name: "WhatsApp Statement & PDF Invoice Dispatch", free: "—", lite: "✔ Manual Trigger", pro: "✔ 1-Click Automated", elite: "✔ Automated Scheduled" },
      { name: "Thermal Slip Printing (58mm / 80mm)", free: "✔", lite: "✔", pro: "✔ Custom Headers", elite: "✔ Full Designer Studio" },
    ]
  },
  {
    category: "CCTV Surveillance & Security",
    features: [
      { name: "RTSP IP Camera Live Streaming", free: "—", lite: "—", pro: "Up to 4 Cameras", elite: "Up to 6 Cameras" },
      { name: "Tripwire Motion & Boundary Alerts", free: "—", lite: "—", pro: "Basic Trigger", elite: "✔ AI Sentinel Tripwires" },
      { name: "Local Video Event Logging", free: "—", lite: "—", pro: "✔ 7-Day Local Roll", elite: "✔ 30-Day High-Def Roll" },
      { name: "256-bit Local Database Encryption", free: "✔", lite: "✔", pro: "✔", elite: "✔ Industrial-Grade" },
    ]
  },
  {
    category: "Support, Updates & Onboarding",
    features: [
      { name: "Dedicated Technical Assistance", free: "Community Docs", lite: "Standard WhatsApp", pro: "7 Days (Monthly) / 1 Month (Yearly)", elite: "15 Days VIP (Monthly) / 1.5 Months VIP (Yearly)" },
      { name: "Software Updates Guarantee", free: "Community", lite: "Standard v14+", pro: "6 Months Free Updates (Yearly)", elite: "12 Months Free Updates & VIP Priority (Yearly)" },
      { name: "WhatsApp VIP Desk (+92 326 4742678)", free: "—", lite: "Standard WhatsApp", pro: "Priority WhatsApp (<1h)", elite: "Direct Senior Engineer VIP Line" },
      { name: "Remote AnyDesk Setup & Migration", free: "—", lite: "Self-Install Guides", pro: "Full Setup Assistance Call", elite: "✔ Turnkey Onboarding & Staff Training" },
    ]
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
  const [selectedPlan, setSelectedPlan] = useState<{ tier: string; price: string; tierKey?: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'raqami' | 'jazzcash' | 'easypaisa'>('raqami');
  const [copied, setCopied] = useState(false);
  const [txId, setTxId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [hwidInput, setHwidInput] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Interactive ROI Calculator State
  const [karigarCount, setKarigarCount] = useState<number>(20);
  const [clerkSalary, setClerkSalary] = useState<number>(35000);

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

  const handlePurchase = (plan: string, price: string, tierKey?: string) => {
    setSelectedPlan({ 
      tier: plan, 
      price: `${price} (${billingCycle})`,
      tierKey: tierKey || 'pro',
    });
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
      paymentMethod === 'raqami' ? 'Raqami Islamic Digital Bank' :
      paymentMethod === 'jazzcash' ? 'JazzCash Mobile Account' :
      'EasyPaisa Mobile Account';
    
    const methodDetails =
      paymentMethod === 'raqami' 
        ? 'PK09RQMI0000023005156748 (Account: 023005156748)' 
        : paymentMethod === 'jazzcash' 
          ? '0326-4742678' 
          : '03218338768';

    const cleanBiz = customerName.trim() || profile?.business_name || '';
    const cleanHwid = hwidInput.trim();

    if (cleanHwid) {
      navigator.clipboard.writeText(cleanHwid);
    }

    const msg = encodeURIComponent(
      `Assalam o Alaikum Omnora Labs,\n\n` +
      `I have sent the payment of ${selectedPlan.price} for the Noxis *${selectedPlan.tier}* (${billingCycle.toUpperCase()} billing).\n\n` +
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
          tier: selectedPlan.tierKey || selectedPlan.tier.toLowerCase().replace(' tier', ''),
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

  // ROI Calculator Calculations
  const hoursSavedPerWeek = Math.round(karigarCount * 0.8 + 4);
  const ghostWageLossPrevented = Math.round(karigarCount * 1250);
  const netMonthlyValue = Math.round(clerkSalary * 0.65 + ghostWageLossPrevented);
  const netAnnualValue = netMonthlyValue * 12;

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
              Built for Textile Mills &amp; Manufacturing · 100% Offline Local SQLite
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4 uppercase">
            Noxis<span className="text-[#08EBF6]">Hub</span> Pricing
          </h1>
          <p className="text-[#5FA5FA] uppercase tracking-[0.25em] text-[10px] sm:text-xs font-bold max-w-2xl mx-auto">
            Transparent, predictable pricing for manufacturing units, weaving mills, and wholesale traders. Works completely offline.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
            {/* Billing Toggle (Monthly / Annual) */}
            <div className="bg-[#030712] p-1.5 rounded-md border border-[#08EBF6]/30 flex w-fit shadow-2xl relative">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  "px-6 sm:px-8 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-md cursor-pointer",
                  billingCycle === 'monthly' ? 'bg-[#08EBF6] text-black shadow-[0_0_15px_rgba(8,235,246,0.4)]' : 'text-slate-400 hover:text-white'
                )}
              >
                Monthly Plan
              </button>
              <button 
                onClick={() => setBillingCycle('annual')}
                className={cn(
                  "px-6 sm:px-8 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all relative rounded-md cursor-pointer",
                  billingCycle === 'annual' ? 'bg-[#08EBF6] text-black shadow-[0_0_15px_rgba(8,235,246,0.4)]' : 'text-slate-400 hover:text-white'
                )}
              >
                Annual License
                <span className="absolute -top-3.5 -right-3.5 bg-[#5FA5FA] text-[8px] px-2 py-0.5 rounded-md text-black font-black uppercase shadow-md">
                  SAVE UP TO 30%
                </span>
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

          {/* Quick Notice on Billing */}
          <p className="text-[11px] text-gray-500 mt-4">
            {billingCycle === 'monthly' ? (
              <span>⚡ Showing <strong className="text-white">Monthly rates</strong>. Pay month-by-month with zero long-term commitment.</span>
            ) : (
              <span>🎉 Showing <strong className="text-emerald-400">Annual rates</strong>. 12 months unlocked with maximum discount &amp; free hardware re-binding.</span>
            )}
          </p>
        </motion.div>

        {/* ═══ CORE ARCHITECTURAL CAPABILITIES ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-[#0B0E14] border border-[#00E5FF]/20 p-5 rounded-md relative overflow-hidden group hover:border-[#00E5FF]/50 transition-colors shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center mb-3">
              <Wifi size={20} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">
              Local Mobile-to-PC Pairing
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Instant QR pairing over local workshop Wi-Fi. Real-time sub-millisecond bidirectional WebSocket bridge with zero cloud dependency.
            </p>
          </div>

          <div className="bg-[#0B0E14] border border-[#10B981]/20 p-5 rounded-md relative overflow-hidden group hover:border-[#10B981]/50 transition-colors shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mb-3">
              <Lock size={20} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">
              AES-256 &amp; Biometric Enclave
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Hardware enclave authentication via expo-secure-store &amp; expo-local-authentication with 256-bit encrypted local storage.
            </p>
          </div>

          <div className="bg-[#0B0E14] border border-amber-500/20 p-5 rounded-md relative overflow-hidden group hover:border-amber-500/50 transition-colors shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <Users size={20} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">
              Karigar Payroll &amp; Peshgi
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Industrial piece-rate engine (meters, suits, pieces), daily attendance, live inventory deduction, and automated cash advance balances.
            </p>
          </div>

          <div className="bg-[#0B0E14] border border-purple-500/20 p-5 rounded-md relative overflow-hidden group hover:border-purple-500/50 transition-colors shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <HardDrive size={20} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">
              Zero-Internet Offline-First
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              100% offline-first reliability. Local SQLite engine runs on your PC storage, completely immune to internet outages or cloud downtime.
            </p>
          </div>
        </motion.div>

        {/* ═══ 7-DAY EVALUATION & FREEMIUM GUARANTEE BANNER ═══ */}
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
                  7-Day Free Evaluation + Free Forever Fallback
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Test Every Feature on Your Factory PC. <span className="text-blue-400">Zero Risk of Data Loss.</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl font-normal">
                Download the installer, run setup, and start using immediately. No credit card, no email registration, and no internet required. After 7 days, your data stays completely safe on your hard drive — continue using the <strong className="text-white">Free Forever</strong> tier (POS counter, basic ledger, and full data access forever) or activate your license via Raqami Islamic Digital Bank or JazzCash.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <div className="bg-white/5 border border-white/10 p-4 rounded-sm space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-white uppercase tracking-wider">
                  <span>Days 1–7 (Full Pro Access)</span>
                  <span className="text-emerald-400">All Features Unlocked</span>
                </div>
                <p className="text-[10px] text-slate-400">Karigar Piece-Rates, Fabric Inventory, Khata, Vouchers &amp; Phone Pairing</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-sm space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-white uppercase tracking-wider">
                  <span>Day 8+ (Free Forever Fallback)</span>
                  <span className="text-blue-400">Free Forever Tier</span>
                </div>
                <p className="text-[10px] text-slate-400">POS Counter Open Forever · 200 SKUs · 50 Parties · Full PDF/Excel Export</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards Grid (Free, Lite, Pro, Elite) */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {/* Free Forever */}
          <PricingCard 
            tier={PRICING_DATA.free.name}
            region={region}
            displayCurrency={displayCurrency}
            localCurrency={localCurrency}
            pricePKR={PRICING_DATA.free.monthlyPKR}
            priceUSD={PRICING_DATA.free.monthlyUSD}
            billingCycle={billingCycle}
            period="forever"
            sub={PRICING_DATA.free.sub}
            features={PRICING_DATA.free.features}
            cta={PRICING_DATA.free.cta}
            onPurchase={() => window.location.href = '/download'}
            variant={fadeInUp}
          />

          {/* Lite Tier */}
          <PricingCard 
            tier={PRICING_DATA.lite.name}
            region={region}
            displayCurrency={displayCurrency}
            localCurrency={localCurrency}
            pricePKR={billingCycle === 'monthly' ? PRICING_DATA.lite.monthlyPKR : PRICING_DATA.lite.annualPKR}
            originalPricePKR={billingCycle === 'monthly' ? PRICING_DATA.lite.originalMonthlyPKR : PRICING_DATA.lite.originalAnnualPKR}
            priceUSD={billingCycle === 'monthly' ? PRICING_DATA.lite.monthlyUSD : PRICING_DATA.lite.annualUSD}
            originalPriceUSD={billingCycle === 'monthly' ? PRICING_DATA.lite.originalMonthlyUSD : PRICING_DATA.lite.originalAnnualUSD}
            billingCycle={billingCycle}
            period={billingCycle === 'monthly' ? 'mo' : 'yr'}
            savingsBadge={billingCycle === 'monthly' ? PRICING_DATA.lite.monthlySavingsBadge : PRICING_DATA.lite.annualSavingsBadge}
            discountPercent={PRICING_DATA.lite.discountPercent}
            sub={PRICING_DATA.lite.sub}
            features={PRICING_DATA.lite.features}
            cta={PRICING_DATA.lite.cta}
            onPurchase={(name: string, price: string) => handlePurchase(name, price, 'lite')}
            onHwidClick={() => handleActivateHwid('lite')}
            variant={fadeInUp}
          />

          {/* Pro Tier */}
          <PricingCard 
            tier={PRICING_DATA.pro.name}
            popular
            foundersOfferBadge={PRICING_DATA.pro.foundersOfferBadge}
            region={region}
            displayCurrency={displayCurrency}
            localCurrency={localCurrency}
            pricePKR={billingCycle === 'monthly' ? PRICING_DATA.pro.monthlyPKR : PRICING_DATA.pro.annualPKR}
            originalPricePKR={billingCycle === 'monthly' ? PRICING_DATA.pro.originalMonthlyPKR : PRICING_DATA.pro.originalAnnualPKR}
            priceUSD={billingCycle === 'monthly' ? PRICING_DATA.pro.monthlyUSD : PRICING_DATA.pro.annualUSD}
            originalPriceUSD={billingCycle === 'monthly' ? PRICING_DATA.pro.originalMonthlyUSD : PRICING_DATA.pro.originalAnnualUSD}
            billingCycle={billingCycle}
            period={billingCycle === 'monthly' ? 'mo' : 'yr'}
            savingsBadge={billingCycle === 'monthly' ? PRICING_DATA.pro.monthlySavingsBadge : PRICING_DATA.pro.annualSavingsBadge}
            supportPackage={billingCycle === 'monthly' ? PRICING_DATA.pro.supportPackageMonthly : PRICING_DATA.pro.supportPackageAnnual}
            discountPercent={PRICING_DATA.pro.discountPercent}
            sub={PRICING_DATA.pro.sub}
            features={billingCycle === 'monthly' ? PRICING_DATA.pro.featuresMonthly : PRICING_DATA.pro.featuresAnnual}
            cta={PRICING_DATA.pro.cta}
            onPurchase={(name: string, price: string) => handlePurchase(name, price, 'pro')}
            onHwidClick={() => handleActivateHwid('pro')}
            variant={fadeInUp}
          />

          {/* Elite Tier */}
          <PricingCard 
            tier={PRICING_DATA.elite.name}
            primary
            foundersOfferBadge={PRICING_DATA.elite.foundersOfferBadge}
            region={region}
            displayCurrency={displayCurrency}
            localCurrency={localCurrency}
            pricePKR={billingCycle === 'monthly' ? PRICING_DATA.elite.monthlyPKR : PRICING_DATA.elite.annualPKR}
            originalPricePKR={billingCycle === 'monthly' ? PRICING_DATA.elite.originalMonthlyPKR : PRICING_DATA.elite.originalAnnualPKR}
            priceUSD={billingCycle === 'monthly' ? PRICING_DATA.elite.monthlyUSD : PRICING_DATA.elite.annualUSD}
            originalPriceUSD={billingCycle === 'monthly' ? PRICING_DATA.elite.originalMonthlyUSD : PRICING_DATA.elite.originalAnnualUSD}
            billingCycle={billingCycle}
            period={billingCycle === 'monthly' ? 'mo' : 'yr'}
            savingsBadge={billingCycle === 'monthly' ? PRICING_DATA.elite.monthlySavingsBadge : PRICING_DATA.elite.annualSavingsBadge}
            supportPackage={billingCycle === 'monthly' ? PRICING_DATA.elite.supportPackageMonthly : PRICING_DATA.elite.supportPackageAnnual}
            discountPercent={PRICING_DATA.elite.discountPercent}
            sub={PRICING_DATA.elite.sub}
            features={billingCycle === 'monthly' ? PRICING_DATA.elite.featuresMonthly : PRICING_DATA.elite.featuresAnnual}
            cta={PRICING_DATA.elite.cta}
            onPurchase={(name: string, price: string) => handlePurchase(name, price, 'elite')}
            onHwidClick={() => handleActivateHwid('elite')}
            variant={fadeInUp}
          />
        </motion.div>

        {/* ═══ INTERACTIVE FACTORY ROI & PAYROLL CALCULATOR ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-[#0B0E14] border border-cyan-500/20 rounded-md p-6 sm:p-10 mb-20 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                <Calculator size={14} />
                <span>Interactive Factory Economics</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Factory ROI &amp; Karigar Payroll Savings Calculator
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                See exactly how much time and money Noxis Hub saves your mill compared to manual paper khatas or fragmented clerks.
              </p>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-sm text-right shrink-0">
              <span className="text-[9px] uppercase tracking-wider text-cyan-400 block font-bold">Estimated Mill Net Return</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-white">
                Rs. {netAnnualValue.toLocaleString()} / yr
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders / Inputs */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Number of Karigars / Looms / Workers
                  </label>
                  <span className="text-sm font-mono font-black text-cyan-400 bg-black/40 px-3 py-1 rounded border border-white/10">
                    {karigarCount} Workers
                  </span>
                </div>
                <input 
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={karigarCount}
                  onChange={(e) => setKarigarCount(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                  <span>5 (Workshop)</span>
                  <span>30 (Small Mill)</span>
                  <span>75 (Large Weaving)</span>
                  <span>120+ (Industrial)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Average Bookkeeper / Munshi Salary (Rs.)
                  </label>
                  <span className="text-sm font-mono font-black text-cyan-400 bg-black/40 px-3 py-1 rounded border border-white/10">
                    Rs. {clerkSalary.toLocaleString()} / mo
                  </span>
                </div>
                <input 
                  type="range"
                  min="20000"
                  max="80000"
                  step="5000"
                  value={clerkSalary}
                  onChange={(e) => setClerkSalary(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                  <span>Rs. 20,000</span>
                  <span>Rs. 35,000 (Average)</span>
                  <span>Rs. 50,000</span>
                  <span>Rs. 80,000</span>
                </div>
              </div>

              <div className="p-3.5 bg-black/40 border border-white/5 rounded-sm space-y-1 text-xs">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">💡 Recommended Setup:</span>
                <p className="text-gray-300">
                  For {karigarCount} workers, our <strong className="text-white">Pro Tier (15 Looms)</strong> or <strong className="text-cyan-400">Elite Tier (50 Looms)</strong> pays for itself within the first 7 days of operation.
                </p>
              </div>
            </div>

            {/* Metric Output Cards */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="p-5 bg-black/50 border border-white/5 rounded-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Weekly Time Saved</span>
                <p className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 mt-1">{hoursSavedPerWeek} Hours</p>
                <p className="text-[10px] text-gray-400 mt-1">Instant piece-rate calculations replace manual ledger cross-checks.</p>
              </div>

              <div className="p-5 bg-black/50 border border-white/5 rounded-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Peshgi Leakage Stopped</span>
                <p className="text-2xl sm:text-3xl font-mono font-black text-cyan-400 mt-1">Rs. {ghostWageLossPrevented.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 mt-1">Stops ghost entries, unpaid advance carryovers, and meter discrepancies.</p>
              </div>

              <div className="p-5 bg-black/50 border border-white/5 rounded-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Monthly Clerical Cost Saved</span>
                <p className="text-2xl sm:text-3xl font-mono font-black text-white mt-1">Rs. {Math.round(clerkSalary * 0.65).toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 mt-1">Automated Khata eliminates duplicate recordkeeping overhead.</p>
              </div>

              <div className="p-5 bg-cyan-950/20 border border-cyan-500/30 rounded-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">Net Annual Value</span>
                <p className="text-2xl sm:text-3xl font-mono font-black text-cyan-300 mt-1">Rs. {netAnnualValue.toLocaleString()}</p>
                <p className="text-[10px] text-cyan-200/70 mt-1">Pure operating profit saved straight to your factory ledger.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ COMPREHENSIVE FEATURE COMPARISON MATRIX ═══ */}
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#08EBF6] bg-[#08EBF6]/10 px-3 py-1 rounded-full border border-[#08EBF6]/20">
              Side-by-Side Breakdown
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase mt-3">
              Comprehensive Feature Comparison
            </h2>
            <p className="text-xs text-gray-400 mt-2">
              Every capability detailed across all four tiers so you choose the exact capacity your factory needs.
            </p>
          </div>

          <div className="bg-[#0B0D12] border border-white/10 rounded-sm overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-black/60 sticky top-0 z-20">
                    <th className="p-4 sm:p-5 text-gray-400 font-black uppercase tracking-wider w-1/3">
                      Features &amp; Specifications
                    </th>
                    <th className="p-4 sm:p-5 text-center text-slate-300 font-bold uppercase tracking-wider">
                      Free Forever
                    </th>
                    <th className="p-4 sm:p-5 text-center text-blue-400 font-bold uppercase tracking-wider">
                      Lite Tier
                    </th>
                    <th className="p-4 sm:p-5 text-center text-[#08EBF6] font-black uppercase tracking-wider bg-[#08EBF6]/5">
                      Pro Tier (Popular)
                    </th>
                    <th className="p-4 sm:p-5 text-center text-amber-400 font-black uppercase tracking-wider">
                      Elite Tier
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {COMPARISON_CATEGORIES.map((cat, catIdx) => (
                    <React.Fragment key={catIdx}>
                      <tr className="bg-white/[0.02]">
                        <td colSpan={5} className="py-3 px-5 text-[11px] font-black uppercase tracking-widest text-[#08EBF6] bg-black/40">
                          {cat.category}
                        </td>
                      </tr>
                      {cat.features.map((f, fIdx) => (
                        <tr key={fIdx} className="hover:bg-white/[0.015] transition-colors">
                          <td className="p-4 text-gray-300 font-medium border-r border-white/5">
                            {f.name}
                          </td>
                          <td className="p-4 text-center font-mono text-gray-400 border-r border-white/5">
                            {f.free}
                          </td>
                          <td className="p-4 text-center font-mono text-slate-300 border-r border-white/5">
                            {f.lite}
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-white bg-[#08EBF6]/[0.02] border-r border-white/5">
                            {f.pro}
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-amber-300">
                            {f.elite}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-black/60 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-gray-400">
                Not sure which plan matches your machines? Message our engineering desk for advice.
              </span>
              <a
                href="https://wa.me/923264742678?text=Assalam%20o%20Alaikum%2C%20I%20need%20help%20choosing%20the%20right%20Noxis%20Hub%20tier%20for%20my%20factory."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-black font-black uppercase tracking-wider text-xs rounded-sm transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <MessageCircle size={14} />
                <span>Ask via WhatsApp (+92 326 4742678)</span>
              </a>
            </div>
          </div>
        </div>

        {/* ═══ ACCEPTED LOCAL PAYMENT METHODS (Raqami & JazzCash) ═══ */}
        <div className="p-6 bg-[#0F1114] border border-white/10 rounded-sm max-w-xl mx-auto mb-20 shadow-xl">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#08EBF6] mb-1 text-center">
            Accepted Official Payment Channels
          </p>
          <p className="text-[10px] text-gray-500 mb-4 text-center">
            Zero card processing surcharges. Direct instant account transfer.
          </p>
          <div className="space-y-3">
            {[
              { 
                method: 'Raqami Islamic Digital Bank', 
                number: 'PK09RQMI0000023005156748', 
                accountNo: '023005156748',
                note: 'AHMED MEHBOOB • Official IBAN / Raast Account' 
              },
              { 
                method: 'JazzCash Mobile Account', 
                number: '0326-4742678', 
                numberRaw: '03264742678', 
                note: 'Ahmad Mahboob • Instant Mobile Wallet' 
              },
            ].map(p => (
              <div key={p.method} className="p-3 bg-black/40 border border-white/5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>{p.method}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{p.note}</p>
                  {p.accountNo && (
                    <p className="text-[10px] text-gray-500 font-mono">A/C: {p.accountNo}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <code className="text-xs font-mono text-cyan-300 break-all select-all">
                    {p.number}
                  </code>
                  <button 
                    onClick={() => handleCopy(p.numberRaw || p.number)}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Click to copy"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-4 leading-relaxed text-center font-normal">
            Transfer the plan fee, then WhatsApp your transaction slip &amp; Machine ID to 
            <strong className="text-white"> +92 326 4742678</strong>. Your permanent key is verified within 30 minutes.
          </p>
        </div>

        {/* ═══ 4 CORE GUARANTEES GRID ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          <div className="p-5 bg-[#0C0E12] border border-white/5 rounded-sm space-y-2">
            <div className="w-8 h-8 rounded-sm bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock size={16} />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">100% Offline Privacy</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Your sales ledgers, customer phones, and Karigar piece-rates never touch any external server.
            </p>
          </div>

          <div className="p-5 bg-[#0C0E12] border border-white/5 rounded-sm space-y-2">
            <div className="w-8 h-8 rounded-sm bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Award size={16} />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Perpetual Data Safety</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              We never delete or lock your hard drive data. Free tier stays active forever even if you stop paying.
            </p>
          </div>

          <div className="p-5 bg-[#0C0E12] border border-white/5 rounded-sm space-y-2">
            <div className="w-8 h-8 rounded-sm bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock size={16} />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">30-Min Key Verification</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Raqami Bank and JazzCash payments are processed instantly by Omnora engineers on WhatsApp.
            </p>
          </div>

          <div className="p-5 bg-[#0C0E12] border border-white/5 rounded-sm space-y-2">
            <div className="w-8 h-8 rounded-sm bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <RefreshCw size={16} />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Hardware Re-Binding</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Changed your office PC or motherboard? We re-bind your permanent license for free in 5 minutes.
            </p>
          </div>
        </div>

        {/* ═══ ENTERPRISE & LARGE MILL CUSTOM ROLLOUT BANNER ═══ */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-[#12151C] via-[#101318] to-[#12151C] border border-white/10 p-8 md:p-12 relative overflow-hidden rounded-sm mb-24 shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-3">
                <Building2 size={13} />
                <span>Large Mill Deployments &amp; Industrial Clusters</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase italic mb-4">
                Have 50+ Looms or Multi-Factory Operations?
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                Noxis Hub provides specialized industrial packages for spinning mills, rice processing hubs, and textile composite units: custom RS232 weighbridge serial drivers, barcode fabric bolt tagging, and on-site engineering setup.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://wa.me/923264742678?text=Assalam%20o%20Alaikum%2C%20we%20have%20a%20large%20industrial%20facility%20and%20need%20a%20custom%20Noxis%20Hub%20deployment%20quote."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-[#08EBF6] text-black font-black uppercase tracking-wider text-xs rounded-sm hover:bg-[#08EBF6]/90 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(8,235,246,0.25)]"
                >
                  <MessageCircle size={15} />
                  <span>Talk with Lead Engineer</span>
                </a>
                <button
                  onClick={() => handleActivateHwid('elite')}
                  className="px-6 py-3 bg-white/10 text-white font-black uppercase tracking-wider text-xs rounded-sm hover:bg-white/20 transition-all border border-white/10"
                >
                  Activate Elite Tier
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/60 border border-white/5 space-y-3 rounded-sm">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Textile Weaving &amp; Sizing</p>
                <div className="space-y-1.5 font-mono text-[10px] text-gray-400">
                  <p>✔ Karigar Piece-Rate Wage Logs</p>
                  <p>✔ Yarn Cone LBs &amp; KG Reconciliation</p>
                  <p>✔ Local Wi-Fi Android Floor Logging</p>
                </div>
              </div>
              <div className="p-4 bg-black/60 border border-white/5 space-y-3 rounded-sm">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Wholesale &amp; Processing</p>
                <div className="space-y-1.5 font-mono text-[10px] text-gray-400">
                  <p>✔ Double-Entry Wholesale Khata</p>
                  <p>✔ 58mm/80mm Thermal Receipt Printing</p>
                  <p>✔ RS232 Weighbridge Direct Scale</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
 
        {/* FAQs */}
        <div className="max-w-4xl mx-auto mb-16">
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

      {/* HWID Activation Modal */}
      <HWIDActivationModal 
        isOpen={hwidModalOpen}
        onClose={() => setHwidModalOpen(false)}
        initialTier={selectedTierForHwid}
      />

      {/* Checkout Modal (Raqami, JazzCash, Instant TID, WhatsApp) */}
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
                <span className="text-[9px] font-black uppercase tracking-widest text-[#08EBF6]">Official License Activation</span>
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
                    { id: 'raqami', label: 'Raqami Bank' },
                    { id: 'jazzcash', label: 'JazzCash' },
                    { id: 'easypaisa', label: 'EasyPaisa' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setPaymentMethod(tab.id as any)}
                      className={cn(
                        "flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm cursor-pointer",
                        paymentMethod === tab.id ? 'bg-[#08EBF6] text-black font-black shadow-[0_0_12px_rgba(8,235,246,0.3)]' : 'text-gray-500 hover:text-gray-300'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="bg-white/5 border border-white/5 p-4 rounded-sm space-y-4">
                  {paymentMethod === 'raqami' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 uppercase tracking-wider text-[10px]">Bank Partner</span>
                        <span className="text-white font-bold">Raqami Islamic Digital Bank</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 uppercase tracking-wider text-[10px]">Account Title</span>
                        <span className="text-white font-bold">AHMED MEHBOOB</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 uppercase tracking-wider text-[10px]">Account Number</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 font-mono text-xs">023005156748</span>
                          <button
                            onClick={() => handleCopy('023005156748')}
                            className="text-[#08EBF6] hover:text-white shrink-0 transition-colors cursor-pointer"
                            title="Copy Account Number"
                          >
                            {copied ? 'Copied' : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500 uppercase tracking-wider text-[10px] block">IBAN / Raast Account</span>
                        <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-sm">
                          <code className="text-xs font-mono text-gray-300 break-all">PK09RQMI0000023005156748</code>
                          <button
                            onClick={() => handleCopy('PK09RQMI0000023005156748')}
                            className="text-[#08EBF6] hover:text-white ml-2 shrink-0 transition-colors cursor-pointer"
                            title="Copy IBAN"
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
                        <span className="text-white font-bold">Ahmad Mahboob</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500 uppercase tracking-wider text-[10px] block">Mobile Account Number</span>
                        <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-sm">
                          <code className="text-xs font-mono text-gray-300">0326-4742678</code>
                          <button
                            onClick={() => handleCopy('03264742678')}
                            className="text-[#08EBF6] hover:text-white ml-2 shrink-0 transition-colors cursor-pointer"
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
                            className="text-[#08EBF6] hover:text-white ml-2 shrink-0 transition-colors cursor-pointer"
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

    </div>
  );
}
 
function PricingCard({ 
  tier, pricePKR, originalPricePKR, priceUSD, originalPriceUSD, period = 'mo', sub, features, cta, onPurchase, 
  onHwidClick, popular, primary, region, displayCurrency, localCurrency, variant,
  billingCycle, savingsBadge, discountPercent, foundersOfferBadge, supportPackage
}: any) {
  
  const isSA = region === 'south_asian';
  const useUSD = displayCurrency === 'USD';
  
  const displayPrice = isSA 
    ? (pricePKR === 0 ? 'Rs. 0' : `Rs. ${pricePKR.toLocaleString()}`)
    : useUSD 
      ? (priceUSD === 0 ? '$0' : `$${priceUSD}`)
      : (pricePKR === 0 ? 'Rs. 0' : formatCurrency(pricePKR, localCurrency).replace(/\.00$/, ''));

  const originalDisplayPrice = originalPricePKR && originalPricePKR > 0
    ? (isSA 
        ? `Rs. ${originalPricePKR.toLocaleString()}`
        : useUSD 
          ? (originalPriceUSD ? `$${originalPriceUSD}` : undefined)
          : formatCurrency(originalPricePKR, localCurrency).replace(/\.00$/, ''))
    : null;

  return (
    <motion.div 
      variants={variant}
      className={cn(
        "relative flex flex-col p-6 transition-all duration-300 rounded-md",
        popular 
          ? "bg-gradient-to-b from-[#0B1522] via-[#070D16] to-[#03060C] border-2 border-[#00E5FF] shadow-[0_0_40px_rgba(0,229,255,0.25),inset_0_0_20px_rgba(0,229,255,0.05)] ring-1 ring-[#00E5FF]/50 z-10" 
          : primary
            ? "bg-gradient-to-b from-[#08121D] to-[#03070E] border border-[#00E5FF]/40 hover:border-[#00E5FF] hover:shadow-[0_0_30px_rgba(0,229,255,0.2)]"
            : tier === 'Lite Tier'
              ? "bg-[#030712] border border-[#10B981]/40 hover:border-[#10B981] hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              : "bg-[#030712] border border-white/10 hover:border-white/20"
      )}
    >
      {/* Top Banner on Most Popular */}
      {popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00E5FF] to-[#10B981] text-black text-[9px] font-black uppercase tracking-[0.25em] px-4 py-1 whitespace-nowrap rounded-md shadow-[0_0_15px_rgba(0,229,255,0.6)]">
          Most Popular for Mills
        </div>
      )}

      {/* Founders Offer / Launch Discount Badge */}
      {foundersOfferBadge ? (
        <div className="mb-3.5 inline-flex items-center gap-2 px-3 py-1 rounded bg-[#00E5FF]/10 border border-[#00E5FF] text-[#00E5FF] text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,229,255,0.3)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
          </span>
          <span>{foundersOfferBadge}</span>
        </div>
      ) : discountPercent ? (
        <div className="mb-3.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-[9px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.15)]">
          <Sparkles size={11} className="text-[#00E5FF]" />
          <span>Launch Offer ({discountPercent})</span>
        </div>
      ) : null}

      <div className="mb-5">
        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{tier}</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed min-h-[32px]">{sub}</p>
      </div>

      <div className="mb-6">
        {/* Strikethrough Original Price + Cybernetic Tag */}
        {originalDisplayPrice && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-mono line-through text-slate-500 font-bold tracking-tight">
              {originalDisplayPrice}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
              {discountPercent ? `${discountPercent} OFF` : 'LAUNCH DISCOUNT'}
            </span>
          </div>
        )}

        {/* Current Active Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(0,229,255,0.25)]">
            {displayPrice}
          </span>
          <span className="text-[10px] font-black text-[#00E5FF] uppercase tracking-wider">
            / {period === 'mo' ? 'MONTH' : period === 'yr' ? 'YEAR' : 'FOREVER'}
          </span>
        </div>

        {/* Savings Badge */}
        {savingsBadge && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 text-[9px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2.5 py-1 rounded shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <Sparkles size={11} className="text-[#00E5FF] shrink-0" />
            <span>{savingsBadge}</span>
          </div>
        )}

        {billingCycle === 'monthly' && pricePKR > 0 && (
          <p className="text-[9px] text-slate-500 font-medium mt-1.5">
            Billed monthly · Zero long-term commitment
          </p>
        )}

        {pricePKR > 0 && (isSA || !useUSD) && (
          <p className="text-[9px] text-slate-500 font-mono mt-1 italic">
            ≈ ${priceUSD} USD / {period === 'mo' ? 'mo' : 'yr'}
          </p>
        )}
      </div>

      {/* Support & Assistance Tier Guarantee */}
      {supportPackage && (
        <div className="mb-5 p-3 rounded bg-[#00E5FF]/5 border border-[#00E5FF]/25 shadow-[0_0_15px_rgba(0,229,255,0.08)]">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[#00E5FF] mb-1">
            <ShieldCheck size={13} className="text-[#10B981]" />
            <span>Guaranteed Technical Support</span>
          </div>
          <p className="text-[11px] font-bold text-white leading-snug">
            {supportPackage}
          </p>
        </div>
      )}

      <div className="flex-1 space-y-3.5 mb-8">
        {features.map((f: any, i: number) => (
          <div key={i} className={cn("flex items-start space-x-3 text-[11px]", f.included ? "text-slate-300" : "text-slate-600")}>
            {f.included ? (
              <Check size={14} className={f.highlight ? "text-[#00E5FF] shrink-0 font-bold" : "text-[#10B981] shrink-0"} />
            ) : (
              <X size={14} className="text-slate-700 shrink-0" />
            )}
            <span className={cn(f.highlight && "text-white font-black uppercase tracking-tight")}>{f.label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <button 
          onClick={() => onPurchase(tier, displayPrice)}
          className={cn(
            "block w-full py-3.5 text-center text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-md cursor-pointer",
            popular 
              ? "bg-gradient-to-r from-[#00E5FF] via-[#10B981] to-[#00E5FF] text-black hover:brightness-110 active:scale-95 shadow-[0_0_25px_rgba(0,229,255,0.4)]" 
              : primary
                ? "bg-gradient-to-r from-[#00E5FF] to-[#3B82F6] text-black hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(0,229,255,0.3)]" 
                : tier === 'Lite Tier'
                  ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/50 hover:bg-[#10B981] hover:text-black active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "bg-white/10 text-white hover:bg-white/20 hover:text-[#00E5FF] border border-white/10 active:scale-95"
          )}
        >
          {cta}
        </button>

        {onHwidClick && (
          <button
            onClick={onHwidClick}
            className="w-full text-center text-[9px] text-gray-500 hover:text-[#00E5FF] py-1 transition-colors uppercase tracking-wider font-mono cursor-pointer"
          >
            Or Activate with Machine ID (HWID) →
          </button>
        )}
      </div>
    </motion.div>
  );
}