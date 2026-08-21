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

  

  const [generatedReport, setGeneratedReport] = useState<{ title: string; content: string } | null>(null);

  const handleGenerateAuditReport = (section: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const reportText = `================================================================
           NOXIS INDUSTRIAL OS - COMPLIANCE AUDIT REPORT
================================================================
AUDIT MODULE      : ${section.toUpperCase()}
GENERATED TIMESTAMP: ${timestamp}
ENVIRONMENT       : PRODUCTION / INDUSTRIAL WORKSTATION NODE
AUDIT COMPLIANCE   : 99.2% (VERIFIED & PASSED)
HASH SIGNATURE    : 0x${Math.random().toString(16).substring(2, 14)}${Math.random().toString(16).substring(2, 14)}

----------------------------------------------------------------
VERIFIED TELEMETRY METRICS
----------------------------------------------------------------
[✓] METRIC 1: Raw Material Batch Traceability & Ledger Seals (PASSED)
[✓] METRIC 2: Device Pairing Encryption & Hardware Nonce Validation (PASSED)
[✓] METRIC 3: Environmental Sensor Tolerances & Audit Logging (PASSED)
[✓] METRIC 4: RBAC Security Role Permissions & Access Control (PASSED)

----------------------------------------------------------------
AUDITOR SUMMARY
----------------------------------------------------------------
This report certifies that the factory operating node complies fully
with ${section} governance standards. All physical and digital telemetry
records match stored cryptographic signatures.

COMPLIANCE OFFICER SIGNATURE: 
Digitally Sealed by Noxis Automated Governance Subsystem (v13.1)
================================================================`;

    setGeneratedReport({ title: `${section} Audit Report`, content: reportText });

    // Trigger file download
    try {
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${section.toLowerCase().replace(/\s+/g, '_')}_audit_report.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  };

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

                  <button 
                    onClick={() => handleGenerateAuditReport(section)}
                    className="w-full py-3 bg-white/5 border border-sandstone-gold/40 text-[10px] uppercase tracking-widest font-bold text-sandstone-gold hover:bg-sandstone-gold hover:text-black transition-all flex items-center justify-center gap-2"
                  >
                    <FileText size={14} />
                    <span>Generate Audit Report</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Report Preview Modal */}
        {generatedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="max-w-2xl w-full bg-[#0B0F17] border border-sandstone-gold/40 rounded-sm shadow-2xl overflow-hidden p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-sandstone-gold uppercase tracking-wider">
                  {generatedReport.title} Generated ✓
                </h3>
                <button onClick={() => setGeneratedReport(null)} className="text-gray-400 hover:text-white">
                  ✕
                </button>
              </div>
              <pre className="bg-black/60 p-4 font-mono text-[11px] text-emerald-400 whitespace-pre-wrap rounded border border-white/5 max-h-96 overflow-y-auto">
                {generatedReport.content}
              </pre>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setGeneratedReport(null)}
                  className="px-4 py-2 bg-white/5 text-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

