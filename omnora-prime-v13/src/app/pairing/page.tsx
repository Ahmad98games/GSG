"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { 
  Monitor, 
  Smartphone, 
  Loader2, 
  Wifi, 
  Globe, 
  Link as LinkIcon, 
  Info, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Laptop, 
  Copy, 
  Check, 
  ExternalLink,
  Layers,
  ArrowRight
} from "lucide-react";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useLicense } from "@/hooks/useLicense";
import Image from "next/image";
import Link from "next/link";

interface HubInfo {
  ip: string;
  localIp: string;
  port: number;
  bridgePort: number;
  bridgeUrl: string;
  mobileUrl: string;
  tunnelUrl: string | null;
  hostname: string;
  version: string;
}

interface PairingDevice {
  device_id?: string;
  deviceId?: string;
  node_id?: string;
  nodeId?: string;
  device_label?: string;
  deviceLabel?: string;
  label?: string;
  last_seen?: string;
  lastSeen?: string;
  isActive?: number;
  isLive?: boolean;
}

export default function PairingPage() {
  const { profile } = useBusinessProfile();
  const { tier, limit } = useLicense();
  const maxDeviceLimit = limit('max_devices');
  const maxDevicesDisplay = maxDeviceLimit === -1 ? '∞' : (maxDeviceLimit || 5);
  const tierName = (tier || 'lite').toUpperCase();

  const [activeTab, setActiveTab] = useState<'workstation' | 'mobile'>('workstation');
  const [hubInfo, setHubInfo] = useState<HubInfo | null>(null);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [unifiedQrCode, setUnifiedQrCode] = useState<string>("");
  const [connectedDevices, setConnectedDevices] = useState<PairingDevice[]>([]);
  const [copiedWorkstation, setCopiedWorkstation] = useState(false);
  const [copiedPos, setCopiedPos] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [clearingDevices, setClearingDevices] = useState(false);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/hub/devices");
      const data = await res.json();
      if (!data.error) {
        setConnectedDevices(Array.isArray(data) ? data : (data.devices || []));
      }
    } catch (err) {
      console.error("Failed to fetch devices", err);
    }
  };

  const revokeDevice = async (id: string) => {
    try {
      await fetch('/api/hub/devices/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: id, nodeId: id })
      });
      fetchDevices();
    } catch (e) {
      console.error('Revoke failed', e);
    }
  };

  const clearAllDevices = async () => {
    setClearingDevices(true);
    try {
      await fetch('/api/hub/devices', { method: 'DELETE' });
      await fetchDevices();
    } catch (e) {
      console.error('Clear failed', e);
    } finally {
      setClearingDevices(false);
    }
  };

  useEffect(() => {
    async function fetchHubInfo() {
      try {
        const res = await fetch("/api/hub/info");
        const data: HubInfo = await res.json();
        setHubInfo(data);
      } catch (err) {
        console.error("Failed to fetch hub info", err);
      }
    }

    fetchHubInfo();

    // Check for tunnel URL via IPC in desktop environment
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.getTunnelUrl) {
      electronAPI.getTunnelUrl().then((data: any) => {
        if (data?.url) {
          setTunnelUrl(data.url);
        }
      });

      // Listen for tunnel becoming ready dynamically
      electronAPI.onTunnelReady?.((data: any) => {
        if (data?.url) {
          setTunnelUrl(data.url);
        }
      });
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 4000);
    return () => clearInterval(interval);
  }, []);

  const lanIp = hubInfo?.ip || hubInfo?.localIp || '192.168.0.103';
  const webPort = (hubInfo as any)?.webPort || (hubInfo?.port && hubInfo.port !== 7447 ? hubInfo.port : 3000);
  const port = webPort;
  const workstationUrl = `http://${lanIp}:${webPort}/workstation`;
  const posUrl = `http://${lanIp}:${webPort}/pos`;
  const mobileUrl = `http://${lanIp}:${webPort}/mobile`;

  useEffect(() => {
    if (!hubInfo) return;
    const currentHubInfo = hubInfo;

    async function generateUnifiedQR() {
      try {
        const finalTunnelUrl = tunnelUrl
          ? (tunnelUrl.startsWith("ws")
              ? tunnelUrl
              : "wss://" +
                tunnelUrl.replace("https://", "").replace("http://", "") +
                "/mobile-bridge")
          : currentHubInfo.tunnelUrl;

        const payload = JSON.stringify({
          v: 2,
          type: 'noxis-hub-pairing',
          businessName: profile?.business_name || "Noxis Hub",
          bridgeUrl: currentHubInfo.bridgeUrl,
          mobileUrl: `http://${lanIp}:${port}/mobile`,
          workstationUrl: `http://${lanIp}:${port}/workstation`,
          tunnelUrl: finalTunnelUrl,
          ip: lanIp,
          port: currentHubInfo.bridgePort || 7447,
          endpoints: [
            ...(finalTunnelUrl ? [{ type: 'tunnel', url: finalTunnelUrl }] : []),
            { type: 'bridge', url: currentHubInfo.bridgeUrl },
            { type: 'mobile', url: `http://${lanIp}:${port}/mobile` },
            { type: 'workstation', url: `http://${lanIp}:${port}/workstation` },
            { type: 'local', url: `http://${lanIp}:${port}` },
          ],
          ts: Date.now(),
        });

        const url = await QRCode.toDataURL(payload, {
          width: 400,
          margin: 2,
          color: {
            dark: "#10B981",
            light: "#00000000"
          }
        });
        setUnifiedQrCode(url);
      } catch (err) {
        console.error("Failed to generate unified QR", err);
      }
    }

    generateUnifiedQR();
  }, [hubInfo, tunnelUrl, profile, lanIp, port]);

  const copyToClipboard = (text: string, type: 'workstation' | 'pos' | 'mobile') => {
    navigator.clipboard.writeText(text);
    if (type === 'workstation') {
      setCopiedWorkstation(true);
      setTimeout(() => setCopiedWorkstation(false), 2000);
    } else if (type === 'pos') {
      setCopiedPos(true);
      setTimeout(() => setCopiedPos(false), 2000);
    } else {
      setCopiedMobile(true);
      setTimeout(() => setCopiedMobile(false), 2000);
    }
  };

  const activeTunnel = tunnelUrl || hubInfo?.tunnelUrl;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 flex flex-col font-mono">
      {/* Header */}
      <div className="max-w-7xl mx-auto w-full mb-8 border-b border-slate-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="text-emerald-500 w-5 h-5 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Noxis Mesh Telemetry</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase">
            Workstation PCs & Device Mesh
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect secondary cash counter PCs, accounts laptops & mobile barcode scanners on your local office Wi-Fi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">Host IP: {lanIp}</span>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs: Workstations vs Mobile Handhelds */}
      <div className="max-w-7xl mx-auto w-full mb-8">
        <div className="flex border-b border-slate-800/80 gap-2">
          <button
            onClick={() => setActiveTab('workstation')}
            className={`flex items-center gap-2.5 px-6 py-3 font-bold text-xs uppercase tracking-wider rounded-t-xl transition-all border-t border-x ${
              activeTab === 'workstation'
                ? 'bg-slate-900/90 text-white border-blue-500/40 border-b-transparent shadow-lg text-blue-400'
                : 'bg-slate-950 text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <Laptop size={16} className={activeTab === 'workstation' ? 'text-blue-400' : 'text-slate-500'} />
            <span>🖥️ Workstation PCs on LAN</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              Up to 15 PCs (Pro) / 50 (Elite)
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-2.5 px-6 py-3 font-bold text-xs uppercase tracking-wider rounded-t-xl transition-all border-t border-x ${
              activeTab === 'mobile'
                ? 'bg-slate-900/90 text-white border-emerald-500/40 border-b-transparent shadow-lg text-emerald-400'
                : 'bg-slate-950 text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <Smartphone size={16} className={activeTab === 'mobile' ? 'text-emerald-400' : 'text-slate-500'} />
            <span>📱 Mobile Handhelds & Scanners</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              QR Pairing
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tab 1: Workstation PCs Content */}
        {activeTab === 'workstation' ? (
          <>
            {/* Column 1 & 2: Workstation Setup Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Workstation Gateway Card */}
              <div className="bg-slate-900/40 border border-blue-500/30 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
                  <div>
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] uppercase tracking-widest px-2.5 py-1 rounded font-bold">
                      Zero Client Installation
                    </span>
                    <h2 className="text-xl font-black text-white uppercase tracking-wider mt-2">
                      Connect Secondary Workstation PCs
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    Host: <strong className="text-white">{hubInfo?.hostname || 'Master Node'}</strong>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  Any secondary PC, laptop, or cashier computer connected to the same Wi-Fi router or office switch can operate as a full Noxis Workstation. 
                  All records write directly into your master host database in real time.
                </p>

                {/* URL Box 1: Workstation Portal */}
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Laptop size={12} /> Workstation Portal (Full Access)
                      </span>
                      <span className="text-[10px] text-slate-500">Opens Billing, Ledger, Stock & Reports</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        readOnly 
                        value={workstationUrl} 
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-xs text-blue-300 font-mono font-bold select-all focus:outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(workstationUrl, 'workstation')}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-all flex-shrink-0"
                      >
                        {copiedWorkstation ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                        <span>{copiedWorkstation ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <a
                        href={workstationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-lg text-xs transition-all flex-shrink-0"
                        title="Test Workstation Link"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  {/* URL Box 2: Dedicated POS Kiosk Counter */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Monitor size={12} /> Dedicated POS Cash Counter Kiosk
                      </span>
                      <span className="text-[10px] text-slate-500">Press F11 for Full-Screen Cash Register</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        readOnly 
                        value={posUrl} 
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-xs text-emerald-300 font-mono font-bold select-all focus:outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(posUrl, 'pos')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-all flex-shrink-0"
                      >
                        {copiedPos ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                        <span>{copiedPos ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <a
                        href={posUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-lg text-xs transition-all flex-shrink-0"
                        title="Test POS Link"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Workstation Guide */}
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  3 Simple Steps to Connect Any PC or Laptop
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">1</div>
                    <p className="font-bold text-slate-200">Connect to Wi-Fi</p>
                    <p className="text-[11px] leading-relaxed">Ensure the secondary PC is connected to the same office Wi-Fi router or switch as this Host PC.</p>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">2</div>
                    <p className="font-bold text-slate-200">Open Browser</p>
                    <p className="text-[11px] leading-relaxed">Open Chrome, Edge, or Brave on that PC and type <code className="text-blue-300">http://{lanIp}:3000</code> in the address bar.</p>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">3</div>
                    <p className="font-bold text-slate-200">Start Operating</p>
                    <p className="text-[11px] leading-relaxed">The secondary PC immediately syncs with this Host PC. No software installation or license dongle required!</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Tab 2: Mobile Handhelds & Barcode Scanners */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mobile QR Card */}
              <div className="bg-slate-900/40 border border-emerald-500/30 rounded-2xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                
                <div className="w-full">
                  <div className="flex justify-between items-center w-full mb-4">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase tracking-widest px-2.5 py-1 rounded font-bold">
                      Smart Phone Camera QR
                    </span>
                    <Wifi className="text-emerald-400 w-4 h-4" />
                  </div>

                  <h2 className="text-lg font-black text-white uppercase tracking-wider mb-1 text-left">
                    Mobile Barcode & POS
                  </h2>
                  <p className="text-xs text-slate-400 text-left mb-4 leading-relaxed">
                    Scan with any Android or iPhone camera connected to the office Wi-Fi.
                  </p>

                  {/* QR Container */}
                  <div className="relative p-3 bg-slate-950 border border-emerald-500/20 rounded-xl mb-4 flex items-center justify-center shadow-lg">
                    {unifiedQrCode ? (
                      <Image
                        src={unifiedQrCode}
                        alt="Mobile QR Code"
                        width={220}
                        height={220}
                        className="w-44 h-44 md:w-52 md:h-52 filter brightness-110"
                        unoptimized
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full">
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-left text-xs space-y-1.5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Mobile Link</span>
                    <div className="flex items-center justify-between">
                      <code className="text-xs text-emerald-400 font-mono font-bold truncate max-w-[200px]">{mobileUrl}</code>
                      <button 
                        onClick={() => copyToClipboard(mobileUrl, 'mobile')}
                        className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded"
                      >
                        {copiedMobile ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Features & Steps */}
              <div className="space-y-6">
                <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    Mobile Terminal Capabilities
                  </p>
                  <ul className="text-xs text-slate-400 space-y-2.5">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span><strong>Camera Barcode Scanner:</strong> Scan fabric & garment tags to check real-time stock and prices.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span><strong>Shop Floor POS:</strong> Take customer orders on the floor and send them directly to the main counter.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span><strong>Karigar Piece-Rate Entry:</strong> Log daily pieces finished by artisans right from the workshop floor.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span><strong>Khata Collection:</strong> Record payments received from wholesale parties on the spot.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
                  <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                    How to Connect
                  </p>
                  <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Connect phone to this office Wi-Fi.</li>
                    <li>Open standard Phone Camera.</li>
                    <li>Point camera at the green QR code.</li>
                    <li>Tap the notification to launch the mobile terminal!</li>
                  </ol>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Column 3: Live Mesh Status & Device Quota */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between text-left relative overflow-hidden group">
          <div className="w-full">
            <div className="flex justify-between items-center w-full mb-6">
              <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[9px] uppercase tracking-widest px-2.5 py-1 rounded font-bold">
                Local Mesh Telemetry
              </span>
              <div className="flex items-center gap-2">
                {connectedDevices.length > 0 && (
                  <button
                    onClick={clearAllDevices}
                    disabled={clearingDevices}
                    className="text-[9px] text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded uppercase font-bold transition-all disabled:opacity-50"
                    title="Clear offline device profiles"
                  >
                    {clearingDevices ? 'Clearing...' : 'Clear Offline'}
                  </button>
                )}
                <Layers className="text-slate-400 w-4 h-4" />
              </div>
            </div>

            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Connected Nodes</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">{tierName} TIER</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Real-time active workstations & paired terminals on this host.
            </p>

            {/* Quota Counter */}
            {(() => {
              const liveCount = connectedDevices.filter(d => Boolean(d.isLive)).length;
              return (
                <div className="mb-4 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Live Mesh Status</p>
                    <p className="text-xl font-black text-white font-mono mt-0.5">
                      {liveCount} <span className="text-xs text-slate-500 font-normal">Active / {maxDevicesDisplay} Allowed</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] border px-2 py-1 rounded font-bold uppercase ${
                      liveCount > 0 
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                        : 'text-slate-400 bg-slate-900 border-slate-800'
                    }`}>
                      {liveCount > 0 ? `${liveCount} MESH NODES ONLINE` : 'STANDALONE MASTER NODE'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Plan Capacity & Quota Guard */}
            <div className="mb-4 p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-[10px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Zap size={11} className="text-amber-400" /> Plan Workstations:</span>
              <span className="text-slate-300">Lite: <strong className="text-emerald-400">5</strong> · Pro: <strong className="text-cyan-400">15</strong> · Elite: <strong className="text-amber-400">50</strong></span>
            </div>

            {/* Devices list */}
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
              {connectedDevices.length === 0 ? (
                <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800/80 rounded-xl space-y-2 bg-slate-950/20">
                  <Monitor className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-[10px] uppercase font-bold tracking-wider">No secondary nodes active</p>
                  <p className="text-[9px] text-slate-600">Open http://{lanIp}:3000 on another PC to connect your first workstation</p>
                </div>
              ) : (
                connectedDevices.map((device: PairingDevice, idx: number) => {
                  const id = device.device_id || device.deviceId || device.node_id || device.nodeId || `node-${idx}`;
                  const label = device.device_label || device.deviceLabel || device.label || (device.isLive ? `Workstation ${idx + 1}` : 'Offline Terminal');
                  const isLive = Boolean(device.isLive);

                  return (
                    <div
                      key={id}
                      className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          isLive 
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' 
                            : 'bg-slate-600'
                        }`} />
                        <div>
                          <div className="font-bold text-slate-200 text-xs truncate max-w-[120px]">
                            {label}
                          </div>
                          <div className="text-[8px] text-slate-500 font-mono uppercase tracking-tighter truncate max-w-[120px]">
                            {id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] border px-2 py-0.5 rounded font-bold uppercase ${
                          isLive 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          {isLive ? 'ONLINE' : 'SAVED'}
                        </span>
                        <button
                          onClick={() => revokeDevice(id)}
                          className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors text-[10px]"
                          title="Remove device profile"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 mt-6 space-y-2">
            <div className="flex items-start gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-900 text-[10px] text-slate-500 leading-normal">
              <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p>Host Machine: <span className="text-slate-300 font-bold">{hubInfo?.hostname || 'Host PC'}</span></p>
                <p className="mt-0.5">Software Engine: <span className="text-slate-300 font-bold">Noxis v{hubInfo?.version || '14.0.0'}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
