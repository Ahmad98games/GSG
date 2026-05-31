import React from 'react';
import { redirect } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldAlert, RefreshCcw, Loader2 } from 'lucide-react';
import { verifyPortalToken } from '@/lib/actions/clientPortal';

/**
 * PHASE 12: PORTAL AUTHENTICATION GATEWAY (Server Component)
 * SECURITY: verifyPortalToken() is called server-side to prevent token exposure.
 */
export default async function PortalAuthPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ token?: string; expired?: string }> 
}) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;
  const isExpired = resolvedParams.expired === 'true';

  if (token) {
    // SECURITY: This call happens exclusively on the server.
    // It verifies the token hash and sets the httpOnly 'portal_session' cookie.
    const portal = await verifyPortalToken(token);
    
    if (portal) {
      // Redirect to dashboard now that the httpOnly session is set.
      redirect('/portal/dashboard');
    }
  }

  // --- ERROR / INITIAL STATE ---
  // If we reach here, either the token was missing, invalid, or expired.
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto min-h-[60vh]">
      <div className="p-5 bg-critical-red/10 text-critical-red rounded-full mb-8 border border-critical-red/20">
        <ShieldAlert size={40} />
      </div>
      
      <h1 className="text-xl font-black text-white uppercase tracking-widest mb-4">
        {isExpired ? 'Session Expired' : 'Verification Failed'}
      </h1>
      
      <p className="text-[10px] text-gray-500 font-bold leading-relaxed mb-10 uppercase tracking-[0.2em]">
        {isExpired 
          ? 'Your logistical access link has timed out for security.' 
          : 'The provided access token is invalid or has already been used.'}
      </p>

      <a
        href="/"
        className="w-full py-4 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white hover:text-onyx transition-all flex items-center justify-center space-x-3"
      >
        <RefreshCcw size={14} />
        <span>Request New Link</span>
      </a>
      
      <p className="mt-6 text-[9px] text-gray-600 uppercase tracking-widest font-bold">
        Contact your industrial partner to re-synchronize your node.
      </p>
    </div>
  );
}

