"use client";

import React, { useState, useEffect } from 'react';
import { useTierStore } from '@/stores/tierStore';
import { useQuery } from '@tanstack/react-query';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { createClient } from '@/lib/supabase/client';

export function MobileAppBanner() {
  const { tier } = useTierStore();
  const { profile } = useBusinessProfile();
  const supabase = createClient();

  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setShowBanner(localStorage.getItem('apk_banner_dismissed') !== 'true');
  }, []);

  const { data: devices } = useQuery({
    queryKey: ['paired-devices', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('authorized_devices')
        .select('id')
        .eq('business_id', profile.id);
      return data || [];
    },
    enabled: !!profile?.id
  });

  if (!showBanner) return null;
  if (devices && devices.length > 0) return null;

  const APK_URL = 'https://github.com/omnoralabs/noxis-releases/releases/latest/download/noxis.apk';

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F1114] border border-[#10B981]/20 rounded-sm mb-4">
      <div className="flex items-center gap-3">
        <span className="text-sm">📱</span>
        <p className="text-xs text-gray-400">
          Get the Android app — scan barcodes and get alerts on the go
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <a href={APK_URL}
          className="text-xs font-semibold text-[#10B981] hover:text-emerald-300 transition-colors">
          Download APK
        </a>
        <button
          onClick={() => {
            localStorage.setItem('apk_banner_dismissed', 'true');
            setShowBanner(false);
          }}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  );
}
