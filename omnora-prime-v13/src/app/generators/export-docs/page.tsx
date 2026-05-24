"use client";

import React, { useState } from 'react';
import { 
  Globe, FileText, Package, Award, 
  Plus, Trash2, Printer, Save, ChevronLeft,
  Ship, Anchor, MapPin, Truck, Scale
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { FeatureGate } from "@/components/ui/FeatureGate";

type Tab = 'commercial-invoice' | 'packing-list' | 'certificate-of-origin';

export default function ExportDocsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('commercial-invoice');
  const { profile, currencySymbol } = useBusinessProfile();

  return (
    <div className="min-h-screen bg-[#0A0C0E] text-slate-200 font-inter">
      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#111418]/80 backdrop-blur-xl sticky top-0 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/generators" className="p-2 bg-white/5 rounded-sm hover:bg-white/10 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-white">B2B Export Engine</h1>
            <p className="text-[9px] text-gray-500 font-mono">GLOBAL LOGISTICS & CUSTOMS COMPLIANCE V1.0</p>
          </div>
        </div>

        <div className="flex bg-[#1A1D21] p-1 rounded-sm border border-white/5">
          <TabButton 
            active={activeTab === 'commercial-invoice'} 
            onClick={() => setActiveTab('commercial-invoice')}
            icon={FileText}
            label="Commercial Invoice"
          />
          <TabButton 
            active={activeTab === 'packing-list'} 
            onClick={() => setActiveTab('packing-list')}
            icon={Package}
            label="Packing List"
          />
          <TabButton 
            active={activeTab === 'certificate-of-origin'} 
            onClick={() => setActiveTab('certificate-of-origin')}
            icon={Award}
            label="Certificate of Origin"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button className="px-6 py-2 bg-electric-blue text-[#0A0C0E] text-[10px] font-black uppercase tracking-widest hover:bg-blue-400 transition-all flex items-center space-x-2">
            <Printer size={14} />
            <span>Generate PDF</span>
          </button>
        </div>
      </header>

      <FeatureGate feature="exportDocs">
        <main className="p-8 max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'commercial-invoice' && <CommercialInvoiceTab key="ci" profile={profile} />}
            {activeTab === 'packing-list' && <PackingListTab key="pl" />}
            {activeTab === 'certificate-of-origin' && <CertificateOfOriginTab key="co" profile={profile} />}
          </AnimatePresence>
        </main>
      </FeatureGate>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center space-x-2 px-4 py-1.5 text-[10px] font-bold uppercase transition-all rounded-sm",
        active ? "bg-white/10 text-white shadow-xl" : "text-gray-500 hover:text-gray-300"
      )}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}

// --- TABS ---

function CommercialInvoiceTab({ profile }: { profile: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-12"
    >
      <div className="space-y-8">
        <SectionTitle title="Shipment Details" icon={Ship} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Country of Origin" placeholder="e.g. Pakistan" />
          <Field label="HS Code" placeholder="e.g. 5208.11" />
          <Field label="Incoterms" placeholder="FOB, CIF, EXW..." />
          <Field label="Payment Terms" placeholder="L/C, TT, CAD..." />
          <Field label="Port of Loading" icon={Anchor} />
          <Field label="Port of Discharge" icon={MapPin} />
          <Field label="Buyer's PO Number" />
          <Field label="Shipment Date" type="date" />
        </div>

        <SectionTitle title="Consignee Information" icon={Truck} />
        <div className="space-y-4">
          <Field label="Full Name / Company" />
          <textarea 
            className="w-full bg-[#1A1D21] border border-white/5 p-4 text-xs outline-none focus:border-electric-blue/50 rounded-sm h-24"
            placeholder="Full International Address..."
          />
        </div>
      </div>

      <div className="glass-panel p-12 pb-24 bg-white text-black min-h-[1000px] shadow-2xl relative overflow-hidden">
        {/* Simplified Preview */}
        <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
          <div className="space-y-1">
            <h2 className="text-xl font-black uppercase">{profile?.business_name || "EXPORTER"}</h2>
            <p className="text-[9px] font-bold text-gray-500">{profile?.address}</p>
          </div>
          <h1 className="text-2xl font-black text-gray-200 uppercase">Commercial Invoice</h1>
        </div>
        <div className="grid grid-cols-2 gap-8 text-[9px] font-bold uppercase mb-12">
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 mb-1">Consignee</p>
              <p className="text-xs">BUYER COMPANY LTD</p>
              <p className="leading-relaxed">123 TRADE TOWER, DISTRICT 4, DUBAI, UAE</p>
            </div>
          </div>
          <div className="space-y-2 text-right">
            <p>Invoice No: <span className="font-mono">EXP-2026-001</span></p>
            <p>Origin: <span className="text-electric-blue">PAKISTAN</span></p>
            <p>Incoterm: <span>FOB KARACHI</span></p>
          </div>
        </div>
        <div className="flex items-center justify-center h-96 border border-dashed border-gray-200">
          <span className="text-gray-300 font-mono text-[10px] uppercase">Line Items Table Area</span>
        </div>

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: '1px solid #e5e7eb',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}>
          <span style={{
            fontSize: 9,
            color: '#9CA3AF',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.05em',
          }}>
            🔒 Securely logged by Noxis Hub
          </span>
          <span style={{
            fontSize: 9,
            color: '#9CA3AF',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.05em',
          }}>
            Powered by Omnora Labs · noxishub.app
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function PackingListTab() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <SectionTitle title="Packaging Details" icon={Package} />
        <button className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-electric-blue hover:text-blue-400 transition-colors">
          <Plus size={14} />
          <span>Add Carton</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[9px] uppercase font-black text-gray-500 border-b border-white/5">
              <th className="p-4 text-left">Carton #</th>
              <th className="p-4 text-left">Description</th>
              <th className="p-4 text-center">Net Wt (kg)</th>
              <th className="p-4 text-center">Gross Wt (kg)</th>
              <th className="p-4 text-center">Dimensions (cm)</th>
              <th className="p-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <CartonRow index={1} />
            <CartonRow index={2} />
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-3 gap-6 p-6 bg-[#1A1D21] border border-white/5">
        <SummaryStat label="Total Cartons" value="2" />
        <SummaryStat label="Total Net Weight" value="45.00 kg" />
        <SummaryStat label="Total Gross Weight" value="52.50 kg" />
      </div>
    </motion.div>
  );
}

