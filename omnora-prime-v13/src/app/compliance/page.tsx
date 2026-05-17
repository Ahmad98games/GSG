// src/app/(compliance)/page.tsx
"use client";

import React, { useState } from "react";
import { useGDPRRequests, useCreateGDPRRequest, useComplianceChecks } from "@/hooks/useComplianceQueries";
import { usePersona } from "@/hooks/usePersona";
import { useSidebarState } from "@/hooks/useSidebarState";

import { cn } from "@/lib/utils";
import { 
  ShieldCheck, FileText, Download, 
  Trash2, Mail, ExternalLink, 
  CheckCircle2, AlertCircle, HardDrive
} from "lucide-react";
import { motion } from "framer-motion";

export default function CompliancePage() {
  const { t, persona } = usePersona();
  const { isCollapsed } = useSidebarState();
  const { data: gdprRequests } = useGDPRRequests();
  const { data: checks } = useComplianceChecks();
  const createGDPR = useCreateGDPRRequest();

  const [email, setEmail] =  useState ("");
  const [activePanel, setActivePanel] =  useState <'gdpr' | 'checklists'>('gdpr');

  

  return (
    <div className="min-h-screen bg-onyx text-slate-200">
      
      <main className={cn( "transition-all duration-300")}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <span>Noxis OS</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-electric-blue">Governance</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">Compliance Center</span>
          </div>
        </header>

        <div className="p-8 max-w-[1200px] mx-auto">
          <div className="flex space-x-6 mb-12">
            <button 
              onClick={() => setActivePanel('gdpr')}
              className={cn(
                "flex-1 p-6 border transition-all text-left group relative overflow-hidden",
                activePanel === 'gdpr' ? "bg-surface border-electric-blue shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "bg-onyx/30 border-white/5 hover:border-white/20"
              )}
            >
              <ShieldCheck size={24} className={cn("mb-4", activePanel === 'gdpr' ? "text-electric-blue" : "text-gray-600")} />
              <h3 className="text-sm font-bold text-white uppercase mb-1">GDPR & Data Privacy</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Manage subject access requests and deletion</p>
              {activePanel === 'gdpr' && <motion.div layoutId="compliance-tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-electric-blue" />}
            </button>

            <button 
              onClick={() => setActivePanel('checklists')}
              className={cn(
                "flex-1 p-6 border transition-all text-left group relative overflow-hidden",
                activePanel === 'checklists' ? "bg-surface border-sandstone-gold shadow-[0_0_20px_rgba(234,179,8,0.1)]" : "bg-onyx/30 border-white/5 hover:border-white/20"
              )}
            >
              <FileText size={24} className={cn("mb-4", activePanel === 'checklists' ? "text-sandstone-gold" : "text-gray-600")} />
              <h3 className="text-sm font-bold text-white uppercase mb-1">Industry Checklists</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">FDA, GMP & SLA Compliance Audits</p>
              {activePanel === 'checklists' && <motion.div layoutId="compliance-tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-sandstone-gold" />}
            </button>
          </div>

          {activePanel === 'gdpr' ? (
            <div className="space-y-8">
              <section className="bg-surface border border-white/5 p-8">
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-6">New Data Request</h3>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input 
                      type="email" 
                      placeholder="Enter data subject email address..."
                      className="w-full bg-onyx border border-white/10 pl-10 pr-4 py-3 text-sm text-white focus:border-electric-blue outline-none transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => {
                      createGDPR.mutate({ email, isDeletion: false });
                      setEmail("");
                    }}
                    className="px-6 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-colors"
                  >
                    Export Data
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm("This will PERMANENTLY delete all records for this subject. Proceed?")) {
                        createGDPR.mutate({ email, isDeletion: true });
                        setEmail("");
                      }
                    }}
                    className="px-6 bg-critical-red/10 border border-critical-red/20 text-critical-red text-[10px] uppercase tracking-widest font-bold hover:bg-critical-red/20 transition-colors"
                  >
                    Forget Subject
                  </button>
                </div>
              </section>

              <section className="bg-surface border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">Request History</h3>
                  <div className="flex items-center space-x-2">
                    <HardDrive size={12} className="text-gray-700" />
                    <span className="text-[10px] text-gray-600 font-mono">Storage: 4.2GB / 10GB</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-onyx/30 border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 text-[10px] uppercase text-gray-600 font-bold">Subject Email</th>
                        <th className="px-6 py-4 text-[10px] uppercase text-gray-600 font-bold">Type</th>
                        <th className="px-6 py-4 text-[10px] uppercase text-gray-600 font-bold">Status</th>
                        <th className="px-6 py-4 text-[10px] uppercase text-gray-600 font-bold">Requested At</th>
                        <th className="px-6 py-4 text-[10px] uppercase text-gray-600 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gdprRequests?.map((req: any) => (
                        <tr key={req.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4 text-xs font-medium text-white">{req.subject_email}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-[9px] uppercase font-bold",
                              req.deletion_request ? "text-critical-red" : "text-electric-blue"
                            )}>
                              {req.deletion_request ? 'Forget' : 'Export'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 text-[9px] uppercase font-bold rounded-sm",
                              req.status === 'ready' ? "bg-emerald/10 text-emerald" :
                              req.status === 'processing' ? "bg-blue-500/10 text-blue-400" :
                              req.status === 'deleted' ? "bg-gray-800 text-gray-500" : "bg-white/5 text-gray-500"
                            )}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">{new Date(req.requested_at).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            {req.export_url && (
                              <a 
                                href={req.export_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-[10px] font-bold text-electric-blue hover:text-white uppercase tracking-widest"
                              >
                                <Download size={12} />
                                <span>Download ZIP</span>
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {['FDA Compliance', 'GMP Standards', 'SLA Performance'].map(section => (
                <div key={section} className="bg-surface border border-white/5 p-8 relative group overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CheckCircle2 size={64} className="text-sandstone-gold" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase mb-6 flex items-center space-x-2">
                    <span className="w-1.5 h-4 bg-sandstone-gold" />
                    <span>{section}</span>
                  </h3>
                  
                  <div className="space-y-4 mb-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between p-3 bg-onyx/30 border border-white/5 rounded-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 border border-white/10 flex items-center justify-center text-emerald">
                            <CheckCircle2 size={12} />
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Metric Verification {i}</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-600">2026-05-01</span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full py-3 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-white hover:border-white/20 transition-all">
                    Generate Audit Report
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

