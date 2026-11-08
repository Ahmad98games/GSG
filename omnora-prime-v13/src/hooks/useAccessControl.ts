'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useTierStore } from '@/stores/tierStore';
import { createClient } from '@/lib/supabase/client';

export function useAccessControl() {
  const [isBanned, setIsBanned] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('noxis_banned') === 'true';
    }
    return false;
  });
  const [banReason, setBanReason] = useState<string>('Workstation access has been suspended by the administrator.');
  const [hwid, setHwid] = useState<string>('');

  const { profile } = useBusinessProfile();
  const userName = profile?.owner_name || (typeof window !== 'undefined' ? localStorage.getItem('noxis_lead_name') : '') || 'Store Owner';
  const brandName = profile?.business_name || (typeof window !== 'undefined' ? localStorage.getItem('noxis_lead_business') : '') || 'My Business';
  const phone = profile?.phone || (typeof window !== 'undefined' ? localStorage.getItem('noxis_lead_phone') : '') || '';

  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);
  const latestProfileRef = useRef({ userName, brandName, phone });
  latestProfileRef.current = { userName, brandName, phone };

  const syncAndCheck = useCallback(async (currentHwid?: string, force = false) => {
    if (typeof window === 'undefined') return;

    // Throttle checks to once every 60 seconds unless forced
    const now = Date.now();
    if (!force && (now - lastSyncTimeRef.current < 60000 || isSyncingRef.current)) {
      return;
    }
    isSyncingRef.current = true;
    lastSyncTimeRef.current = now;

    let targetHwid = currentHwid || hwid;
    if (!targetHwid) {
      // 1. Try electronAPI
      const api = (window as any).electronAPI;
      if (api?.license?.getInfo) {
        try {
          const info = await api.license.getInfo();
          if (info?.hwid) targetHwid = info.hwid;
        } catch {}
      } else if (api?.license?.getHWID) {
        try {
          const id = await api.license.getHWID();
          if (id) targetHwid = id;
        } catch {}
      }

      // 2. Try localStorage fallback
      if (!targetHwid) {
        targetHwid = localStorage.getItem('noxis_hwid') || '';
      }
      if (!targetHwid) {
        // Deterministic client fallback
        targetHwid = `HW-${Math.abs(window.navigator.userAgent.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16).toUpperCase().padStart(8, '0')}`;
        localStorage.setItem('noxis_hwid', targetHwid);
      }
      setHwid((prev) => (prev !== targetHwid ? targetHwid : prev));
    }

    if (!targetHwid) {
      isSyncingRef.current = false;
      return;
    }

    const { userName: uName, brandName: bName, phone: ph } = latestProfileRef.current;

    // Send telemetry & check ban state against Supabase
    try {
      const res = await fetch('/api/license/sync-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hwid: targetHwid,
          userName: uName,
          businessName: bName,
          phone: ph,
          appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '14.0.35'
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.isBanned) {
          setIsBanned(true);
          setBanReason(json.banReason || 'Access to this workstation has been restricted by the administrator.');
          localStorage.setItem('noxis_banned', 'true');
        } else {
          setIsBanned(false);
          localStorage.removeItem('noxis_banned');

          // Commercial Grade Live Sync: Immediately reflect tier, trial state, and validity
          if (json.tier) {
            const rawTier = String(json.tier).toLowerCase();
            const normTier: 'lite' | 'pro' | 'elite' =
              rawTier === 'elite' ? 'elite' : rawTier === 'pro' ? 'pro' : 'lite';

            const curTier = useTierStore.getState().tier;
            if (curTier !== normTier) {
              useTierStore.getState().setTier(normTier, json.expiresAt, json.isTrial);
            }
            localStorage.setItem('noxis_tier', normTier);
            localStorage.setItem('noxis_license', JSON.stringify({
              key: json.licenseKey || `HWID-${targetHwid.slice(-8)}`,
              tier: normTier,
              expiresAt: json.expiresAt,
              isTrial: Boolean(json.isTrial),
              billingCycle: json.billingCycle || 'monthly',
              months: json.months || 1,
              hwid: targetHwid
            }));
          }
        }
        isSyncingRef.current = false;
        return;
      }
      throw new Error(`API route status ${res.status}`);
    } catch {
      // Direct Supabase Client fallback (bypasses any local route or port proxy issues)
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          const supabase = createClient();
          const cleanHwid = targetHwid.trim().toUpperCase();
          const { data: lic } = await supabase
            .from('licenses')
            .select('*')
            .or(`hwid.eq.${cleanHwid},license_key.eq.${cleanHwid}`)
            .maybeSingle();

          if (lic) {
            const isBannedDirect = Boolean(lic.is_deactivated || lic.is_active === false);
            setIsBanned(isBannedDirect);
            if (isBannedDirect) {
              setBanReason('Access to this workstation has been restricted by the administrator.');
              localStorage.setItem('noxis_banned', 'true');
            } else {
              localStorage.removeItem('noxis_banned');
              if (lic.tier) {
                const normTier: 'lite' | 'pro' | 'elite' =
                  String(lic.tier).toLowerCase() === 'elite' ? 'elite' :
                  String(lic.tier).toLowerCase() === 'pro' ? 'pro' : 'lite';
                const curTier = useTierStore.getState().tier;
                if (curTier !== normTier) {
                  useTierStore.getState().setTier(normTier, lic.expires_at, lic.is_trial);
                }
                localStorage.setItem('noxis_tier', normTier);
              }
            }
            isSyncingRef.current = false;
            return;
          }
        }
      } catch {}

      // Offline fallback: honor previously stored ban flag
      const storedBan = localStorage.getItem('noxis_banned') === 'true';
      setIsBanned(storedBan);
    } finally {
      isSyncingRef.current = false;
    }
  }, [hwid]);

  useEffect(() => {
    syncAndCheck();

    // Check periodically every 5 minutes when online
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        syncAndCheck();
      }
    }, 300000);

    const onOnline = () => syncAndCheck(undefined, true);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
    };
  }, [syncAndCheck]);

  return {
    isBanned,
    banReason,
    hwid,
    userName,
    brandName,
    recheck: () => syncAndCheck(undefined, true)
  };
}
