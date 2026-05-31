"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Monitor, Smartphone, Loader2 } from "lucide-react";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import Image from "next/image";

interface PairingDevice {
  nodeId: string;
  label?: string;
  isActive: boolean;
  lastSeen?: string;
}

export default function PairingPage() {
  const { profile } = useBusinessProfile();
  const [hubInfo, setHubInfo] = useState<{ ip: string; port: number } | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [connectedDevices, setConnectedDevices] = useState<PairingDevice[]>([]);
  // 32-byte hex pairing key
  const [pairingKey] = useState(() => Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));

  useEffect(() => {
    async function fetchHubInfo() {
      try {
        const res = await fetch("/api/hub/info");
        const data = await res.json();
        setHubInfo(data);

        const qrPayload = JSON.stringify({
          ip: data.ip,
          port: 9000, // Enforced port per requirements
          business_id: profile?.id || "system_default",
          key: pairingKey
        });

        const url = await QRCode.toDataURL(qrPayload, {
          width: 400,
          margin: 2,
          color: {
            dark: "#FACC15",
            light: "#00000000"
          }
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error("Failed to fetch hub info or generate QR", err);
      }
    }

    fetchHubInfo();
  }, [profile?.id, pairingKey]);

  useEffect(() => {
    // Fetch authorized devices via API
    async function fetchDevices() {
      try {
        const res = await fetch("/api/hub/devices");
        const data = await res.json();
        if (!data.error) {
          setConnectedDevices(data);
        }
      } catch (err) {
        console.error("Failed to fetch devices", err);
      }
    }

    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex flex-col items-center justify-center font-mono">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left: QR Code Section */}
        <div className="flex flex-col items-center text-center space-y-6">
          <h1 className="text-3xl font-bold text-yellow-400 tracking-tighter uppercase">
            Mobile Pairing Portal
          </h1>
          
          <div className="relative p-4 bg-slate-900 border-2 border-yellow-400/30 rounded-2xl shadow-[0_0_50px_rgba(250,204,21,0.1)]">
            {qrCodeDataUrl ? (
              <Image src={qrCodeDataUrl} alt="Pairing QR Code" width={320} height={320} className="w-64 h-64 md:w-80 md:h-80" unoptimized />
            ) : (
              <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
              </div>
            )}
            
            <div className="absolute -top-3 -left-3 bg-yellow-400 text-black px-3 py-1 text-xs font-bold rounded-full">
              SCAN ME
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-400">Hub Local IP Address</p>
            <div className="text-2xl font-bold text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-lg border border-yellow-400/20">
              {hubInfo?.ip || "Detecting..."}
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-widest pt-2">
              Scan with Noxis Mobile app to connect
            </p>
          </div>
        </div>

        {/* Right: Connected Devices Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-6 self-start h-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-yellow-400" />
              Authorized Devices
            </h2>
            <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs">
              {connectedDevices.length} Active
            </span>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {connectedDevices.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-3">
                <Monitor className="w-12 h-12 mx-auto opacity-20" />
                <p>No devices paired yet</p>
              </div>
            ) : (
              connectedDevices.map((device: PairingDevice) => (
                <div 
                  key={device.nodeId}
                  className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between hover:border-yellow-400/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${device.isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                    <div>
                      <div className="font-bold text-slate-100">{device.label || "Unnamed Device"}</div>
                      <div className="text-xs text-slate-500 truncate w-40 uppercase">{device.nodeId}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Last Seen</div>
                    <div className="text-xs font-medium text-slate-300 italic">Just now</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 leading-relaxed">
            <p>Ensure your mobile device is on the same local network as the Hub. Connection uses high-speed TCP/NSP protocol.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
