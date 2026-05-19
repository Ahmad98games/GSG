"use client";

import React, { useState } from "react";
import { 
  Download, Key, ShieldAlert, Monitor, 
  ChevronRight, Info, CheckCircle2, Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const APK_URL = 'https://github.com/omnoralabs/noxis-releases/releases/latest/download/noxis.apk';

export default function DownloadClient() {
  // Windows client states
  const [key, setKey] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Android client states
  const [apkKey, setApkKey] = useState('');
  const [apkVerified, setApkVerified] = useState(false);
  const [apkError, setApkError] = useState('');
  const [apkLoading, setApkLoading] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

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

  const verifyAndDownloadApk = async () => {
    if (!apkKey.trim()) {
      setApkError('Enter your license key');
      return;
    }
    
    setApkLoading(true);
    setApkError('');
    
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/verify-license`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            license_key: apkKey.trim().toUpperCase()
          })
        }
      );
      
      const data = await response.json();
      
      if (data.valid) {
        setApkVerified(true);
        // Trigger download
        const link = document.createElement('a');
        link.href = APK_URL;
        link.download = 'noxis.apk';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setApkError(data.error || 'Invalid license key. Purchase at noxishub.app/pricing');
      }
    } catch (err) {
      setApkError('Connection failed. Try again.');
    } finally {
      setApkLoading(false);
    }
  };

  return (
    <div className="bg-onyx min-h-screen text-gray-300 font-inter pt-40 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <Download className="text-electric-blue w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tighter mb-4">Download Hub</h1>
          <p className="text-gray-500 text-sm">Enter your license key to authorize the industrial build downloads.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Windows Desktop Section */}
          <div className="bg-[#111418] border border-white/5 p-8 rounded-sm space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-white/5">
              <Monitor className="text-electric-blue w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Windows Desktop App</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Build .exe installer</p>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {!downloadUrl ? (
                <motion.form 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onSubmit={handleVerify} className="space-y-6"
                >
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-electric-blue transition-colors" />
                    <input 
                      required
                      type="text"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="w-full bg-surface border border-white/10 py-4 pl-12 pr-4 text-center font-mono text-sm tracking-widest text-white focus:border-electric-blue outline-none transition-all"
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
                    className="w-full bg-electric-blue text-onyx py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center group rounded-sm disabled:opacity-20 cursor-pointer"
                  >
                    {isVerifying ? "Verifying Identity..." : "Authorize Windows Download"}
                    <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="bg-surface/50 p-4 border border-white/5 space-y-3">
                     <div className="flex items-start space-x-3">
                        <Monitor size={14} className="text-gray-500 mt-0.5 shrink-0" />
                        <div>
                           <p className="text-[9px] font-bold text-white uppercase tracking-widest">System Requirements</p>
                           <p className="text-[9px] text-gray-600 mt-1 leading-relaxed">Windows 10/11 64-bit, Intel Core i3 or higher, 4GB RAM, 10GB Disk Space.</p>
                        </div>
                     </div>
                     <div className="flex items-start space-x-3">
                        <Info size={14} className="text-gray-500 mt-0.5 shrink-0" />
                        <div>
                           <p className="text-[9px] font-bold text-white uppercase tracking-widest">Version v13.0.4</p>
                           <p className="text-[9px] text-gray-600 mt-1 leading-relaxed">Latest version. Includes security and sync updates.</p>
                        </div>
                     </div>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-surface border border-emerald/20 p-6 text-center space-y-6"
                >
                   <CheckCircle2 className="text-emerald w-12 h-12 mx-auto" />
                   <div>
                      <h3 className="text-base font-bold text-white mb-1">Download Authorized</h3>
                      <p className="text-xs text-gray-500 font-mono">Build: NOXIS_v13.0.4_x64.exe</p>
                   </div>
                   <a 
                     href={downloadUrl}
                     className="block w-full bg-emerald text-onyx py-4 font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-all rounded-sm text-center text-xs"
                   >
                     Start Download Now
                   </a>
                   <p className="text-[9px] text-gray-600 italic">Link expires in 15 minutes. Use key to re-authorize if needed.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Android Mobile Section */}
          <div className="bg-[#111418] border border-white/5 p-8 rounded-sm space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-white/5">
              <Smartphone className="text-emerald w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Android Mobile App</h2>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Build .apk package</p>
              </div>
            </div>

            <div className="space-y-6">
              {!apkVerified ? (
                <div>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4">
                    Enter your license key to download the Android app. The same key works on both Windows and Android.
                  </p>
                  <div className="relative group mb-4">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-emerald transition-colors" />
                    <input
                      type="text"
                      value={apkKey}
                      onChange={e => setApkKey(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="w-full bg-[#0F1114] border border-white/10 py-4 pl-12 pr-4 text-center font-mono text-sm tracking-widest text-white focus:border-emerald outline-none transition-all rounded-sm"
                      style={{
                        letterSpacing: '0.05em'
                      }}
                    />
                  </div>
                  {apkError && (
                    <div className="bg-critical-red/10 border border-critical-red/20 p-4 flex items-center space-x-3 text-critical-red text-xs font-bold uppercase tracking-widest mb-4">
                       <ShieldAlert size={16} />
                       <span>{apkError}</span>
                    </div>
                  )}
                  <button
                    onClick={verifyAndDownloadApk}
                    disabled={apkLoading}
                    className="w-full bg-emerald text-black py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center rounded-sm transition-all disabled:opacity-50 cursor-pointer"
                    style={{ cursor: apkLoading ? 'wait' : 'pointer' }}
                  >
                    {apkLoading ? 'Verifying...' : 'Verify & Download APK'}
                  </button>
                  <p className="text-[10px] text-gray-500 mt-4 text-center">
                    No license yet?{' '}
                    <a href="/pricing" className="text-electric-blue hover:underline">
                      Get one here
                    </a>
                  </p>
                </div>
              ) : (
                <div className="bg-surface border border-emerald/20 p-6 text-center space-y-6">
                  <CheckCircle2 className="text-emerald w-12 h-12 mx-auto" />
                  <div className="text-emerald font-bold text-xs uppercase tracking-wider">
                    ✓ Verified — download started
                  </div>
                  <a href={APK_URL} className="text-electric-blue text-xs hover:underline block font-mono">
                    Click here if download didn't start
                  </a>
                </div>
              )}
            </div>

            <div className="bg-surface/50 p-4 border border-white/5 space-y-3">
               <div className="flex items-start space-x-3">
                  <Smartphone size={14} className="text-gray-500 mt-0.5 shrink-0" />
                  <div>
                     <p className="text-[9px] font-bold text-white uppercase tracking-widest">Device Compatibility</p>
                     <p className="text-[9px] text-gray-600 mt-1 leading-relaxed">Android 8.0 or higher. Optimized for mobile, tablet, and barcode terminal screens.</p>
                  </div>
               </div>
               <div className="flex items-start space-x-3">
                  <Info size={14} className="text-gray-500 mt-0.5 shrink-0" />
                  <div>
                     <p className="text-[9px] font-bold text-white uppercase tracking-widest">Version v13.0.1 (APK)</p>
                     <p className="text-[9px] text-gray-600 mt-1 leading-relaxed">Stable production build. Native barcode API support.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
