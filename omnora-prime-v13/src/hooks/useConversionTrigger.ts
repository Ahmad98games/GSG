'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLicense } from '@/hooks/useLicense';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useToastStore } from '@/hooks/useToast';

const toast = {
  info: (msg: string, opts?: { message?: string }) => {
    useToastStore.getState().addToast({
      type: 'info',
      title: msg,
      message: opts?.message,
    });
  },
  success: (msg: string, opts?: { message?: string }) => {
    useToastStore.getState().addToast({
      type: 'success',
      title: msg,
      message: opts?.message,
    });
  },
  warning: (msg: string, opts?: { message?: string }) => {
    useToastStore.getState().addToast({
      type: 'warning',
      title: msg,
      message: opts?.message,
    });
  },
};

export function useConversionTrigger() {
  const router = useRouter();
  const { tier, trialDaysLeft, isTrial, effectiveTier, isPaid } = useLicense();
  const { profile } = useBusinessProfile();
  const triggered = useRef<Set<string>>(new Set());

  // Load previously triggered keys from localStorage to prevent duplicate annoying prompts
  useEffect(() => {
    try {
      const stored = localStorage.getItem('noxis_conversion_triggers');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          triggered.current = new Set(parsed);
        }
      }
    } catch {}
  }, []);

  const fire = useCallback((key: string, action: () => void) => {
    if (triggered.current.has(key)) return;
    triggered.current.add(key);
    try {
      localStorage.setItem('noxis_conversion_triggers', JSON.stringify(Array.from(triggered.current)));
    } catch {}
    action();
  }, []);

  // TRIGGER 1 — After first completed sale (Trial days 1-13)
  const onSaleComplete = useCallback(() => {
    const isTrialActive = isTrial || effectiveTier === 'free_trial';
    if (!isTrialActive && isPaid) return;

    fire('first_sale', () => {
      const days = trialDaysLeft > 0 ? trialDaysLeft : 14;
      toast.success(`✓ First sale recorded in Noxis! ${days} days of Elite access remaining.`);
    });
  }, [isTrial, effectiveTier, isPaid, trialDaysLeft, fire]);

  // TRIGGER 2 — After adding 50th item (Post-trial Free tier only)
  const onItemAdded = useCallback((count: number) => {
    const isFreeTier = effectiveTier === 'free' && !isTrial && !isPaid;
    if (!isFreeTier) return;

    if (count >= 50) {
      fire('item_50_reached', () => {
        toast.info("50 items loaded. Free plan allows 100. Lite plan: unlimited.");
      });
    }
  }, [effectiveTier, isTrial, isPaid, fire]);

  // TRIGGER 3 — After first karigar payslip
  const onPayslipGenerated = useCallback(() => {
    fire('first_payslip', () => {
      toast.info("Payslip generated. Payroll runs are a Lite+ feature. Automate this for all karigars in one click.");
    });
  }, [fire]);

  // TRIGGER 4 — When party balance exceeds PKR 100,000
  const onPartyBalanceHigh = useCallback((partyName: string, balance: number) => {
    if (balance < 100000) return;
    fire(`high_balance_${partyName}`, () => {
      toast.warning(`📊 ${partyName} owes PKR ${balance.toLocaleString()}. WhatsApp billing reminders (Lite+) can collect this faster.`);
    });
  }, [fire]);

  // TRIGGER 6 — After 7 days of daily use
  useEffect(() => {
    const isTrialActive = isTrial || effectiveTier === 'free_trial';
    if (!isTrialActive) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const storedDays = JSON.parse(localStorage.getItem('noxis_active_days') || '[]');
      if (!storedDays.includes(today)) {
        storedDays.push(today);
        localStorage.setItem('noxis_active_days', JSON.stringify(storedDays));
      }

      if (storedDays.length >= 7) {
        fire('7_days_active', () => {
          toast.info(`You have been using Noxis Hub for 7 days! ${trialDaysLeft} days remaining. Upgrade anytime to keep your active workflows.`);
        });
      }
    } catch {}
  }, [isTrial, effectiveTier, trialDaysLeft, fire]);

  return {
    onSaleComplete,
    onItemAdded,
    onPayslipGenerated,
    onPartyBalanceHigh,
  };
}
