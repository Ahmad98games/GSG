"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  FileText, QrCode, Banknote, Tag, 
  Barcode, ShoppingCart, ChevronRight, ChevronLeft, Globe
} from "lucide-react";

import { usePersona } from "@/hooks/usePersona";
import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";

const generators = [
  {
    id: 'invoice',
    name: 'Invoice / Challan',
    description: 'Professional billing and delivery notes for clients.',
    icon: FileText,
    href: '/generators/invoice'
  },
  {
    id: 'qr',
    name: 'QR Code Generator',
    description: 'vCards, payment links, and Wi-Fi connection codes.',
    icon: QrCode,
    href: '/generators/qr'
  },
  {
    id: 'payslip',
    name: 'Salary / Peshgi Slip',
    description: 'Industrial pay slips and advance payment receipts.',
    icon: Banknote,
    href: '/generators/payslip'
  },
  {
    id: 'stock_label',
    name: 'Stock Label',
    description: 'Print shelf and product labels with barcodes.',
    icon: Tag,
    href: '/generators/label'
  },
  {
    id: 'barcode',
    name: 'Barcode Generator',
    description: 'Generate CODE128, EAN13, and other barcode formats.',
    icon: Barcode,
    href: '/generators/barcode'
  },
  {
    id: 'purchase_order',
    name: 'Purchase Order',
    description: 'Formal procurement documents for your suppliers.',
    icon: ShoppingCart,
    href: '/generators/purchase-order'
  },
  {
    id: 'export_docs',
    name: 'Export Documents',
    description: 'Commercial Invoices, Packing Lists, and Certificates of Origin.',
    icon: Globe,
    href: '/generators/export-docs'
  }
];

export default function GeneratorsPage() {
  const { isCollapsed } = useSidebarState();
  const { getGenerators } = usePersona();
  
  const enabledGenerators = getGenerators();
  const visibleGenerators = generators.filter(g => enabledGenerators.includes(g.id as any));

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200">
      
      
      <main className={cn( "transition-all duration-300 min-h-screen flex flex-col")}>
        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="p-2 bg-white/5 rounded-sm hover:bg-white/10 transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Document Generators</h1>
              <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-1">
                Generate professional documents instantly
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleGenerators.map((gen, idx) => (
              <motion.div
                key={gen.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link 
                  href={gen.href}
                  className="group block glass-panel p-8 space-y-6 hover:border-electric-blue/30 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Background Accent */}
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <gen.icon size={120} />
                  </div>

                  <div className="p-4 bg-white/5 rounded-sm w-fit group-hover:bg-electric-blue/10 transition-colors">
                    <gen.icon size={48} className="text-electric-blue" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">{gen.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{gen.description}</p>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-electric-blue border-b border-electric-blue/20 group-hover:border-electric-blue transition-all">
                      Open Generator
                    </span>
                    <ChevronRight size={16} className="text-gray-700 group-hover:text-electric-blue group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}

            {visibleGenerators.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-30 italic">
                 <FileText size={60} strokeWidth={0.5} />
                 <p className="mt-4 uppercase tracking-[0.2em] text-[10px]">No industry-specific generators found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

