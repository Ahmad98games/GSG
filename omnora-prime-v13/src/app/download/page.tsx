// app/download/page.tsx
"use client";

import React, { useState } from "react";
import { 
  Download, Key, ShieldAlert, Monitor, 
  ChevronRight, Info, CheckCircle2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DownloadPage() {
  const [key, setKey] =  useState ("");
  const [isVerifying, setIsVerifying] =  useState (false);
  const [downloadUrl, setDownloadUrl] =  useState <string | null>(null);
  const [error, setError] =  useState <string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    // Call API route to validate key and get signed URL
    try {
      const res = await fetch(`/api/download?key=${key}`);
      const data = await res.json();

      if (res.ok && data.url) {
        setDownloadUrl(data.url);
      } else {
        setError(data.error || "Invalid or inactive license key.");
      }
    } catch (err) {
      setError("System connection error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-onyx min-h-screen text-gray-300 font-inter pt-40 pb-20 px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <Download className="text-electric-blue w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tighter mb-4">Download Hub</h1>
          <p className="text-gray-500 text-sm">Enter your license key to authorize the industrial build download.</p>
        </div>

        <AnimatePresence mode="wait">
          {!downloadUrl ? (
            <motion.form 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              onSubmit={handleVerify} className="space-y-6"
            >
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-electric-blue transition-colors" />
                <input 
                  required
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full bg-surface border border-white/10 py-5 pl-12 pr-4 text-center font-mono text-xl tracking-widest text-white focus:border-electric-blue outline-none transition-all"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                />
              </div>

              {error && (
                <div className="bg-critical-red/10 border border-critical-red/20 p-4 flex items-center space-x-3 text-critical-red text-xs font-bold uppercase tracking-widest">
                   <ShieldAlert size={16} />
                   <span>{error}</span>
                </div>
              )}

              <button 
                disabled={isVerifying || key.length < 8}
                className="w-full bg-electric-blue text-onyx py-5 font-bold uppercase tracking-widest text-sm flex items-center justify-center group rounded-sm disabled:opacity-20"
              >
                {isVerifying ? "Verifying Identity..." : "Authorize Download"}
                <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="bg-surface/50 p-6 border border-white/5 space-y-4">
                 <div className="flex items-start space-x-3">
                    <Monitor size={16} className="text-gray-500 mt-0.5" />
                    <div>
                       <p className="text-[10px] font-bold text-white uppercase tracking-widest">System Requirements</p>
                       <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">Windows 10/11 64-bit, Intel Core i3 or higher, 4GB RAM, 10GB Disk Space.</p>
                    </div>
                 </div>
                 <div className="flex items-start space-x-3">
                    <Info size={16} className="text-gray-500 mt-0.5" />
                    <div>
                       <p className="text-[10px] font-bold text-white uppercase tracking-widest">Version v13.0.4</p>
                       <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">Latest version. Includes security and sync updates.</p>
                    </div>
                 </div>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface border border-emerald/20 p-10 text-center space-y-8"
            >
               <CheckCircle2 className="text-emerald w-16 h-16 mx-auto" />
               <div>
                  <h3 className="text-xl font-bold text-white mb-2">Download Authorized</h3>
                  <p className="text-sm text-gray-500 font-mono">Build: NOXIS_v13.0.4_x64.exe</p>
               </div>
               <a 
                 href={downloadUrl}
                 className="block w-full bg-emerald text-onyx py-6 font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-all rounded-sm text-center"
               >
                 Start Download Now
               </a>
               <p className="text-[10px] text-gray-600 italic">Link expires in 15 minutes for security. Use your license key to re-authorize if needed.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

