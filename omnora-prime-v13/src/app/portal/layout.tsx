"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock } from 'lucide-react';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useBusinessProfile();

  return (
    <div className="min-h-screen bg-[#121417] text-slate-200 font-inter flex flex-col antialiased">
      {/* Minimal Header (White-label) */}
      <header className="h-20 border-b border-white/5 bg-[#121417]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[900px] mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {profile?.logo_url ? (
              <img src={profile.logo_url} alt={profile.business_name} className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-8 h-8 bg-white/5 rounded-sm flex items-center justify-center border border-white/10">
                <ShieldCheck size={16} className="text-white/40" />
              </div>
            )}
            <span className="text-sm font-bold tracking-tight text-white uppercase">{profile?.business_name || 'Client Portal'}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            <Lock size={12} />
            <span>Secure Access</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[900px] mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>

      {/* White-label Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#0a0b0d]">
        <div className="max-w-[900px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">
            &copy; {new Date().getFullYear()} {profile?.business_name || 'Business'}. All Rights Reserved.
          </div>
          
          <div className="flex items-center space-x-2 text-[9px] uppercase tracking-widest text-gray-500">
            <ShieldCheck size={14} className="text-emerald" />
            <span>Secured by {profile?.business_name || 'Business'} Internal Systems</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

