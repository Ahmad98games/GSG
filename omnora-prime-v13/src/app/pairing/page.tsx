"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Monitor, Smartphone, Loader2, Wifi, Globe, Link as LinkIcon, Info, ShieldCheck, Cpu } from "lucide-react";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import Image from "next/image";

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
  device_id: string;
  device_label?: string;
  last_seen?: string;
}

export default function PairingPage() {
  const { profile } = useBusinessProfile();
  const [hubInfo, setHubInfo] = useState<HubInfo | null>(null);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [unifiedQrCode, setUnifiedQrCode] = useState<string>("");
  const [connectedDevices, setConnectedDevices] = useState<PairingDevice[]>([]);

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
    async function fetchDevices() {
      try {
        const res = await fetch("/api/hub/devices");
        const data = await res.json();
        if (!data.error) {
          // Accept array directly or nested devices field
          setConnectedDevices(data.devices || data);
        }
      } catch (err) {
        console.error("Failed to fetch devices", err);
      }
    }

    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

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
          businessName: profile?.business_name || "Noxis Hub",
          bridgeUrl: currentHubInfo.bridgeUrl,
          mobileUrl: currentHubInfo.mobileUrl,
          tunnelUrl: finalTunnelUrl,
          ts: Date.now(),
        });

        const url = await QRCode.toDataURL(payload, {
          width: 400,
          margin: 2,
          color: {
            dark: "#10B981", // Beautiful Emerald Green for verification
            light: "#00000000"
          }
        });
        setUnifiedQrCode(url);
      } catch (err) {
        console.error("Failed to generate unified QR", err);
      }
    }

    generateUnifiedQR();
  }, [hubInfo, tunnelUrl, profile]);

  const activeTunnel = tunnelUrl || hubInfo?.tunnelUrl;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 flex flex-col font-mono">
      {/* Header */}
      <div className="max-w-7xl mx-auto w-full mb-10 border-b border-slate-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="text-emerald-500 w-5 h-5 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Noxis Hub Pipeline</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase">
            Mobile Connection Pipeline
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-400">Node Status: Active</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Unified Smart QR Card */}
        <div className="bg-slate-900/40 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-between text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          
          <div className="w-full">
            <div className="flex justify-between items-center w-full mb-6">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase tracking-widest px-2.5 py-1 rounded font-bold">
                Smart Connection QR
              </span>
              <Wifi className="text-emerald-400 w-5 h-5" />
            </div>

            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-2 text-left">
              Unified Pairing
            </h2>
            <p className="text-xs text-slate-400 text-left mb-6 leading-relaxed">
              Scan this single code. The mobile client will automatically try local WiFi first, then Cloud Tunnel.
            </p>

            {/* QR Container */}
            <div className="relative p-3 bg-slate-950 border border-emerald-500/10 rounded-xl mb-6 flex items-center justify-center shadow-lg">
              {unifiedQrCode ? (
                <Image
                  src={unifiedQrCode}
                  alt="Unified pairing QR code"
                  width={240}
                  height={240}
                  className="w-48 h-48 md:w-56 md:h-56 filter brightness-110"
                  unoptimized
                />
              ) : (
                <div className="w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="text-left bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[9px] uppercase font-bold">Local Host Link</span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <p className="text-slate-300 font-mono text-[10px] break-all">{hubInfo?.bridgeUrl || "Detecting local port..."}</p>
              
              <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                <span className="text-slate-500 text-[9px] uppercase font-bold">Cloud Tunnel Route</span>
                <span className={`w-2 h-2 rounded-full ${activeTunnel ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
              </div>
              <p className="text-slate-300 font-mono text-[10px] break-all">{activeTunnel || "Inactive (using local-only)"}</p>
            </div>
          </div>
        </div>

        {/* Column 2: Instruction Set & Connection Details */}
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              How to establish connection
            </p>
            <ol className="text-xs text-slate-400 space-y-3 list-decimal list-inside leading-relaxed">
              <li>
                Open the <strong className="text-white">Noxis Mobile app</strong> or visit the client url.
              </li>
              <li>
                Navigate to <strong className="text-white">Settings → Pairing</strong>.
              </li>
              <li>
                Point the device camera at the green <strong className="text-emerald-400">Smart QR code</strong>.
              </li>
              <li>
                The device will pair securely and auto-bond immediately.
              </li>
            </ol>
          </div>

          {hubInfo && (
            <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Open browser app directly
              </p>
              <p className="text-[10px] text-slate-500 mb-3 leading-normal">
                If the mobile package isn't installed, navigate here on the local WiFi network:
              </p>
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                <code className="text-xs text-blue-400 break-all select-all font-bold">
                  {hubInfo.mobileUrl}
                </code>
                <LinkIcon size={14} className="text-blue-500 flex-shrink-0 ml-2" />
              </div>
            </div>
          )}

          {!activeTunnel && (
            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                Cloud Tunnel Inactive
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Mixed Content restrictions prevent HTTPS pages from reaching local WebSocket IPs. 
                Configure a Cloudflare Tunnel under config settings to enable seamless remote WAN pairing.
              </p>
            </div>
          )}
        </div>

        {/* Column 3: Active Device Terminal */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between text-left relative overflow-hidden group">
          <div className="w-full">
            <div className="flex justify-between items-center w-full mb-6">
              <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[9px] uppercase tracking-widest px-2.5 py-1 rounded font-bold">
                Option 3: Active Links
              </span>
              <Smartphone className="text-slate-400 w-5 h-5" />
            </div>

            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-2">
              Connected Devices ({connectedDevices.length})
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              List of active tablets, terminals, and mobile devices connected to this local hub.
            </p>

            {/* Devices list */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {connectedDevices.length === 0 ? (
                <div className="text-center py-12 text-slate-600 border border-dashed border-slate-800/80 rounded-xl space-y-2 bg-slate-950/20">
                  <Monitor className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-[10px] uppercase font-bold tracking-wider">No active connections</p>
                </div>
              ) : (
                connectedDevices.map((device: PairingDevice) => (
                  <div
                    key={device.device_id}
                    className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between hover:border-emerald-500/20 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                      <div>
                        <div className="font-bold text-slate-200 text-xs truncate max-w-[130px]">
                          {device.device_label || "Active Client"}
                        </div>
                        <div className="text-[8px] text-slate-600 font-mono uppercase tracking-tighter truncate max-w-[130px]">
                          {device.device_id}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">
                        {device.last_seen
                          ? `Seen ${new Date(device.last_seen).toLocaleTimeString()}`
                          : "Connected"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 mt-6 space-y-3">
            <div className="flex items-start gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-900 text-[10px] text-slate-500 leading-normal">
              <Info size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p>Host: <span className="text-slate-400 font-bold">{hubInfo?.hostname}</span></p>
                <p className="mt-1">Version: <span className="text-slate-400 font-bold">v{hubInfo?.version}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