function CartonRow({ index }: { index: number }) {
  return (
    <tr className="group">
      <td className="p-4"><input className="bg-transparent text-xs w-full outline-none" defaultValue={`CTN-${index}`} /></td>
      <td className="p-4"><input className="bg-transparent text-xs w-full outline-none" placeholder="Contents..." /></td>
      <td className="p-4"><input className="bg-transparent text-xs w-full text-center outline-none" placeholder="0.00" /></td>
      <td className="p-4"><input className="bg-transparent text-xs w-full text-center outline-none" placeholder="0.00" /></td>
      <td className="p-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <input className="bg-[#0A0C0E] w-12 text-center text-[10px] p-1 border border-white/5" placeholder="L" />
          <span className="text-gray-600">×</span>
          <input className="bg-[#0A0C0E] w-12 text-center text-[10px] p-1 border border-white/5" placeholder="W" />
          <span className="text-gray-600">×</span>
          <input className="bg-[#0A0C0E] w-12 text-center text-[10px] p-1 border border-white/5" placeholder="H" />
        </div>
      </td>
      <td className="p-4">
        <button className="text-gray-800 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

function CertificateOfOriginTab({ profile }: { profile: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[800px] mx-auto space-y-12"
    >
      <div className="p-12 glass-panel space-y-8">
        <SectionTitle title="Certification Declaration" icon={Award} />
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Field label="Consignee Name" />
            <Field label="Consignee Country" />
          </div>
          <Field label="Description of Goods" />
          <div className="grid grid-cols-2 gap-6">
            <Field label="Quantity" />
            <Field label="HS Code" />
          </div>
          
          <div className="p-6 bg-electric-blue/5 border border-electric-blue/20 rounded-sm space-y-4">
            <div className="flex items-start space-x-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase">
                I hereby certify that the goods described above originated in <span className="text-white">{profile?.country_code === 'PK' ? 'Pakistan' : 'the specified country of origin'}</span> and that they comply with the origin requirements specified for those goods.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-amber-500/80">
            <Award size={14} />
            <p className="text-[8px] font-black uppercase tracking-widest">
              Note: Official CO requires Chamber of Commerce stamp. This is a draft template.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- HELPERS ---

function SectionTitle({ title, icon: Icon }: { title: string, icon: any }) {
  return (
    <div className="flex items-center space-x-3 border-b border-white/5 pb-2">
      <Icon size={16} className="text-electric-blue" />
      <h3 className="text-xs font-black uppercase tracking-widest text-white">{title}</h3>
    </div>
  );
}

function Field({ label, icon: Icon, type = "text", placeholder }: { label: string, icon?: any, type?: string, placeholder?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest flex items-center space-x-2">
        {Icon && <Icon size={10} />}
        <span>{label}</span>
      </label>
      <input 
        type={type}
        placeholder={placeholder}
        className="w-full bg-[#1A1D21] border border-white/5 p-3 text-xs outline-none focus:border-electric-blue/50 rounded-sm placeholder:text-gray-700"
      />
    </div>
  );
}

function SummaryStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="text-center space-y-1">
      <p className="text-[8px] font-black uppercase text-gray-500 tracking-[0.2em]">{label}</p>
      <p className="text-lg font-black text-white font-mono">{value}</p>
    </div>
  );
}
