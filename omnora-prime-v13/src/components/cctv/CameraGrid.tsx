'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { Wifi, WifiOff, ZoomIn, Maximize2, AlertTriangle, Plus } from 'lucide-react';

interface Camera {
  id: string;
  name: string;
  status: string;
  manufacturer: string;
  model: string;
  resolution_main: string;
  webrtc_url?: string;
  supports_human_detection: boolean;
  recording_mode: string;
  last_seen_at: string;
}

const CameraTile = memo(function CameraTile({
  camera,
  isSelected,
  onSelect,
}: {
  camera: Camera;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState(true);

  useEffect(() => {
    if (!camera.webrtc_url) {
      setStreamLoading(false);
      setStreamError('No stream URL configured');
      return;
    }

    let pc: RTCPeerConnection;
    setStreamLoading(true);
    setStreamError(null);

    const startStream = async () => {
      try {
        pc = new RTCPeerConnection({
          iceServers: [],
        });

        pcRef.current = pc;

        pc.ontrack = (event) => {
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            setStreamLoading(false);
            setStreamError(null);
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            setStreamError('Stream disconnected');
          }
        };

        // mediamtx uses standard WHEP protocol for pulling streams via WebRTC
        const response = await fetch(`${camera.webrtc_url}/whep`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
          },
          body: (await pc.createOffer()).sdp,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const sdp = await response.text();
        await pc.setLocalDescription(await pc.createOffer());
        await pc.setRemoteDescription({
          type: 'answer',
          sdp,
        });

      } catch (err: any) {
        // Fallback or retry logic can go here. In local LAN, it fails if mediamtx hasn't started yet.
        setStreamError('No stream active');
        setStreamLoading(false);
      }
    };

    // Delay start slightly to let mediamtx spin up config
    const timer = setTimeout(startStream, 500);

    return () => {
      clearTimeout(timer);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [camera.webrtc_url]);

  const isOnline = camera.status === 'online';
  const mfrColor =
    camera.manufacturer === 'hikvision'
      ? '#E53E3E'
      : camera.manufacturer === 'imou'
      ? '#3182CE'
      : '#718096';

  return (
    <div
      onClick={onSelect}
      className={`relative bg-black rounded-sm overflow-hidden cursor-pointer transition-all border ${
        isSelected
          ? 'border-[#60A5FA] ring-1 ring-[#60A5FA]/30'
          : 'border-white/8 hover:border-white/20'
      }`}
      style={{ aspectRatio: '16/9' }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover ${(streamLoading || streamError || !isOnline) ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Loading state */}
      {streamLoading && isOnline && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0C0F]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#60A5FA]/20 border-t-[#60A5FA] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[10px] text-gray-600">Connecting WebRTC...</p>
          </div>
        </div>
      )}

      {/* Offline state */}
      {!isOnline && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0C0F]">
          <div className="text-center p-4">
            <WifiOff size={24} className="text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Camera Offline</p>
            <p className="text-[10px] text-gray-700 mt-1">
              {camera.last_seen_at
                ? `Last seen: ${new Date(camera.last_seen_at).toLocaleTimeString('en-PK')}`
                : 'Never connected'}
            </p>
          </div>
        </div>
      )}

      {/* Stream error */}
      {streamError && isOnline && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0C0F]">
          <div className="text-center p-4">
            <AlertTriangle size={20} className="text-amber-500 mx-auto mb-2" />
            <p className="text-[11px] font-bold text-gray-400">Preview Standby</p>
            <p className="text-[9px] text-gray-600 mt-1">Connecting to proxy...</p>
          </div>
        </div>
      )}

      {/* Camera overlay UI */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-2.5 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  backgroundColor: isOnline ? '#10B981' : '#374151',
                }}
              />
              <span className="text-[10px] font-bold text-white drop-shadow">
                {camera.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {camera.recording_mode === 'event' && (
                <span className="text-[8px] bg-[#60A5FA]/20 text-[#60A5FA] px-1.5 py-0.5 rounded font-bold border border-[#60A5FA]/10">
                  SMART
                </span>
              )}
              {camera.recording_mode === 'continuous' && (
                <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold border border-red-500/10 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                  REC
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-400 font-mono">
              {camera.resolution_main || '1080p'}
            </span>
            <div className="flex items-center gap-1.5">
              {camera.supports_human_detection && (
                <span className="text-[8px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold border border-emerald-500/10">
                  AI HUMAN
                </span>
              )}
              <span
                className="text-[8px] px-1.5 py-0.5 rounded font-bold border"
                style={{
                  color: mfrColor,
                  backgroundColor: mfrColor + '10',
                  borderColor: mfrColor + '20',
                }}
              >
                {camera.manufacturer?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export function CameraGrid({
  cameras,
  viewMode,
  selectedCamera,
  onSelectCamera,
  maxCameras,
  onAddCamera,
}: {
  cameras: Camera[];
  viewMode: 'grid' | 'single';
  selectedCamera: string | null;
  onSelectCamera: (id: string) => void;
  maxCameras: number;
  onAddCamera: () => void;
}) {
  const gridClass =
    cameras.length === 1
      ? 'grid-cols-1'
      : cameras.length === 2
      ? 'grid-cols-2'
      : cameras.length <= 4
      ? 'grid-cols-2'
      : 'grid-cols-3';

  const displayCameras = viewMode === 'single'
    ? cameras.filter(c => c.id === selectedCamera).length > 0
      ? cameras.filter(c => c.id === selectedCamera)
      : [cameras[0]]
    : cameras;

  const unusedSlots = maxCameras - cameras.length;

  return (
    <div className="h-full p-6 overflow-y-auto select-none bg-[#07080A]">
      <div className={`grid ${gridClass} gap-4`}>
        {displayCameras.map(camera => (
          <CameraTile
            key={camera.id}
            camera={camera}
            isSelected={selectedCamera === camera.id}
            onSelect={() => onSelectCamera(camera.id)}
          />
        ))}

        {/* Unused slot placeholders */}
        {viewMode === 'grid' && unusedSlots > 0 && (
          <div
            onClick={onAddCamera}
            className="border border-dashed border-white/8 hover:border-white/20 bg-[#0A0C0F]/40 hover:bg-[#0D1014]/60 transition-all rounded-sm flex flex-col items-center justify-center cursor-pointer group"
            style={{ aspectRatio: '16/9' }}
          >
            <div className="w-10 h-10 rounded-full bg-white/[0.02] group-hover:bg-white/[0.04] flex items-center justify-center border border-white/5 transition-colors mb-3">
              <Plus size={16} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
            </div>
            <p className="text-xs font-bold text-gray-500 group-hover:text-gray-300 transition-colors">
              Add Camera Slot
            </p>
            <p className="text-[10px] text-gray-600 mt-1">
              Slot {cameras.length + 1} of {maxCameras} available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
