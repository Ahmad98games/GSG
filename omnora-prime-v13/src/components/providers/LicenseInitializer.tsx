'use client';

import { useEffect } from 'react';

export function LicenseInitializer() {
  useEffect(() => {
    const checkLicense = async () => {
      const hasCookie = document.cookie.includes('noxis_license_active=true');
      if (!hasCookie) {
        try {
          const res = await fetch('/api/settings');
          if (!res.ok) return;
          
          const data = await res.json();
          const licenseKey = data.localConfig?.find((c: any) => c.key === 'license_key');
          
          if (licenseKey?.value) {
            document.cookie = `noxis_license_active=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;
            
            // If we're not on license or api, reload to apply middleware
            const path = window.location.pathname;
            if (path !== '/license' && !path.startsWith('/api')) {
              window.location.reload();
            }
          }
        } catch (err) {
          console.error('[License] Initialization failed:', err);
        }
      }
    };
    checkLicense();
  }, []);

  return null;
}
