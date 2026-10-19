'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import {
  Smartphone, Download, Wifi, WifiOff, Trash2, RefreshCw,
  ShieldCheck, AlertTriangle, Clock, QrCode, Globe, Zap,
  ShieldAlert, Lock, Ban
} from 'lucide-react';
import { useLicense } from '@/hooks/useLicense';

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

interface SecurityAuditItem {
  id: string;
  nodeId: string;
  eventType: string;
  payload: string | null;
  failedAuthCount: number | null;
  createdAt: string;
}

export default function DevicesPage() {
  const [persistedDevices, setPersistedDevices] = useState<PairedDevice[]>([]);
  const [liveDevices, setLiveDevices] = useState<LiveDevice[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string>('');
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [hubBridgeUrl, setHubBridgeUrl] = useState<string>('');
  const [hubIp, setHubIp] = useState<string>('');
  const [hubMobileUrl, setHubMobileUrl] = useState<string>('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [devRes, statusRes, secRes] = await Promise.all([
        fetch('/api/hub/devices'),
        fetch('/api/hub/info'),
        fetch('/api/hub/security-alerts'),
      ]);

      if (devRes.ok) {
        const data = await devRes.json();
        // API returns array directly or { devices: [] }
        const list = Array.isArray(data) ? data : (data.devices || []);
        setPersistedDevices(list.filter((d: PairedDevice) => !d.isRevoked));
      }

      let currentLive: LiveDevice[] = [];
      if (statusRes.ok) {
        const info = await statusRes.json();
        if (Array.isArray(info.bridge?.pairedDevices)) {
          currentLive = info.bridge.pairedDevices;
        }
        if (info.ip) setHubIp(info.ip);
        if (info.bridgeUrl) setHubBridgeUrl(info.bridgeUrl);
        if (info.mobileUrl) setHubMobileUrl(info.mobileUrl);
        if (info.tunnelUrl) setTunnelUrl(info.tunnelUrl);
      }

      // Also query direct Electron bridge status if available
      if ((window as any).electronAPI && typeof (window as any).electronAPI.getBridgeStatus === 'function') {
        try {
          const directStatus = await (window as any).electronAPI.getBridgeStatus();
          if (directStatus && Array.isArray(directStatus.pairedDevices) && directStatus.pairedDevices.length > 0) {
            currentLive = directStatus.pairedDevices;
          }
        } catch {}
      }

      setLiveDevices(currentLive);

      if (secRes.ok) {
        const alerts = await secRes.json();
        setSecurityAlerts(Array.isArray(alerts) ? alerts : []);
      }
    } catch (err: any) {
      setError('Could not load device data. Is the Hub running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Refresh quickly (3s) while settings page is open so paired devices appear immediately
    const interval = setInterval(load, 3000);

    const electronAPI = (window as any).electronAPI;
    const handleBridgeEvent = (_: any, payload: any) => {
      if (payload?.event === 'DEVICE_COUNT_CHANGED' || payload?.event === 'DEVICE_CONNECTED') {
        load();
      }
    };

    if (electronAPI?.on) {
      electronAPI.on('bridge-event', handleBridgeEvent);
    } else if (electronAPI?.onBridgeEvent) {
      electronAPI.onBridgeEvent(handleBridgeEvent);
    }

    return () => {
      clearInterval(interval);
      if (electronAPI?.off) {
        electronAPI.off('bridge-event', handleBridgeEvent);
      }
    };
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

  // Merge persisted + live data ensuring all connected devices display
  const matchedPersisted = persistedDevices.map(d => {
    const live = liveDevices.find(
      l => l.deviceId === d.deviceId || l.deviceId === d.nodeId
    );
    return { ...d, live };
  });

  const unmatchedLive = liveDevices
    .filter(l => !persistedDevices.some(d => d.deviceId === l.deviceId || d.nodeId === l.deviceId))
    .map(l => ({
      id: l.deviceId || 'live-' + Math.random(),
      nodeId: l.deviceId || 'live-device',
      deviceId: l.deviceId,
      deviceLabel: l.deviceLabel || 'Connected Mobile Device',
      label: l.deviceLabel || 'Connected Mobile Device',
      lastSeen: l.lastHeartbeat || new Date().toISOString(),
      isRevoked: 0,
      isActive: 1,
      createdAt: l.connectedAt || new Date().toISOString(),
      live: l,
    }));

  const allDevices = [...matchedPersisted, ...unmatchedLive];

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

  const lanIp = hubIp || '192.168.0.105';
  const realBridgeUrl = hubBridgeUrl || `ws://${lanIp}:7447`;
  const realLocalUrl = `http://${lanIp}:3000`;
  const realMobileUrl = hubMobileUrl || `http://${lanIp}:3000/mobile`;

  const qrPayload = JSON.stringify({
    v: 2,
    type: 'noxis-hub-pairing',
    businessName: 'Noxis Hub',
    bridgeUrl: realBridgeUrl,
    mobileUrl: realMobileUrl,
    tunnelUrl: tunnelUrl || null,
    ip: lanIp,
    port: 7447,
    endpoints: [
      ...(tunnelUrl ? [{ type: 'tunnel', url: tunnelUrl }] : []),
      { type: 'bridge', url: realBridgeUrl },
      { type: 'local', url: realLocalUrl },
    ],
    ts: Date.now(),
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

  const { tier, limit } = useLicense();
  const maxDeviceLimit = limit('max_devices');
  const maxDevicesDisplay = maxDeviceLimit === -1 ? '∞' : (maxDeviceLimit || 5);
  const tierName = (tier || 'lite').toUpperCase();

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
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {tierName} TIER ({maxDevicesDisplay} DEVICES MAX)
            </span>
          </div>
          <p className="text-xs text-gray-500 ml-11">
            Mobile handhelds paired with this Hub via WiFi or encrypted tunnel.
            Remove a device to revoke its mesh access immediately.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center space-x-2 px-3 py-1.5 text-[10px] uppercase font-bold text-gray-500 hover:text-white border border-white/5 hover:border-white/10 rounded-sm transition-all cursor-pointer"
        >
          <RefreshCw size={11} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Live stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {
            label: 'Paired Now',
            value: liveDevices.length,
            icon: Wifi,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
          },
          {
            label: `Authorized (${tierName})`,
            value: `${allDevices.length} / ${maxDevicesDisplay}`,
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

      {/* Tier Quotas Guidance Bar */}
      <div className="mb-6 p-3 bg-white/[0.02] border border-white/[0.06] rounded-sm flex flex-wrap items-center justify-between text-[11px] text-gray-400 gap-2">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-amber-400" />
          <span className="font-semibold text-white">Tier Capacity:</span>
          <span>Free: <strong className="text-gray-300">1</strong></span>
          <span className="text-gray-600">·</span>
          <span>Lite: <strong className="text-emerald-400">5 Devices</strong></span>
          <span className="text-gray-600">·</span>
          <span>Pro: <strong className="text-cyan-400">15 Devices</strong></span>
          <span className="text-gray-600">·</span>
          <span>Elite: <strong className="text-amber-400">50 Devices</strong></span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">
          WiFi & Cloud Tunnel Mesh
        </span>
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
              <div className="flex items-center gap-2">
                <Wifi size={10} className="text-[#60A5FA] flex-shrink-0" />
                <span className="text-[10px] font-mono text-gray-400 truncate">{realBridgeUrl}</span>
                <span className="text-[9px] text-[#60A5FA] bg-[#60A5FA]/10 px-1.5 py-0.5 rounded font-bold flex-shrink-0">WiFi Bridge</span>
              </div>
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

            {/* APK Direct Download Helper */}
      <div className="mb-8 p-4 bg-[#0F1114] border border-[#60A5FA]/20 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#60A5FA]/10 text-[#60A5FA] rounded-sm">
            <Smartphone size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-tight">Noxis Mobile Terminal</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/20">
                v14.0.0 APK
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Need to install the companion app on a new Android handheld or tablet?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/noxis-preview.apk"
            download="Noxis-Mobile-Terminal-v14.0.0.apk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#60A5FA] to-[#08EBF6] text-black hover:opacity-95 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(96,165,250,0.2)]"
          >
            <Download size={13} />
            <span>Download APK (116 MB)</span>
          </a>
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

      {/* Security Quarantine & Threat Audit Log */}
      <div className="mt-8 p-5 bg-[#0F1114] border border-white/[0.08] rounded-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} className="text-red-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white">
              Security Quarantine & Enforcement Audit
            </p>
            {securityAlerts.length > 0 && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                {securityAlerts.length} Events Logged
              </span>
            )}
          </div>
          <span className="text-[9px] text-gray-500 font-mono">
            Active Defenses: Socket Severing (1008) + IP Quarantine
          </span>
        </div>

        {securityAlerts.length === 0 ? (
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm text-center">
            <ShieldCheck size={20} className="text-emerald-400 mx-auto mb-1.5 opacity-80" />
            <p className="text-xs font-semibold text-gray-300">All Nodes Secure & Within Tier Limits</p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              No unauthorized pairing attempts, revoked handshake intrusions, or tier overflow breaches detected.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {securityAlerts.slice(0, 5).map((alert) => {
              let parsed: any = {};
              try {
                parsed = alert.payload ? JSON.parse(alert.payload) : {};
              } catch {
                parsed = { raw: alert.payload };
              }

              const isOverflow = alert.eventType === 'TIER_QUOTA_OVERFLOW_BLOCKED';
              const isRevoked = alert.eventType === 'REVOKED_DEVICE_ACCESS_ATTEMPT';

              return (
                <div
                  key={alert.id}
                  className="p-3 bg-black/40 border border-white/5 rounded-sm flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isOverflow
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : isRevoked
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-electric-blue/10 text-electric-blue border border-electric-blue/20'
                        }`}
                      >
                        {alert.eventType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 font-bold">
                        {alert.nodeId}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-400">
                      {isOverflow && (
                        <span>
                          Exceeded {parsed.tier?.toUpperCase()} tier cap ({parsed.currentCount}/{parsed.maxAllowed} devices). Handshake dropped & socket severed.
                        </span>
                      )}
                      {isRevoked && (
                        <span>
                          Revoked/Blacklisted handheld attempted re-pairing via QR scan. Denied.
                        </span>
                      )}
                      {!isOverflow && !isRevoked && (
                        <span>{parsed.reason || parsed.raw || 'Security policy rule triggered.'}</span>
                      )}
                    </p>

                    <div className="flex items-center gap-3 text-[9px] text-gray-600 font-mono">
                      {parsed.ip && <span>IP: {parsed.ip}</span>}
                      {parsed.deviceLabel && <span>Device: {parsed.deviceLabel}</span>}
                    </div>
                  </div>

                  <span className="text-[9px] text-gray-500 shrink-0 font-mono">
                    {formatTime(alert.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5-Layer Security Architecture */}
      <div className="mt-6 p-5 bg-white/[0.02] border border-white/5 rounded-sm">
        <div className="flex items-start space-x-3">
          <Lock size={15} className="text-electric-blue mt-0.5 shrink-0" />
          <div className="space-y-3 w-full">
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-widest">
                Multi-Layer Mesh Security Architecture
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                How Noxis Hub treats unauthorized devices, tier limits, and network intrusions:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
              <div className="p-2.5 bg-black/30 border border-white/5 rounded-sm space-y-1">
                <p className="font-bold text-gray-300 flex items-center gap-1.5">
                  <span className="text-electric-blue font-mono font-black">1.</span> Strict Tier Quota Gate
                </p>
                <p className="text-gray-500">
                  Strictly enforced across all tiers: <strong className="text-emerald-400">Lite: 5</strong> (6th blocked), <strong className="text-cyan-400">Pro: 15</strong> (16th blocked), <strong className="text-amber-400">Elite: 50</strong> (51st blocked), Free: 1 (2nd blocked). Any scan beyond tier capacity triggers <code className="text-amber-400 font-mono">ERR_TIER_LIMIT_EXCEEDED</code> and severs the socket instantly with WebSocket Code 1008.
                </p>
              </div>

              <div className="p-2.5 bg-black/30 border border-white/5 rounded-sm space-y-1">
                <p className="font-bold text-gray-300 flex items-center gap-1.5">
                  <span className="text-electric-blue font-mono font-black">2.</span> IP Flood Quarantine Jail
                </p>
                <p className="text-gray-500">
                  5 failed authorization or pairing attempts within 60 seconds automatically places the remote IP in a strict 5-minute quarantine jail, dropping subsequent TCP handshakes.
                </p>
              </div>

              <div className="p-2.5 bg-black/30 border border-white/5 rounded-sm space-y-1">
                <p className="font-bold text-gray-300 flex items-center gap-1.5">
                  <span className="text-electric-blue font-mono font-black">3.</span> Anti-Revocation Blacklist Gate
                </p>
                <p className="text-gray-500">
                  Revoking a device blacklists its cryptographic device ID. Re-scanning the QR code will NOT bypass revocation; the backend recognizes the revoked ID and rejects it.
                </p>
              </div>

              <div className="p-2.5 bg-black/30 border border-white/5 rounded-sm space-y-1">
                <p className="font-bold text-gray-300 flex items-center gap-1.5">
                  <span className="text-electric-blue font-mono font-black">4.</span> Desktop Hub HUD Alerts
                </p>
                <p className="text-gray-500">
                  Intrusion attempts and tier overflow events trigger immediate, high-priority red alert toasts on the Desktop Hub HUD and are permanently recorded in the security audit database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
