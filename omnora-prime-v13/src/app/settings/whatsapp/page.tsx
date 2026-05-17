"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Globe, 
  User, 
  Layers,
  ShieldCheck,
  Save,
  Loader2
} from "lucide-react";
import { useTierStore } from "@/stores/tierStore";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { useToast } from "@/hooks/useToast";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { createClient } from "@/lib/supabase/client";

import FeatureLock from "@/components/ui/FeatureLock";
import { cn } from "@/lib/utils";

interface WhatsAppConfig {
  owner_phone: string;
  daily_summary_enabled: boolean;
  daily_summary_time: string;
  language: "english" | "urdu" | "both";
  karigar_payslips_enabled: boolean;
  sections: {
    revenue: boolean;
    invoices: boolean;
    production: boolean;
    attendance: boolean;
    alerts: boolean;
  };
}

export default function WhatsAppSettingsPage() {
  const { tier } = useTierStore();
  const toast = useToast();
  const { profile } = useBusinessProfile();
  const supabase = createClient();

  const [config, setConfig] = useState<WhatsAppConfig>({
    owner_phone: "",
    daily_summary_enabled: false,
    daily_summary_time: "20:00",
    language: "english",
    karigar_payslips_enabled: false,
    sections: {
      revenue: true,
      invoices: true,
      production: true,
      attendance: true,
      alerts: true
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState<string | null>(null);

  const lastSyncedBusinessId = useRef<string | null>(null);

  useEffect(() => {
    if (profile?.id && profile.id !== lastSyncedBusinessId.current && profile.whatsapp_config) {
      const configData = (profile.whatsapp_config as unknown) as WhatsAppConfig;
      setConfig(configData);
      lastSyncedBusinessId.current = profile.id;
    }
  }, [profile]);


  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("business_profiles")
        .update({ whatsapp_config: config })
        .eq("id", profile?.id);

      if (error) throw error;
      alert("Configuration saved successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(err);
      alert("Failed to save: " + message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestMessage = async () => {
    if (!config.owner_phone) {
      alert("Please enter an owner WhatsApp number first.");
      return;
    }
    setTestStatus("sending");
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-send", {
        body: {
          type: "test",
          business_id: profile?.id,
          recipient: config.owner_phone
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setTestStatus("success");
      setTestResult("Test message dispatched to " + config.owner_phone);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setTestStatus("error");
      setTestResult(message);
    }
  };

  

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-inter flex">
      
      
      <main className={cn( "flex-1 transition-all duration-300 min-h-screen flex flex-col")}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <span>Settings</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">WhatsApp Integration</span>
          </div>
          <div className="ml-auto">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] text-[9px] uppercase tracking-[0.2em] font-black">
              <ShieldCheck size={10} />
              <span>Elite Tier Verified</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-12 max-w-5xl mx-auto w-full space-y-12 pb-32">
          {/* Hero Section */}
          <section className="space-y-4">
            <h1 className="text-4xl font-bold text-white tracking-tight">WhatsApp Business Hub</h1>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
              Automate your business intelligence. Receive daily summaries, payment alerts, and anomaly reports directly via Meta Cloud API.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Core Config Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-3 text-[#C5A059]">
                  <User size={20} />
                  <h3 className="font-bold text-sm uppercase tracking-widest">Primary Contact</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Owner WhatsApp Number</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="+923001234567"
                        value={config.owner_phone}
                        onChange={(e) => setConfig({ ...config, owner_phone: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-sm font-mono text-white focus:outline-none focus:border-[#C5A059]/50 transition-all shadow-inner"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-bold">REQUIRED</div>
                    </div>
                    <p className="text-[9px] text-slate-600 italic mt-1">Format: +[CountryCode][Number] (e.g. +923214567890)</p>
                  </div>
                </div>
              </div>

              {/* Automation Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-electric-blue">
                      <Clock size={20} />
                      <h3 className="font-bold text-sm uppercase tracking-widest">Daily Summary Engine</h3>
                    </div>
                    <FeatureGate feature="whatsappAutoAlerts">
                      <button 
                        onClick={() => setConfig({ ...config, daily_summary_enabled: !config.daily_summary_enabled })}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-all duration-300",
                          config.daily_summary_enabled ? "bg-electric-blue shadow-[0_0_15px_rgba(45,185,255,0.3)]" : "bg-slate-800"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                          config.daily_summary_enabled ? "translate-x-7" : "translate-x-1"
                        )} />
                      </button>
                    </FeatureGate>
                  </div>

                <AnimatePresence>
                  {config.daily_summary_enabled && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-8 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Preferred Time</label>
                          <input 
                            type="time"
                            value={config.daily_summary_time}
                            onChange={(e) => setConfig({ ...config, daily_summary_time: e.target.value })}
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Message Language</label>
                          <div className="flex p-1 bg-black rounded-xl border border-white/5">
                            {(["english", "urdu", "both"] as const).map((lang) => (
                              <button
                                key={lang}
                                onClick={() => setConfig({ ...config, language: lang })}
                                className={cn(
                                  "flex-1 py-2 text-[9px] uppercase font-bold tracking-widest rounded-lg transition-all",
                                  config.language === lang ? "bg-white/10 text-white shadow-xl" : "text-slate-600 hover:text-slate-400"
                                )}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">Included Report Modules</label>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(config.sections).map(([key, val]) => (
                            <button
                              key={key}
                              onClick={() => setConfig({ ...config, sections: { ...config.sections, [key]: !val } })}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                                val ? "bg-white/5 border-white/10 text-white" : "bg-transparent border-white/5 text-slate-600 grayscale"
                              )}
                            >
                              <span className="text-[10px] uppercase font-black tracking-widest">{key}</span>
                              {val && <CheckCircle2 size={14} className="text-emerald" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Karigar Integration */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-emerald">
                      <Layers size={20} />
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-white">Karigar Automation</h3>
                        <p className="text-[10px] text-slate-500">Send payslips automatically upon payroll finalization.</p>
                      </div>
                    </div>
                    <FeatureGate feature="whatsappAutoAlerts">
                      <button 
                        onClick={() => setConfig({ ...config, karigar_payslips_enabled: !config.karigar_payslips_enabled })}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-all duration-300",
                          config.karigar_payslips_enabled ? "bg-emerald shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-slate-800"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                          config.karigar_payslips_enabled ? "translate-x-7" : "translate-x-1"
                        )} />
                      </button>
                    </FeatureGate>
                  </div>
              </div>
            </div>

            {/* Right Column: Preview & Test */}
            <div className="space-y-8">
              {/* Live Preview */}
              <div className="bg-black border border-white/10 rounded-2xl p-6 relative overflow-hidden h-[500px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">N</div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-white">Noxis Business Hub</p>
                      <p className="text-[8px] text-emerald font-bold">Online</p>
                    </div>
                  </div>
                  <Settings size={14} className="text-slate-600" />
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                  <div className="max-w-[85%] bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none text-[11px] leading-relaxed relative">
                    <p className="text-white whitespace-pre-wrap font-inter">
                      📊 *Noxis Daily Summary*{"\n"}
                      Industrial Park A — {new Date().toISOString().split('T')[0]}{"\n\n"}
                      💰 Today&apos;s Revenue: PKR 145,000{"\n"}
                      📦 Invoices: 12 posted, 2 overdue{"\n"}
                      🏭 Production: 1,420 units across 8 batches{"\n"}
                      👥 Attendance: 24/25 karigars{"\n\n"}
                      ⚠️ Alerts: 1 issues detected{"\n\n"}
                      _Powered by Noxis — noxis.app_
                    </p>
                    <span className="absolute bottom-2 right-4 text-[7px] text-slate-500">20:00</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 mt-4">
                  <button 
                    onClick={handleTestMessage}
                    disabled={testStatus === "sending"}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {testStatus === "sending" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>Send Test Message</span>
                  </button>
                  
                  <AnimatePresence>
                    {testResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "mt-4 p-4 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-3",
                          testStatus === "success" ? "bg-emerald/10 text-emerald border border-emerald/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                        )}
                      >
                        {testStatus === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        <span>{testResult}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Security Note */}
              <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-blue-500 font-bold text-[10px] uppercase tracking-widest">
                  <Globe size={14} />
                  <span>Meta Cloud API</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                  Messages are sent via our verified Noxis Business Account. No third-party relays used. End-to-end encryption maintained for all industrial data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Bar */}
        <footer className="fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-center z-50 px-8">
          <div className={cn("w-full max-w-5xl flex items-center justify-between transition-all duration-300")}>
            <div className="space-y-1 hidden md:block">
              <p className="text-xs font-bold text-white uppercase tracking-widest">Unsaved Changes</p>
              <p className="text-[10px] text-slate-500">Update your notification logic for all nodes.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-12 py-4 bg-[#C5A059] text-black rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.05] active:scale-95 transition-all shadow-[0_10px_30px_rgba(197,160,89,0.3)] flex items-center gap-3"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Commit Configuration</span>
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}