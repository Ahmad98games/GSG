'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Shield, Key, Loader2, AlertCircle, CheckCircle2, HelpCircle, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { saveLicenseToLocal, storeBusinessId } from './actions';
import { useBusinessProfileStore } from '@/store/BusinessProfileStore';
import { useTierStore } from '@/stores/tierStore';
import Image from 'next/image';

export default function LicensePage() {
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Auto-format: LITE-XXXX-XXXX-XXXX
    let formatted = '';
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += '-';
      formatted += val[i];
    }
    
    setLicenseKey(formatted.substring(0, 19)); // Max length LITE-XXXX-XXXX-XXXX
    setError(null);
  };

  const handleActivate = async () => {
    if (!licenseKey || licenseKey.length < 14) {
      setError('Please enter a valid license key');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Verify license with Edge Function
      const { data: licenseData, error: verifyError } = await supabase.functions.invoke('verify-license', {
        body: { license_key: licenseKey.trim().toUpperCase() }
      });

      if (verifyError || !licenseData?.valid) {
        setError(licenseData?.error || 'Invalid or expired license key');
        setIsLoading(false);
        return;
      }

      // Step 2: Sign in or create account (License = Password)
      const email = licenseData.customer_email;
      const password = licenseKey.trim().toUpperCase();

      // Try sign in first
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Account doesn't exist or wrong password? 
        // If it's a new license, we should try to sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              license_key: licenseKey,
              tier: licenseData.tier,
            }
          }
        });

        if (signUpError) {
          setError('Account initialization failed: ' + signUpError.message);
          setIsLoading(false);
          return;
        }
      }

      // Step 3: Store license in local config (Server Action)
      const saveRes = await saveLicenseToLocal(
        licenseKey,
        licenseData.tier,
        licenseData.is_trial,
        licenseData.expires_at
      );
      if (!saveRes.success) throw new Error('Local storage failed');

      // Step 4: Restore/Initialize User Data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Set Tier in Store
        useTierStore.getState().setTier(
          licenseData.tier,
          licenseData.expires_at,
          licenseData.is_trial
        );

        if (profile) {
          await storeBusinessId(profile.id);
          useBusinessProfileStore.getState().setProfile(profile);
          router.push('/dashboard');
        } else {
          router.push('/setup');
        }
      } else {
        router.push('/setup');
      }

      // Set cookie for quick middleware check
      document.cookie = `noxis_license_active=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;

    } catch (err: any) {
      setError(err.message || 'Activation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center p-6 font-sans text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#3b82f60a,transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full relative z-10 space-y-12"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-6">
          <div className="w-20 h-20 relative">
            <Image src="/logos/noxis.png" alt="Noxis" fill className="object-contain brightness-200" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">Activate Noxis</h1>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-[0.2em]">Enter your license key to get started</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="relative group">
              <input
                type="text"
                value={licenseKey}
                onChange={handleInputChange}
                placeholder="LITE-XXXX-XXXX-XXXX"
                spellCheck={false}
                autoFocus
                className={cn(
                  "w-full bg-white/[0.02] border border-white/10 focus:border-blue-500/50 outline-none rounded-2xl py-8 text-center font-mono text-3xl tracking-widest transition-all placeholder:text-white/5 placeholder:tracking-normal",
                  error && "border-red-500/50 bg-red-500/5"
                )}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500/90 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="font-medium">
                ⚠ Your license key is also your account password. Keep it private. Do not share it with anyone — not even Omnora Labs support.
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-bold uppercase tracking-tight">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleActivate}
              disabled={isLoading || !licenseKey}
              className="w-full bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-30 text-white font-black py-6 rounded-2xl transition-all shadow-[0_0_40px_rgba(59,130,246,0.2)] uppercase tracking-widest flex items-center justify-center gap-4 h-[76px]"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  <span>Activate System</span>
                </>
              )}
            </button>

            <div className="flex flex-col items-center space-y-4">
              <button 
                onClick={() => setLicenseKey('')}
                className="text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
              >
                Already have an account? Sign in with license key
              </button>
              <a 
                href="https://wa.me/923000000000" 
                target="_blank"
                className="text-blue-500/60 hover:text-blue-500 transition-colors text-xs font-bold uppercase tracking-widest"
              >
                Need a license? Contact Sales
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Help Bar */}
      <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/50 to-transparent">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-3 text-gray-500">
              <HelpCircle className="w-4 h-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Make sure you are connected to the internet. Activation requires a one-time connection.
              </p>
            </div>
            
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              Getting 'Failed to Fetch' error?
              <ChevronDown className={cn("w-3 h-3 transition-transform", showHelp && "rotate-180")} />
            </button>
          </div>

          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-blue-500 uppercase">Step 1</span>
                  <p className="text-xs text-gray-400">Check your WiFi or LAN connection for internet access.</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-blue-500 uppercase">Step 2</span>
                  <p className="text-xs text-gray-400">Disable any active VPN or proxy that might block the node.</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-blue-500 uppercase">Step 3</span>
                  <p className="text-xs text-gray-400">Wait 30 seconds and try again. If issues persist, contact support.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
