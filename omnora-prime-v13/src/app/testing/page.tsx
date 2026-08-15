// app/testing/page.tsx
"use client";

import React from "react";
import { 
  AlertTriangle, FlaskConical, Bug, 
  Download, Key, Globe, MessageCircle 
} from "lucide-react";
import { motion } from "framer-motion";

export default function TestingPage() {
  return (
    <div className="bg-onyx min-h-screen text-gray-300 font-inter pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Banner */}
        <div className="bg-critical-red/10 border border-critical-red/20 p-4 flex items-center justify-center space-x-3 text-critical-red text-[10px] font-bold uppercase tracking-[0.2em] mb-12">
           <AlertTriangle size={14} />
           <span>You are on the testing build deployment. This version is not for production use.</span>
        </div>

        <div className="text-center mb-16">
          <FlaskConical className="text-sandstone-gold w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white tracking-tighter mb-4">Beta Testing Portal</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Access the latest unstable builds, pre-generated license keys, and community testing channels.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
           {/* Test Build Download */}
           <div className="bg-surface border border-white/5 p-8 flex flex-col items-center justify-center text-center space-y-6">
              <Download className="text-electric-blue w-12 h-12" />
           </div>

           {/* Test Keys */}
           <div className="bg-surface border border-white/5 p-8 space-y-6">
              <div className="flex items-center space-x-3">
                 <Key className="text-sandstone-gold w-6 h-6" />
                 <h3 className="text-xs font-bold text-white uppercase tracking-widest">Test License Keys</h3>
              </div>
              <div className="space-y-3">
                 <TestKeyItem tier="Lite" keyStr="TEST-LITE-X123" />
                 <TestKeyItem tier="Pro" keyStr="TEST-PRO-Y456" />
                 <TestKeyItem tier="Elite" keyStr="TEST-ELITE-Z789" />
              </div>
              <p className="text-[9px] text-gray-600 italic">Test keys expire every 30 days and are only valid on the Test Build.</p>
           </div>
        </div>

        {/* Feedback Channels */}
        <div className="grid md:grid-cols-3 gap-6">
           <FeedbackCard icon={Bug} label="Report a Bug" sub="GitHub Issues" />
           <FeedbackCard icon={MessageCircle} label="Beta Discord" sub="Join Community" />
           <FeedbackCard icon={Globe} label="Source Access" sub="Developer Portal" />
        </div>
      </div>
    </div>
  );
}

function TestKeyItem({ tier, keyStr }: any) {
  return (
    <div className="flex justify-between items-center bg-onyx p-3 border border-white/5 group">
       <span className="text-[10px] font-bold text-gray-500 uppercase">{tier}</span>
       <code className="text-xs font-mono text-white tracking-widest group-hover:text-electric-blue transition-colors cursor-pointer">{keyStr}</code>
    </div>
  );
}

function FeedbackCard({ icon: Icon, label, sub }: any) {
  return (
    <div className="bg-surface border border-white/5 p-6 flex flex-col items-center justify-center space-y-3 hover:border-electric-blue/20 transition-all cursor-pointer">
       <Icon size={24} className="text-gray-600" />
       <div className="text-center">
          <p className="text-[10px] font-bold text-white uppercase tracking-widest">{label}</p>
          <p className="text-[9px] text-gray-600 font-mono mt-1">{sub}</p>
       </div>
    </div>
  );
}

