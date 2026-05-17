// app/docs/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Book, Cpu, ShieldCheck, Zap, 
  Search, Info, FileText, Settings, 
  HelpCircle, Layers, CreditCard, Users,
  ArrowRight, Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    color: "text-electric-blue",
    articles: [
      { title: "Installation Guide", href: "/docs/getting-started/installation" },
      { title: "Mobile Device Pairing", href: "/docs/getting-started/mobile-pairing" }
    ]
  },
  {
    id: "inventory",
    title: "Inventory Management",
    icon: Layers,
    color: "text-amber-500",
    articles: [
      { title: "Adding SKUs", href: "/docs/inventory/adding-skus" },
      { title: "Stock Adjustments", href: "/docs/inventory/skus" }
    ]
  },
  {
    id: "finance",
    title: "Financial Ledger (Khata)",
    icon: CreditCard,
    color: "text-emerald-500",
    articles: [
      { title: "Creating Invoices", href: "/docs/finance/creating-invoices" },
      { title: "Ledger Reconciliation", href: "/docs/finance/ledger" }
    ]
  },
  {
    id: "payroll",
    title: "Karigar Payroll",
    icon: Users,
    color: "text-purple-400",
    articles: [
      { title: "Managing Karigars", href: "/docs/payroll/karigars" },
      { title: "Running Payroll", href: "/docs/payroll/running" }
    ]
  },
  {
    id: "cctv",
    title: "CCTV & Security",
    icon: ShieldCheck,
    color: "text-red-500",
    articles: [
      { title: "Adding Cameras", href: "/docs/cctv/adding" },
      { title: "Security Alerts", href: "/docs/cctv/alerts" }
    ]
  },
  {
    id: "api",
    title: "API & Webhooks",
    icon: Terminal,
    color: "text-cyan-400",
    articles: [
      { title: "NSP Protocol", href: "/docs/api/nsp" },
      { title: "Webhook Integration", href: "/docs/api/webhooks" }
    ]
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: HelpCircle,
    color: "text-orange-400",
    articles: [
      { title: "Connection Issues", href: "/docs/troubleshooting/connection-issues" },
      { title: "Sync Failures", href: "/docs/troubleshooting/sync" }
    ]
  }
];

export default function DocsIndex() {
  const [search, setSearch] = useState("");

  const filteredCategories = CATEGORIES.filter(cat => 
    cat.title.toLowerCase().includes(search.toLowerCase()) ||
    cat.articles.some(art => art.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-12 max-w-7xl mx-auto space-y-16">
      {/* Hero */}
      <section className="space-y-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
          <Info size={12} className="text-electric-blue" />
          <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Knowledge Base v13.0</span>
        </div>
        <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
          Noxis <span className="text-gray-600">Documentation</span>
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed">
          Operational protocols, system architecture, and troubleshooting guides for the Noxis Industrial Hub ecosystem.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mt-12 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-electric-blue transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search for articles, protocols, or error codes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1A1D21] border border-white/5 rounded-sm py-5 pl-14 pr-6 text-sm text-white focus:border-electric-blue/50 outline-none transition-all placeholder:text-gray-700"
          />
        </div>
      </section>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="bg-[#1A1D21] border border-white/5 p-8 flex flex-col space-y-6 group hover:border-white/10 transition-all">
             <div className="flex items-center space-x-4">
                <div className={cn("p-4 bg-white/5", cat.color)}>
                   <cat.icon size={24} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white">{cat.title}</h3>
             </div>

             <div className="space-y-3 flex-1">
                {cat.articles.map((art, idx) => (
                  <Link 
                    key={idx} 
                    href={art.href}
                    className="flex items-center justify-between p-3 bg-black/20 border border-white/[0.02] hover:border-white/10 text-xs font-medium text-gray-400 hover:text-white transition-all group/art"
                  >
                    <span>{art.title}</span>
                    <ArrowRight size={12} className="opacity-0 group-hover/art:opacity-100 transition-all -translate-x-2 group-hover/art:translate-x-0" />
                  </Link>
                ))}
             </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="pt-12 border-t border-white/5 flex flex-wrap gap-8 justify-center opacity-50">
         <Link href="/settings/diagnostics" className="flex items-center space-x-2 text-[10px] uppercase font-black tracking-widest text-gray-500 hover:text-white transition-all">
            <Settings size={14} />
            <span>System Status</span>
         </Link>
         <Link href="/api/hub/info" className="flex items-center space-x-2 text-[10px] uppercase font-black tracking-widest text-gray-500 hover:text-white transition-all">
            <Cpu size={14} />
            <span>Hub Info</span>
         </Link>
         <Link href="#" className="flex items-center space-x-2 text-[10px] uppercase font-black tracking-widest text-gray-500 hover:text-white transition-all">
            <Book size={14} />
            <span>Release Notes</span>
         </Link>
      </div>
    </div>
  );
}
