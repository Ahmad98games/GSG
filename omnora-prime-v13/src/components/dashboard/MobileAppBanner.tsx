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

  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem('mobile_banner_dismissed') === 'true');
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

  if (dismissed) return null;
  if (devices && devices.length > 0) return null;

  const APK_URL = 'https://github.com/omnoralabs/noxis-releases/releases/latest/download/noxis.apk';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#111418] border border-white/[0.06] rounded-sm mb-6 gap-4">
      <div className="flex items-center gap-4">
        <div className="text-2xl shrink-0">📱</div>
        <div>
          <p className="text-sm font-medium text-white">
            Get Noxis on your phone
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Scan barcodes, log production, and get alerts from anywhere in the factory.
            {tier !== 'lite' && ' Included in your plan.'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
        <a
          href={APK_URL}
          className="px-4 py-2 bg-[#10B981] text-black text-xs font-bold uppercase tracking-widest hover:bg-[#34d399] transition-colors"
        >
          Download APK
        </a>
        <button
          onClick={() => {
            localStorage.setItem('mobile_banner_dismissed', 'true');
            setDismissed(true);
          }}
          className="text-gray-600 hover:text-gray-400 text-xs cursor-pointer font-bold uppercase tracking-wider px-2 py-1 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
