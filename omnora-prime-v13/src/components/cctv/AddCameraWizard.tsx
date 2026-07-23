'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { Wifi, Search, CheckCircle, AlertTriangle, Camera, X, Loader, Shield, Lock, Eye, EyeOff } from 'lucide-react';

type Step =
  | 'scan'        // Scanning network
  | 'select'      // Select from found devices
  | 'manual'      // Manual IP entry
  | 'credentials' // Enter username/password
  | 'detecting'   // Getting camera details
  | 'configure'   // Name and settings
  | 'done';       // Success

interface DiscoveredDevice {
  ip: string;
  discoveryMethod: 'onvif' | 'tcp_scan';
  name?: string;
  xaddr?: string;
}

interface CameraDetails {
  manufacturer: string;
  model: string;
  serialNumber?: string;
  firmwareVersion?: string;
  resolutionMain?: string;
  resolutionSub?: string;
  rtspUrlMain?: string;
  rtspUrlSub?: string;
  supportsPtz: boolean;
  supportsAudio: boolean;
  supportsHumanDetection: boolean;
  supportsVehicleDetection: boolean;
}

export function AddCameraWizard({
  businessId,
  nextSlot,
  onClose,
  onAdded,
}: {
  businessId: string;
  nextSlot: number;
  onClose: () => void;
  onAdded: () => void;
}) {
  const supabase = createClient();
  const win = typeof window !== 'undefined' ? (window as any) : null;
  const [step, setStep] = useState<Step>('scan');
  const [scanning, setScanning] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredDevice[]>([]);
  const [selected, setSelected] = useState<DiscoveredDevice | null>(null);
  const [manualIp, setManualIp] = useState('');
  const [credentials, setCredentials] = useState({ username: 'admin', password: '' });
  const [cameraDetails, setCameraDetails] = useState<CameraDetails | null>(null);
  const [cameraName, setCameraName] = useState('');
  const [recordingMode, setRecordingMode] = useState<'event' | 'continuous'>('event');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // STEP 1: Scan network
  const startScan = useCallback(async () => {
    setScanning(true);
    setDiscovered([]);
    setError(null);
    setScanProgress('Starting network scan...');

    try {
      if (!win?.cctv) {
        // Not in Electron / no API — fallback to manual IP entry
        setStep('manual');
        setScanning(false);
        return;
      }

      setScanProgress('Searching for Hikvision and Imou cameras...');
      const devices: DiscoveredDevice[] = await win.cctv.discover();
      setDiscovered(devices);

      if (devices.length === 0) {
        setScanProgress('No cameras found automatically.');
      } else {
        setScanProgress(`Found ${devices.length} device${devices.length > 1 ? 's' : ''} on your network.`);
      }
      setStep('select');
    } catch (err: any) {
      setError('Network scan failed. Try entering the camera IP manually.');
      setStep('select');
    } finally {
      setScanning(false);
    }
  }, []);

  // STEP 2: Get camera details
  const detectCamera = useCallback(async () => {
    const ip = selected?.ip || manualIp;
    if (!ip) return;

    setStep('detecting');
    setError(null);

    try {
      if (!win?.cctv) {
        // Fallback placeholder values if running outside Electron
        setCameraDetails({
          manufacturer: 'other',
          model: 'Generic Camera',
          resolutionMain: '1920×1080',
          supportsPtz: false,
          supportsAudio: false,
          supportsHumanDetection: true,
          supportsVehicleDetection: false,
          rtspUrlMain: `rtsp://${credentials.username}:${credentials.password}@${ip}:554/stream1`,
          rtspUrlSub: `rtsp://${credentials.username}:${credentials.password}@${ip}:554/stream2`,
        });
        setCameraName(`Camera ${nextSlot}`);
        setStep('configure');
        return;
      }

      const result = await win.cctv.getDetails({
        ip,
        port: 80,
        username: credentials.username,
        password: credentials.password,
      });

      if (result?.success && result.info) {
        setCameraDetails(result.info);
        const brand = result.info.manufacturer === 'hikvision'
          ? 'Hikvision'
          : result.info.manufacturer === 'imou'
          ? 'Imou'
          : result.info.manufacturer === 'dahua'
          ? 'Dahua'
          : 'Camera';
        setCameraName(`${brand} ${nextSlot}`);
        setStep('configure');
      } else {
        setError(result?.error || 'Could not connect to camera. Check IP and password.');
        setStep('credentials');
      }
    } catch (err: any) {
      setError('Connection failed. Make sure camera is on the same WiFi/LAN.');
      setStep('credentials');
    }
  }, [selected, manualIp, credentials, nextSlot]);

  // STEP 3: Save camera
  const saveCamera = useCallback(async () => {
    if (!cameraDetails || !businessId) return;
    setSaving(true);
    setError(null);

    const ip = selected?.ip || manualIp;

    try {
      // Encrypt password before storage
      let passwordEncrypted = credentials.password;
      if (win?.cctv) {
        passwordEncrypted = await win.cctv.encryptPassword(credentials.password);
      }

      // WebRTC proxy URL path naming scheme
      const streamId = `cam_${nextSlot}`;
      const webrtcUrl = `http://127.0.0.1:8889/${streamId}`;

      const { error: insertError } = await supabase.from('cctv_cameras').insert({
        business_id: businessId,
        name: cameraName,
        manufacturer: cameraDetails.manufacturer,
        model: cameraDetails.model,
        serial_number: cameraDetails.serialNumber || null,
        firmware_version: cameraDetails.firmwareVersion || null,
        ip_address: ip,
        onvif_port: 80,
        username: credentials.username,
        password_encrypted: passwordEncrypted,
        rtsp_url_main: cameraDetails.rtspUrlMain || null,
        rtsp_url_sub: cameraDetails.rtspUrlSub || null,
        webrtc_url: webrtcUrl,
        status: 'online',
        last_seen_at: new Date().toISOString(),
        recording_mode: recordingMode,
        record_on_human: true,
        record_on_motion: recordingMode === 'continuous',
        supports_ptz: cameraDetails.supportsPtz,
        supports_audio: cameraDetails.supportsAudio,
        supports_human_detection: cameraDetails.supportsHumanDetection,
        supports_vehicle_detection: cameraDetails.supportsVehicleDetection,
        resolution_main: cameraDetails.resolutionMain || null,
        resolution_sub: cameraDetails.resolutionSub || null,
        connection_type: selected?.discoveryMethod === 'onvif' ? 'wireless' : 'wired',
        slot_number: nextSlot,
        storage_path: null,
        max_storage_gb: 10,
        is_active: true,
      });

      if (insertError) throw insertError;

      setStep('done');
      setTimeout(onAdded, 1500);
    } catch (err: any) {
      setError('Could not save camera: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [cameraDetails, businessId, selected, manualIp, credentials, cameraName, recordingMode, nextSlot, onAdded, supabase]);

  const INPUT = `w-full bg-[#161A1F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40 rounded-sm`;
  const LABEL = `text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5`;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0A0C0F] border border-white/12 rounded-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <Camera size={18} className="text-[#60A5FA]" />
            <h2 className="text-base font-bold text-white">Add Security Camera</h2>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        {/* Step progress bar */}
        <div className="flex px-5 py-3 border-b border-white/6 gap-1">
          {['Find', 'Connect', 'Configure', 'Done'].map((label, i) => {
            const currentIndex =
              step === 'scan' || step === 'select'
                ? 0
                : step === 'manual' || step === 'credentials' || step === 'detecting'
                ? 1
                : step === 'configure'
                ? 2
                : 3;

            return (
              <div key={label} className="flex items-center flex-1">
                <div className={`flex-1 h-0.5 ${i < currentIndex ? 'bg-[#60A5FA]' : 'bg-white/8'}`} />
                <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                  i < currentIndex
                    ? 'bg-[#60A5FA] text-black'
                    : i === currentIndex
                    ? 'bg-[#60A5FA]/20 border border-[#60A5FA]/50 text-[#60A5FA]'
                    : 'bg-white/8 text-gray-600'
                }`}>
                  {i < currentIndex ? '✓' : i + 1}
                </div>
                <div className={`flex-1 h-0.5 ${i < currentIndex ? 'bg-[#60A5FA]' : 'bg-white/8'}`} />
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* SCAN / ZERO STATE */}
          {(step === 'scan' || (step === 'select' && discovered.length === 0 && !scanning)) && (
            <div className="text-center py-4">
              <div className={`w-16 h-16 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center mx-auto mb-4 ${scanning ? 'animate-pulse' : ''}`}>
                <Search size={28} className="text-[#60A5FA]" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {scanning ? 'Scanning Network...' : 'Find Cameras Automatically'}
              </h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                {scanning
                  ? scanProgress
                  : 'Noxis automatically scans your WiFi/LAN network to detect Hikvision and Imou cameras. Make sure they are powered on.'}
              </p>

              {!scanning && (
                <div className="space-y-3">
                  <button
                    onClick={startScan}
                    className="w-full py-3 bg-[#60A5FA] text-black font-bold text-sm hover:bg-blue-400 transition-colors"
                  >
                    🔍 Scan Network for Cameras
                  </button>
                  <button
                    onClick={() => setStep('manual')}
                    className="w-full py-2.5 border border-white/10 text-gray-500 text-sm hover:border-white/20 transition-colors"
                  >
                    Enter IP manually instead
                  </button>
                </div>
              )}

              {scanning && (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                  <Loader size={12} className="animate-spin text-[#60A5FA]" />
                  {scanProgress || 'Scanning...'}
                </div>
              )}
            </div>
          )}

          {/* DEVICE SELECTION LIST */}
          {step === 'select' && discovered.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                Found {discovered.length} device{discovered.length > 1 ? 's' : ''}. Select to connect:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {discovered.map(device => (
                  <button
                    key={device.ip}
                    onClick={() => {
                      setSelected(device);
                      setStep('credentials');
                    }}
                    className={`w-full flex items-center gap-3 p-3 border rounded-sm text-left transition-colors ${
                      selected?.ip === device.ip
                        ? 'border-[#60A5FA]/50 bg-[#60A5FA]/8'
                        : 'border-white/8 hover:border-white/20'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Camera size={14} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {device.name || 'ONVIF Camera'}
                      </p>
                      <p className="text-[10px] text-gray-600 font-mono">
                        {device.ip}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-[#60A5FA] bg-[#60A5FA]/10 px-2 py-0.5 rounded flex-shrink-0">
                      {device.discoveryMethod === 'onvif' ? 'ONVIF' : 'TCP'}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('manual')}
                className="w-full mt-4 py-2 text-xs text-gray-600 hover:text-gray-400 text-center"
              >
                Not in the list? Enter IP manually
              </button>
            </div>
          )}

          {/* MANUAL IP CONFIG */}
          {step === 'manual' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Enter your camera's local IP address (e.g. 192.168.1.50)
              </p>
              <div>
                <label className={LABEL}>Camera IP Address</label>
                <input
                  value={manualIp}
                  onChange={e => setManualIp(e.target.value)}
                  placeholder="192.168.1.100"
                  className={INPUT}
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('scan')}
                  className="flex-1 py-2.5 text-sm border border-white/10 text-gray-500"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep('credentials')}
                  disabled={!manualIp.trim()}
                  className="flex-1 py-2.5 text-sm bg-[#60A5FA] text-black font-bold disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* PASSWORD & CREDENTIALS */}
          {step === 'credentials' && (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm text-xs text-red-400">
                  {error}
                </div>
              )}

              <div className="p-3 bg-[#0F1114] border border-white/8 rounded-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Target IP</p>
                  <p className="text-sm font-mono text-white mt-0.5">{selected?.ip || manualIp}</p>
                </div>
                <span className="text-[10px] text-[#60A5FA] font-bold">PORT 80</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={LABEL}>Username</label>
                  <input
                    value={credentials.username}
                    onChange={e => setCredentials(p => ({ ...p, username: e.target.value }))}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={e => setCredentials(p => ({ ...p, password: e.target.value }))}
                      placeholder="Camera login password"
                      className={INPUT}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 p-1"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(selected ? 'select' : 'manual')}
                  className="flex-1 py-2.5 text-sm border border-white/10 text-gray-500"
                >
                  ← Back
                </button>
                <button
                  onClick={detectCamera}
                  disabled={!credentials.password.trim()}
                  className="flex-1 py-2.5 text-sm bg-[#60A5FA] text-black font-bold disabled:opacity-50"
                >
                  Connect →
                </button>
              </div>
            </div>
          )}

          {/* DETECTING LOADER */}
          {step === 'detecting' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center mx-auto mb-4">
                <Loader size={28} className="text-[#60A5FA] animate-spin" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Connecting to Camera...</h3>
              <p className="text-xs text-gray-500">Querying capabilities & media stream configurations</p>
            </div>
          )}

          {/* CONFIGURE CAMERA */}
          {step === 'configure' && cameraDetails && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Connection Verified!</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 capitalize">
                      {cameraDetails.manufacturer} {cameraDetails.model} · {cameraDetails.resolutionMain || '1080p'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className={LABEL}>Camera Name</label>
                <input
                  value={cameraName}
                  onChange={e => setCameraName(e.target.value)}
                  placeholder="Factory Entrance"
                  className={INPUT}
                  autoFocus
                />
              </div>

              <div>
                <label className={LABEL}>Recording Settings</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRecordingMode('event')}
                    className={`p-3 text-left border rounded-sm transition-all ${
                      recordingMode === 'event'
                        ? 'border-[#60A5FA] bg-[#60A5FA]/5'
                        : 'border-white/8 hover:border-white/12'
                    }`}
                  >
                    <p className={`text-xs font-bold ${recordingMode === 'event' ? 'text-[#60A5FA]' : 'text-white'}`}>
                      ⚡ Smart Recording
                    </p>
                    <p className="text-[9px] text-gray-600 mt-1 leading-normal">
                      Only records motion and human alerts. Saves 95% disk space.
                    </p>
                  </button>

                  <button
                    onClick={() => setRecordingMode('continuous')}
                    className={`p-3 text-left border rounded-sm transition-all ${
                      recordingMode === 'continuous'
                        ? 'border-[#60A5FA] bg-[#60A5FA]/5'
                        : 'border-white/8 hover:border-white/12'
                    }`}
                  >
                    <p className={`text-xs font-bold ${recordingMode === 'continuous' ? 'text-[#60A5FA]' : 'text-white'}`}>
                      🔴 24/7 Continuous
                    </p>
                    <p className="text-[9px] text-gray-600 mt-1 leading-normal">
                      Records video 24/7. Requires high-capacity storage.
                    </p>
                  </button>
                </div>
              </div>

              {cameraDetails.supportsHumanDetection && (
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-sm">
                  <p className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wide">🧠 Local AI Analytics</p>
                  <p className="text-[9px] text-gray-500 mt-1">
                    Camera reports Human {cameraDetails.supportsVehicleDetection && '& Vehicle'} detection. Noxis will alert you instantly.
                  </p>
                </div>
              )}

              <button
                onClick={saveCamera}
                disabled={saving || !cameraName.trim()}
                className="w-full py-3 bg-[#60A5FA] text-black font-bold text-sm hover:bg-blue-400 transition-colors disabled:opacity-50 mt-2"
              >
                {saving ? 'Registering...' : '✓ Register Camera'}
              </button>
            </div>
          )}

          {/* SAVED DONE */}
          {step === 'done' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Camera Successfully Registered!</h3>
              <p className="text-xs text-gray-600">The live WebRTC feed will appear shortly.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
