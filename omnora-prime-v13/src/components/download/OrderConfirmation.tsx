"use client";

import React, { useState } from 'react';
import { Download, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface OrderConfirmationProps {
  orderId?: string;
  licenseKey?: string;
  customerName?: string;
  status?: string;
}

export function OrderConfirmation({
  orderId = '',
  licenseKey = '',
  customerName = 'Valued Customer',
  status = 'PAID',
}: OrderConfirmationProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      // Build query params or body with orderId/licenseKey
      const params = new URLSearchParams();
      if (orderId) params.append('orderId', orderId);
      if (licenseKey) params.append('licenseKey', licenseKey);
      params.append('fileName', 'Noxis Setup 13.0.0.exe');

      const response = await fetch(`/api/download-software?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.downloadUrl) {
        throw new Error(data.error || 'Payment or license verification failed. Unpaid orders cannot download.');
      }

      // Trigger direct browser download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.setAttribute('download', 'Noxis Setup 13.0.0.exe');
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error('[Download Error]:', err);
      setError(err.message || 'Failed to generate secure download link.');
    } finally {
      setIsDownloading(false);
    }
  };

  const isPaid = status.toUpperCase() === 'PAID' || status.toUpperCase() === 'COMPLETED' || status.toUpperCase() === 'SUCCESS';

  return (
    <div className="bg-[#0A0D10] border border-cyan-500/20 p-8 rounded-sm space-y-6 max-w-2xl mx-auto font-inter text-slate-200">
      {/* Header */}
      <div className="flex items-center space-x-4 border-b border-white/10 pb-6">
        <div className="w-12 h-12 rounded-sm bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2 py-0.5 border border-cyan-400/20 rounded-sm">
              Status: {status.toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">
            Order Confirmation — Noxis Hub Desktop
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Prepared for <span className="text-white font-bold">{customerName}</span>
          </p>
        </div>
      </div>

      {/* Details Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {orderId && (
          <div className="bg-[#040608] p-3 rounded border border-white/5 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase block font-bold">Order Reference ID</span>
            <span className="text-white font-bold">{orderId}</span>
          </div>
        )}
        {licenseKey && (
          <div className="bg-[#040608] p-3 rounded border border-white/5 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase block font-bold">License Key Signature</span>
            <span className="text-cyan-400 font-bold">{licenseKey}</span>
          </div>
        )}
      </div>

      {/* Download Action Section */}
      <div className="space-y-4 pt-2">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-sm text-red-400 text-xs flex items-center space-x-3">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading || !isPaid}
          className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-xs uppercase tracking-widest px-8 py-4 rounded-sm shadow-[0_0_25px_rgba(34,211,238,0.4)] flex items-center justify-center space-x-3 transition-all"
        >
          {isDownloading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Generating Secure R2 Signed Link...</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>Download Noxis Hub (.exe)</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider pt-1">
          <span className="flex items-center space-x-1">
            <ShieldCheck size={12} className="text-cyan-400" />
            <span>Cloudflare R2 Presigned SSL Download</span>
          </span>
          <span>15-Minute Expiry Token</span>
        </div>
      </div>
    </div>
  );
}
