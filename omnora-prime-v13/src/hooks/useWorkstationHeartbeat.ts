'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useWorkstationHeartbeat() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if this is Electron or a browser client
    const isElectron = Boolean(
      (window as any).electronWindow ||
      (window as any).electron ||
      navigator.userAgent.toLowerCase().includes('electron')
    );

    // Only secondary browsers need to heartbeat as workstations
    if (isElectron) return;

    let nodeId = localStorage.getItem('noxis_workstation_node_id');
    if (!nodeId) {
      nodeId = 'node-' + Math.random().toString(36).slice(2, 9) + '-' + Date.now().toString(36).slice(-4);
      localStorage.setItem('noxis_workstation_node_id', nodeId);
    }

    const getDeviceLabel = () => {
      const p = pathname || '';
      if (p.startsWith('/pos')) return 'POS Cash Counter';
      if (p.startsWith('/workstation')) return 'Office Workstation Node';
      if (p.startsWith('/mobile')) return 'Mobile Web Scanner';
      return 'LAN Workstation Client';
    };

    const sendHeartbeat = () => {
      try {
        fetch('/api/hub/workstations/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId,
            deviceLabel: getDeviceLabel(),
            path: pathname || '/workstation',
            tier: 'elite',
          }),
        }).catch(() => {});
      } catch {}
    };

    // Immediate initial heartbeat
    sendHeartbeat();

    // 10 second interval heartbeat
    const interval = setInterval(sendHeartbeat, 10000);

    const handleUnload = () => {
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(`/api/hub/workstations/heartbeat?nodeId=${encodeURIComponent(nodeId!)}`);
        }
      } catch {}
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [pathname]);
}
