'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import {
  Smartphone, Wifi, WifiOff, Trash2, RefreshCw,
  ShieldCheck, AlertTriangle, Clock, QrCode, Globe
} from 'lucide-react';

interface PairedDevice {
  id?: string;
  nodeId: string;
  deviceId: string | null;
  deviceLabel: string | null;
  label: string | null;
  lastSeen: string | null;
  isRevoked: number;
  isActive: number;
  createdAt: string | null;
}

interface LiveDevice {
  deviceId: string | null;
  deviceLabel: string | null;
  connectedAt: string;
  lastHeartbeat: string;
  tier: string | null;
}

export default function DevicesPage() {
  const [persistedDevices, setPersistedDevices] = useState<PairedDevice[]>([]);
  const [liveDevices, setLiveDevices] = useState<LiveDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string>('');
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [devRes, statusRes] = await Promise.all([
        fetch('/api/hub/devices'),
        fetch('/api/hub/info'),
      ]);

      if (devRes.ok) {
        const data = await devRes.json();
        // API returns array directly or { devices: [] }
        const list = Array.isArray(data) ? data : (data.devices || []);
        setPersistedDevices(list.filter((d: PairedDevice) => !d.isRevoked));
      }

      if (statusRes.ok) {
        const info = await statusRes.json();
        setLiveDevices(info.bridge?.pairedDevices || []);
      }
    } catch (err: any) {
      setError('Could not load device data. Is the Hub running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 5 minutes to check heartbeat updates without draining resources.
    const interval = setInterval(load, 300000);
    return () => clearInterval(interval);
  }, [load]);

  const revokeDevice = async (nodeId: string, label: string | null) => {
    const confirmed = window.confirm(
      `Remove "${label || 'this device'}"?\n\nIt will be disconnected immediately and will need to scan the QR code again to re-pair.`
    );
    if (!confirmed) return;

    setRevoking(nodeId);
    try {
      const res = await fetch('/api/hub/devices/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId }),
      });
      if (!res.ok) throw new Error('Revoke failed');
      setPersistedDevices(prev => prev.filter(d => d.nodeId !== nodeId));
      setLiveDevices(prev => prev.filter(d => d.deviceId !== nodeId));
    } catch {
      setError('Failed to revoke device. Try again.');
    } finally {
      setRevoking(null);
    }
  };

  // Merge persisted + live data
  const allDevices = persistedDevices.map(d => {
    const live = liveDevices.find(
      l => l.deviceId === d.deviceId || l.deviceId === d.nodeId
    );
    return { ...d, live };
  });

  // Detect local Hub URL and tunnel URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.protocol}//${window.location.host}`;
      setLocalUrl(url);
    }
    // Fetch tunnel status
    fetch('/api/hub/tunnel-status')
      .then(r => r.json())
      .then(d => { if (d.tunnelUrl) setTunnelUrl(d.tunnelUrl); })
      .catch(() => {});
  }, []);

  const qrPayload = JSON.stringify({
    v: 1,
    type: 'noxis-hub-pairing',
    endpoints: [
      ...(tunnelUrl ? [{ type: 'tunnel', url: tunnelUrl }] : []),
      ...(localUrl ? [{ type: 'local', url: localUrl }] : []),
    ],
  });

  const formatTime = (iso: string | null) => {
    if (!iso) return 'Never';
    try {
      return new Date(iso).toLocaleString('en-PK', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/5 rounded w-48" />
          <div className="h-4 bg-white/5 rounded w-72" />
          <div className="space-y-2 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-electric-blue/10 rounded-sm text-electric-blue">
              <Smartphone size={20} />
            </div>
            <h1 className="text-lg font-bold text-white uppercase tracking-tight">
              Connected Devices
            </h1>
          </div>
          <p className="text-xs text-gray-500 ml-11">
            Mobile phones paired with this Hub via WiFi.
            Remove a device to revoke its access immediately.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center space-x-2 px-3 py-1.5 text-[10px] uppercase font-bold text-gray-500 hover:text-white border border-white/5 hover:border-white/10 rounded-sm transition-all"
        >
          <RefreshCw size={11} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Live stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            label: 'Paired Now',
            value: liveDevices.length,
            icon: Wifi,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Authorized',
            value: allDevices.length,
            icon: ShieldCheck,
            color: 'text-electric-blue',
            bg: 'bg-electric-blue/10',
          },
          {
            label: 'Last Updated',
            value: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
            icon: Clock,
            color: 'text-gray-400',
            bg: 'bg-white/5',
          },
        ].map(stat => (
          <div
            key={stat.label}
            className="p-4 bg-[#0F1114] border border-white/5 rounded-sm flex items-center space-x-3"
          >
            <div className={`p-2 ${stat.bg} rounded-sm ${stat.color}`}>
              <stat.icon size={14} />
            </div>
            <div>
              <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">
                {stat.label}
              </p>
              <p className={`text-sm font-bold font-mono ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-3 p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-sm"
          >
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pairing QR Code */}
      <div className="mb-8 p-5 bg-[#0F1114] border border-white/[0.08] rounded-sm">
        <div className="flex items-center gap-2 mb-4">
          <QrCode size={14} className="text-[#60A5FA]" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Mobile Pairing QR</p>
          {tunnelUrl && (
            <span className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold ml-auto">
              <Globe size={8} /> Tunnel Active
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* QR */}
          <div className="flex-shrink-0 p-3 bg-white rounded-sm">
            {localUrl && (
              <QRCode
                value={qrPayload}
                size={140}
                bgColor="#FFFFFF"
                fgColor="#0A0C0F"
                level="M"
              />
            )}
          </div>
          {/* Instructions */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs font-semibold text-white mb-1">How to pair your phone</p>
              <ol className="space-y-1.5 text-[11px] text-gray-500 list-none">
                <li><span className="text-[#60A5FA] font-bold mr-1">1.</span>Open the Noxis Mobile app on your Android phone</li>
                <li><span className="text-[#60A5FA] font-bold mr-1">2.</span>Make sure your phone is on the same WiFi as this PC</li>
                <li><span className="text-[#60A5FA] font-bold mr-1">3.</span>Tap <strong className="text-white">Scan QR</strong> and point your camera at this code</li>
                <li><span className="text-[#60A5FA] font-bold mr-1">4.</span>The phone will auto-connect. Your device will appear below.</li>
              </ol>
            </div>
            <div className="space-y-1">
              {localUrl && (
                <div className="flex items-center gap-2">
                  <Wifi size={10} className="text-[#60A5FA] flex-shrink-0" />
                  <span className="text-[10px] font-mono text-gray-600 truncate">{localUrl}</span>
                  <span className="text-[9px] text-[#60A5FA] bg-[#60A5FA]/10 px-1.5 py-0.5 rounded font-bold flex-shrink-0">WiFi</span>
                </div>
              )}
              {tunnelUrl && (
                <div className="flex items-center gap-2">
                  <Globe size={10} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-[10px] font-mono text-gray-600 truncate">{tunnelUrl}</span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold flex-shrink-0">Tunnel</span>
                </div>
              )}
              {!tunnelUrl && (
                <p className="text-[9px] text-gray-700 mt-1">
                  💡 Set <code className="text-gray-600">CLOUDFLARE_TUNNEL_URL</code> in .env.local to enable remote access via tunnel.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Device list */}
      {allDevices.length === 0 ? (
        <div className="p-12 text-center bg-[#0F1114] border border-white/5 rounded-sm">
          <WifiOff size={32} className="text-gray-700 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-400">No devices paired yet</p>
          <p className="text-xs text-gray-700 mt-2 max-w-xs mx-auto">
            Open the Noxis mobile app on the same WiFi network and scan the QR code
            in Settings → Mobile Pairing.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {allDevices.map((device) => {
              const isLive = !!device.live;
              const displayName = device.deviceLabel || device.label || 'Unnamed Device';
              const deviceIdStr = device.deviceId || device.nodeId;

              return (
                <motion.div
                  key={device.nodeId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`flex items-center justify-between p-4 bg-[#0F1114] border rounded-sm transition-all ${
                    isLive ? 'border-emerald-500/20' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Live indicator */}
                    <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-gray-700'}`} />

                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-white">
                          {displayName}
                        </p>
                        {isLive && (
                          <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-[2px]">
                            Online
                          </span>
                        )}
                        {device.live?.tier && (
                          <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-electric-blue/10 text-electric-blue rounded-[2px]">
                            {device.live.tier}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-gray-600 mt-0.5">
                        {deviceIdStr}
                      </p>
                      <p className="text-[10px] text-gray-700 mt-1">
                        {isLive
                          ? `Heartbeat: ${formatTime(device.live!.lastHeartbeat)}`
                          : `Last seen: ${formatTime(device.lastSeen)}`
                        }
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => revokeDevice(device.nodeId, displayName)}
                    disabled={revoking === device.nodeId}
                    className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500/60 hover:text-red-400 border border-red-500/10 hover:border-red-500/30 px-3 py-2 rounded-sm transition-all disabled:opacity-40"
                  >
                    <Trash2 size={11} />
                    <span>{revoking === device.nodeId ? 'Removing…' : 'Remove'}</span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Security note */}
      <div className="mt-8 p-4 bg-white/[0.02] border border-white/5 rounded-sm">
        <div className="flex items-start space-x-3">
          <ShieldCheck size={14} className="text-electric-blue mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">
              Security Notes
            </p>
            <ul className="text-[10px] text-gray-600 space-y-1">
              <li>• Devices must be on the same WiFi as this Hub to connect</li>
              <li>• Removing a device disconnects it instantly and requires re-pairing</li>
              <li>• Device IDs are validated (8–64 chars, alphanumeric) before pairing</li>
              <li>• Connections that don't pair within 30 seconds are auto-disconnected</li>
              <li>• Connections silent for 90+ seconds are automatically dropped</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
