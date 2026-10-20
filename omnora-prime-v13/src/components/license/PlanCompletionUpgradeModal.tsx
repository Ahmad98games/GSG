'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLicense } from '@/hooks/useLicense';
import {
  buildWhatsAppRenewalUrl,
  ADMIN_WHATSAPP_NUMBER,
  formatDatePk,
} from '@/lib/license/planIntelligence';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
  Clock,
  Building2,
  Calendar,
} from 'lucide-react';

export function PlanCompletionUpgradeModal() {
  const router = useRouter();
  const {
    showPlanEndedModal,
    dismissPlanEndedModal,
    planIntelligence,
    effectiveTier,
    previousPaidTier,
    tier,
  } = useLicense();

  if (!showPlanEndedModal) return null;

  const currentTier = (previousPaidTier || tier || 'pro') as string;
  const tierName = currentTier.charAt(0).toUpperCase() + currentTier.slice(1);
  const { user, billingCycleLabel, timespan, upgradeProposal } = planIntelligence;
  const whatsappUrl = buildWhatsAppRenewalUrl(upgradeProposal);

  const handleRenewMonthly = () => {
    dismissPlanEndedModal();
    router.push(`/settings/license/upgrade?tier=${currentTier}&cycle=monthly`);
  };

  const handleUpgradeAnnual = () => {
    dismissPlanEndedModal();
    router.push(`/settings/license/upgrade?tier=${currentTier}&cycle=annual`);
  };

  const handleContinueFree = () => {
    dismissPlanEndedModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-[#0D0F12] border border-amber-500/30 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Warning Strip */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              Plan Timespan Completed · Premium Deactivated
            </span>
          </div>
          <button
            onClick={dismissPlanEndedModal}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Your {tierName} {billingCycleLabel} Has Ended
              </h2>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                The software has self-detected plan completion and automatically switched to{' '}
                <span className="text-emerald-400 font-semibold">Free Forever mode</span>. Your store data is 100% safe.
              </p>
            </div>
          </div>

          {/* Self-Detected Plan Intelligence Card */}
          <div className="bg-[#14171C] border border-white/10 rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs">
              <span className="text-gray-400 font-mono flex items-center gap-1.5">
                <Building2 size={13} className="text-gray-500" />
                Customer / Account
              </span>
              <span className="font-semibold text-white">{user.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Plan & Tier</p>
                <p className="font-bold text-white mt-0.5">{tierName} ({billingCycleLabel})</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Active Timespan</p>
                <p className="font-bold text-amber-300 mt-0.5">
                  {timespan.totalTimespanDays} Days Completed (100%)
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-gray-500" />
                Timespan Window:
              </span>
              <span className="text-gray-300">{timespan.formattedActivePeriod}</span>
            </div>
          </div>

          {/* Feature State Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-md">
              <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={13} />
                Still Working (Zero Data Loss)
              </p>
              <p className="text-[10px] text-gray-400 leading-normal">
                POS billing, local Khata ledger, daily SQLite backups, and printing remain active forever.
              </p>
            </div>

            <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-md">
              <p className="text-[11px] font-bold text-red-400 flex items-center gap-1.5 mb-1">
                <Lock size={13} />
                Paused Premium Features
              </p>
              <p className="text-[10px] text-gray-400 leading-normal">
                Cloud Sync, Multi-Device Wi-Fi, RTSP CCTV cameras, and AI Sentinel are paused until renewal.
              </p>
            </div>
          </div>

          {/* Upgrade & Renewal Action Buttons */}
          <div className="space-y-2 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Recommended Renewal Options:
            </p>

            {/* Option 1: Annual Upgrade with Discount */}
            <button
              onClick={handleUpgradeAnnual}
              className="w-full p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-md font-bold text-xs flex items-center justify-between shadow-lg shadow-blue-500/20 transition-all group"
            >
              <div className="flex items-center gap-2.5 text-left">
                <Sparkles size={16} className="text-amber-300 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span>Upgrade to Annual {tierName}</span>
                    <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                      Save 25%
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-200 font-normal mt-0.5">
                    Uninterrupted 365-day access · Priority VIP support
                  </p>
                </div>
              </div>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Option 2: Monthly Renewal */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRenewMonthly}
                className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md font-semibold text-xs text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Zap size={13} className="text-amber-400" />
                <span>Renew Monthly Plan</span>
              </button>

              {/* Option 3: Direct WhatsApp Support */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 rounded-md font-semibold text-xs text-[#25D366] flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <MessageCircle size={14} />
                <span>WhatsApp Desk</span>
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#0A0C0E] px-6 py-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
          <span>Need help? Omnora Support: +{ADMIN_WHATSAPP_NUMBER}</span>
          <button
            onClick={handleContinueFree}
            className="text-gray-400 hover:text-white underline transition-colors text-[11px]"
          >
            Continue in Free Mode →
          </button>
        </div>
      </div>
    </div>
  );
}
