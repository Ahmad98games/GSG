// app/docs/layout.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";
import Image from "next/image";

const DOCS_NAV = [
  {
    title: "Getting Started",
    items: [
      { label: "Hub Installation", href: "/docs/getting-started/installation" },
      { label: "Mobile Pairing", href: "/docs/getting-started/pairing" },
      { label: "Themes & Typography", href: "/docs/getting-started/themes" },
    ]
  },
  {
    title: "Inventory",
    items: [
      { label: "Adding SKUs", href: "/docs/inventory/skus" },
      { label: "Barcode Scanning", href: "/docs/inventory/scanning" },
    ]
  },
  {
    title: "Finance",
    items: [
      { label: "Creating Invoices", href: "/docs/finance/invoices" },
      { label: "Recording Payments", href: "/docs/finance/payments" },
      { label: "Understanding Ledger", href: "/docs/finance/ledger" },
    ]
  },
  {
    title: "Payroll",
    items: [
      { label: "Setting up Karigars", href: "/docs/payroll/karigars" },
      { label: "Running Payroll", href: "/docs/payroll/running" },
    ]
  },
  {
    title: "CCTV Sentinel",
    items: [
      { label: "Adding Cameras", href: "/docs/cctv/adding" },
      { label: "Sentinel Dashboard Widget", href: "/docs/cctv/widget" },
      { label: "Understanding Alerts", href: "/docs/cctv/alerts" },
    ]
  },
  {
    title: "Multi-Branch (Elite)",
    items: [
      { label: "Creating Branches", href: "/docs/elite/branches" },
    ]
  },
  {
    title: "Client Portal",
    items: [
      { label: "Inviting Clients", href: "/docs/portal/invites" },
    ]
  },
  {
    title: "Troubleshooting",
    items: [
      { label: "TCP Connection Issues", href: "/docs/troubleshooting/tcp" },
      { label: "License Activation", href: "/docs/troubleshooting/license" },
      { label: "Data Sync Issues", href: "/docs/troubleshooting/sync" },
    ]
  },
  {
    title: "API Reference",
    items: [
      { label: "WhatsApp Integration", href: "/docs/api/whatsapp" },
      { label: "Webhook Events", href: "/docs/api/webhooks" },
      { label: "NSP Protocol Overview", href: "/docs/api/nsp" },
    ]
  }
];

function FeedbackSection() {
  const [voted, setVoted] = React.useState(false);

  if (voted) {
    return (
      <div className="mt-20 pt-10 border-t border-white/5 flex justify-center items-center text-[10px] font-black uppercase tracking-[0.3em] text-emerald animate-pulse">
         <span>Thank you for your feedback. We are constantly improving Noxis.</span>
      </div>
    );
  }

  return (
    <div className="mt-20 pt-10 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-600">
       <span>Was this page helpful?</span>
       <div className="flex space-x-4">
          <button onClick={() => setVoted(true)} className="hover:text-emerald transition-colors">Yes</button>
          <button onClick={() => setVoted(true)} className="hover:text-critical-red transition-colors">No</button>
       </div>
    </div>
  );
}

function DocsLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  const showHubSidebar = source !== 'website';

  return (
    <div className="bg-onyx min-h-screen text-gray-300 font-inter">

      <main className="transition-all duration-300 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 flex">
        {/* Sidebar */}
        <aside className="w-64 hidden lg:block border-r border-white/5 py-10 pr-6 shrink-0 h-[calc(100vh-80px)] sticky top-20 overflow-y-auto">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-sm">
              <Image src="/logos/noxis.png" alt="Noxis Logo" width={20} height={20} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black tracking-tighter leading-none text-lg">NOXIS</span>
              <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mt-0.5">Docs v13.0</span>
            </div>
          </div>

          <div className="relative mb-10 group">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 group-focus-within:text-electric-blue transition-colors" />
             <input placeholder="Search Docs..." className="w-full bg-surface border border-white/10 py-2 pl-8 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-electric-blue transition-all" />
          </div>

          <div className="space-y-10">
            {DOCS_NAV.map((section) => (
              <div key={section.title} className="space-y-4">
                <h5 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">{section.title}</h5>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link 
                        href={`${item.href}${source ? `?source=${source}` : ''}`}
                        className={`text-[11px] font-medium transition-colors block py-1 ${
                          pathname === item.href ? 'text-electric-blue' : 'text-gray-500 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 lg:pl-16 py-10 max-w-5xl prose prose-invert prose-blue">
          {children}
          <FeedbackSection />
        </div>
      </div>
    </main>
  </div>
  );
}


export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-onyx" />}>
      <DocsLayoutContent>{children}</DocsLayoutContent>
    </Suspense>
  );
}
