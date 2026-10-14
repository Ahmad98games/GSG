'use client'

import {
  useState, useEffect, useCallback,
  useRef,
} from 'react'
import {
  Send, Smartphone, Users, Wifi,
  WifiOff, Edit2, Check, Crown,
  MessageCircle, AlertTriangle,
  Bell, BellOff, Clock, Trash2,
  QrCode, X, RefreshCw, ExternalLink,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useLicense } from '@/hooks/useLicense'
import { UpgradeGate } from '@/components/license/UpgradeGate'

interface Device {
  id: string
  device_id: string
  device_label: string
  device_role: string
  last_seen: string
  is_online: boolean
  unread_count: number
}

interface Message {
  id: string
  sender_type: 'hub' | 'device'
  sender_device_id: string | null
  sender_name: string
  recipient_type: string
  recipient_device_id: string | null
  message_text: string
  message_type: string
  priority: 'normal' | 'urgent'
  read_by: string[]
  created_at: string
}

const DEVICE_ROLES = [
  { value: 'general',    label: 'General' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'cashier',    label: 'Cashier' },
  { value: 'security',   label: 'Security Guard' },
  { value: 'driver',     label: 'Driver' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'manager',    label: 'Manager' },
]

export default function MessagingPage() {
  const { profile } = useBusinessProfile()
  const { tier, can } = useLicense()

  const [devices, setDevices] = useState<Device[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<'all' | string>('all')
  const [messageText, setMessageText] = useState('')
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal')
  const [sending, setSending] = useState(false)
  const [editingDevice, setEditingDevice] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editRole, setEditRole] = useState('')
  const [showPairModal, setShowPairModal] = useState(false)
  const [hubInfo, setHubInfo] = useState<any>(null)
  const [pairingQrUrl, setPairingQrUrl] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Revoke / delete device
  const revokeDevice = useCallback(async (deviceId: string) => {
    if (!window.confirm('Unpair and remove this device?')) return;
    try {
      await fetch('/api/hub/devices/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, nodeId: deviceId }),
      });
      setDevices(prev => prev.filter(d => d.device_id !== deviceId && d.id !== deviceId));
      if (selectedRecipient === deviceId) {
        setSelectedRecipient('all');
      }
    } catch (e: any) {
      console.warn('Revoke device failed:', e);
    }
  }, [selectedRecipient]);

  // Load connected devices
  const loadDevices = useCallback(async () => {
    let liveList: any[] = [];
    try {
      const data = await (window as any).electronAPI?.getBridgeStatus?.();
      if (data?.pairedDevices && Array.isArray(data.pairedDevices) && data.pairedDevices.length > 0) {
        liveList = data.pairedDevices;
      }
    } catch {}

    let currentHubInfo: any = null;
    try {
      const res = await fetch('/api/hub/info');
      if (res.ok) {
        const json = await res.json();
        currentHubInfo = json;
        setHubInfo(json);
        if (Array.isArray(json.bridge?.pairedDevices) && liveList.length === 0) {
          liveList = json.bridge.pairedDevices;
        }
      }
    } catch {}

    // Also fetch persisted authorized devices to include registered devices
    let persistedList: any[] = [];
    try {
      const resDev = await fetch('/api/hub/devices');
      if (resDev.ok) {
        const devJson = await resDev.json();
        persistedList = Array.isArray(devJson) ? devJson : (devJson.devices || []);
      }
    } catch {}

    // Exclude revoked devices
    persistedList = persistedList.filter((d: any) => !d.isRevoked && d.is_revoked !== 1);

    const mappedDevices = [
      ...persistedList.map((d: any) => {
        const isLive = liveList.some((l: any) => l.deviceId === d.deviceId || l.deviceId === d.nodeId);
        return {
          id: d.deviceId || d.nodeId || String(Math.random()),
          device_id: d.deviceId || d.nodeId || '',
          device_label: d.deviceLabel || d.label || 'Mobile Device',
          device_role: d.device_role || 'general',
          last_seen: d.lastSeen || new Date().toISOString(),
          is_online: isLive,
          unread_count: 0,
        };
      }),
      ...liveList
        .filter((l: any) => !persistedList.some((p: any) => p.deviceId === l.deviceId || p.nodeId === l.deviceId))
        .map((l: any) => ({
          id: l.deviceId || String(Math.random()),
          device_id: l.deviceId || '',
          device_label: l.deviceLabel || 'Mobile Device',
          device_role: 'general',
          last_seen: l.lastHeartbeat || new Date().toISOString(),
          is_online: true,
          unread_count: 0,
        })),
    ];

    setDevices(mappedDevices);
  }, []);

  // Generate Smart QR Code when modal opens or hubInfo updates
  useEffect(() => {
    if (!hubInfo) return;
    const generateQR = async () => {
      try {
        const payload = JSON.stringify({
          v: 2,
          businessName: profile?.business_name || 'Noxis Hub',
          bridgeUrl: hubInfo.bridgeUrl,
          mobileUrl: hubInfo.mobileUrl,
          tunnelUrl: hubInfo.tunnelUrl,
          ts: Date.now(),
        });
        const url = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          color: {
            dark: '#10B981',
            light: '#00000000',
          },
        });
        setPairingQrUrl(url);
      } catch (e) {
        console.warn('QR generation error:', e);
      }
    };
    generateQR();
  }, [hubInfo, profile]);

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 3000);

    const electronAPI = (window as any).electronAPI;
    const handleBridgeEvent = (_: any, payload: any) => {
      if (payload?.event === 'DEVICE_COUNT_CHANGED' || payload?.event === 'DEVICE_CONNECTED') {
        loadDevices();
      }
    };

    if (electronAPI?.on) {
      electronAPI.on('bridge-event', handleBridgeEvent);
    }

    const handleWindowEvent = (e: any) => {
      if (e.detail?.type === 'DEVICE_COUNT_CHANGED' || e.detail?.type === 'DEVICE_CONNECTED') {
        loadDevices();
      }
    };
    window.addEventListener('noxis:mobile-event', handleWindowEvent);

    return () => {
      clearInterval(interval);
      if (electronAPI?.off) {
        electronAPI.off('bridge-event', handleBridgeEvent);
      }
      window.removeEventListener('noxis:mobile-event', handleWindowEvent);
    };
  }, [loadDevices]);

  // Load message history
  useEffect(() => {
    const load = async () => {
      let loaded: any[] = [];
      try {
        const data = await (window as any).electronAPI?.messaging?.getHistory({
          businessId: profile?.id || 'local',
          limit: 100,
        });
        if (Array.isArray(data) && data.length > 0) {
          loaded = data;
        }
      } catch {}

      if (loaded.length === 0) {
        try {
          const res = await fetch(`/api/hub/messaging?business_id=${profile?.id || 'local'}&limit=100`);
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json)) {
              loaded = json;
            }
          }
        } catch {}
      }

      setMessages(loaded);
    };

    load();
  }, [profile?.id]);

  // Listen for new incoming messages
  useEffect(() => {
    const electronAPI = (window as any).electronAPI;

    const handleNewMsg = (msg: Message) => {
      setMessages(prev => [msg, ...prev]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    if (electronAPI?.messaging?.onNewMessage) {
      electronAPI.messaging.onNewMessage(handleNewMsg);
    }

    // Also listen to general bridge-event
    const handleBridgeMsg = (_: any, payload: any) => {
      if (payload?.event === 'messaging:new-message' && payload?.data) {
        handleNewMsg(payload.data);
      }
    };
    if (electronAPI?.on) {
      electronAPI.on('bridge-event', handleBridgeMsg);
    }

    return () => {
      if (electronAPI?.messaging?.removeMessageListener) {
        electronAPI.messaging.removeMessageListener();
      }
      if (electronAPI?.off) {
        electronAPI.off('bridge-event', handleBridgeMsg);
      }
    };
  }, []);

  const sendMessage = useCallback(async () => {
    if (!messageText.trim()) return;

    setSending(true);
    const payload = {
      businessId: profile?.id || 'local',
      text: messageText.trim(),
      recipientType: selectedRecipient === 'all' ? 'all' : 'device',
      recipientDeviceId: selectedRecipient !== 'all' ? selectedRecipient : null,
      priority,
    };

    try {
      let sent = false;
      if ((window as any).electronAPI?.messaging?.send) {
        const res = await (window as any).electronAPI.messaging.send(payload);
        if (res && res.success) sent = true;
      }

      if (!sent) {
        await fetch('/api/hub/messaging', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setMessageText('');
      setPriority('normal');
    } finally {
      setSending(false);
    }
  }, [messageText, selectedRecipient, priority, profile?.id]);

  const saveDeviceLabel = useCallback(
    async (deviceId: string) => {
      if (!editLabel.trim()) return

      await (window as any).electronAPI?.messaging?.renameDevice({
        deviceId,
        newLabel: editLabel.trim(),
        deviceRole: editRole,
      })

      setDevices(prev => prev.map(d =>
        d.device_id === deviceId
          ? {
              ...d,
              device_label: editLabel.trim(),
              device_role: editRole,
            }
          : d
      ))
      setEditingDevice(null)
    },
    [editLabel, editRole]
  )

  // Filter messages for selected recipient
  const filteredMessages = messages.filter(msg => {
    if (selectedRecipient === 'all') return true
    return msg.recipient_device_id === selectedRecipient || msg.sender_device_id === selectedRecipient
  })

  const onlineDevices = devices.filter(d => d.is_online)
  const offlineDevices = devices.filter(d => !d.is_online)

  return (
    <div className="flex h-full overflow-hidden bg-[#030712] text-slate-200">
      {/* ── LEFT PANEL: Devices ── */}
      <div className="w-64 flex-shrink-0 border-r border-white/6 bg-[#0A0C0F] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/6 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white mb-0.5">Messaging</h2>
            <p className="text-[10px] text-gray-400">
              {onlineDevices.length} online · {devices.length} paired
            </p>
          </div>
          <button
            onClick={() => setShowPairModal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-[#60A5FA]/10 hover:bg-[#60A5FA]/20 border border-[#60A5FA]/30 text-[#60A5FA] rounded text-[10px] font-bold cursor-pointer transition-all"
            title="Scan QR Code with Mobile Phone"
          >
            <QrCode size={12} />
            <span>Pair</span>
          </button>
        </div>

        {/* Recipient selector */}
        <div className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          {/* Test device cleanup banner */}
          {devices.some(d => d.device_id === 'DEVICE_TEST_12345678') && (
            <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-300 flex items-center justify-between">
              <span>Old test device</span>
              <button
                onClick={() => revokeDevice('DEVICE_TEST_12345678')}
                className="underline hover:text-amber-100 font-bold cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* Broadcast to all */}
          <button
            onClick={() => setSelectedRecipient('all')}
            className={`w-full flex items-center gap-3 p-3 rounded-sm text-left transition-colors cursor-pointer ${
              selectedRecipient === 'all'
                ? 'bg-[#60A5FA]/10 border border-[#60A5FA]/20'
                : 'hover:bg-white/4'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#60A5FA]/15 flex items-center justify-center flex-shrink-0">
              <Users size={14} className="text-[#60A5FA]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">All Devices</p>
              <p className="text-[10px] text-gray-500">Broadcast to everyone</p>
            </div>
          </button>

          {/* Online devices */}
          {onlineDevices.length > 0 && (
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 px-2 pt-3 pb-1">
              Online ({onlineDevices.length})
            </p>
          )}

          {onlineDevices.map(device => (
            <DeviceRow
              key={device.device_id}
              device={device}
              isSelected={selectedRecipient === device.device_id}
              isEditing={editingDevice === device.device_id}
              editLabel={editLabel}
              editRole={editRole}
              onSelect={() => setSelectedRecipient(device.device_id)}
              onEditStart={() => {
                setEditingDevice(device.device_id)
                setEditLabel(device.device_label)
                setEditRole(device.device_role)
              }}
              onEditSave={() => saveDeviceLabel(device.device_id)}
              onEditCancel={() => setEditingDevice(null)}
              onLabelChange={setEditLabel}
              onRoleChange={setEditRole}
              onDelete={() => revokeDevice(device.device_id)}
            />
          ))}

          {/* Offline devices */}
          {offlineDevices.length > 0 && (
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 px-2 pt-3 pb-1">
              Offline ({offlineDevices.length})
            </p>
          )}

          {offlineDevices.map(device => (
            <DeviceRow
              key={device.device_id}
              device={device}
              isSelected={selectedRecipient === device.device_id}
              isEditing={editingDevice === device.device_id}
              editLabel={editLabel}
              editRole={editRole}
              onSelect={() => setSelectedRecipient(device.device_id)}
              onEditStart={() => {
                setEditingDevice(device.device_id)
                setEditLabel(device.device_label)
                setEditRole(device.device_role)
              }}
              onEditSave={() => saveDeviceLabel(device.device_id)}
              onEditCancel={() => setEditingDevice(null)}
              onLabelChange={setEditLabel}
              onRoleChange={setEditRole}
              onDelete={() => revokeDevice(device.device_id)}
            />
          ))}

          {devices.length === 0 && (
            <div className="text-center py-8">
              <Smartphone size={24} className="text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No devices paired yet</p>
              <p className="text-[10px] text-gray-600 mt-1">Go to Settings → Device Pairing</p>
            </div>
          )}
        </div>

        {/* Tier info at bottom */}
        <div className="p-3 border-t border-white/6">
          <p className="text-[9px] text-gray-500">
            {devices.length} of{' '}
            {tier === 'free' ? 1 : tier === 'lite' ? 5 : tier === 'pro' ? 15 : 50} devices paired
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Messages ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#060708]">
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-white/6 flex items-center gap-3 bg-[#0A0C0F]">
          {selectedRecipient === 'all' ? (
            <>
              <Users size={18} className="text-[#60A5FA]" />
              <div>
                <p className="text-sm font-bold text-white">All Devices</p>
                <p className="text-[10px] text-gray-400">{onlineDevices.length} online</p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Smartphone size={18} className="text-[#60A5FA]" />
                {devices.find(d => d.device_id === selectedRecipient)?.is_online ? (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] border border-[#060708]" />
                ) : (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-gray-700 border border-[#060708]" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {devices.find(d => d.device_id === selectedRecipient)?.device_label || 'Unknown Device'}
                </p>
                <p className="text-[10px] text-gray-400">
                  {devices.find(d => d.device_id === selectedRecipient)?.is_online
                    ? 'Online now'
                    : 'Offline — message will deliver when connected'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {filteredMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle size={32} className="text-gray-700 mb-3" />
              <p className="text-sm font-bold text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-600 mt-1">Send a message to your connected devices</p>
            </div>
          )}

          {[...filteredMessages].reverse().map(msg => (
            <MessageBubble key={msg.id} message={msg} isFromHub={msg.sender_type === 'hub'} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message composer */}
        <div className="p-4 border-t border-white/6 bg-[#0A0C0F]">
          {/* Priority toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setPriority(p => (p === 'normal' ? 'urgent' : 'normal'))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
                priority === 'urgent'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                  : 'bg-white/5 text-gray-400 border border-white/8 hover:border-white/15'
              }`}
            >
              {priority === 'urgent' ? (
                <>
                  <Bell size={11} /> Urgent
                </>
              ) : (
                <>
                  <BellOff size={11} /> Normal
                </>
              )}
            </button>

            <span className="text-[10px] text-gray-400">
              {selectedRecipient === 'all'
                ? `Broadcast to all ${devices.length} devices`
                : `Direct to ${
                    devices.find(d => d.device_id === selectedRecipient)?.device_label || 'device'
                  }`}
            </span>
          </div>

          {/* Input row */}
          <div className="flex gap-3">
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={
                selectedRecipient === 'all'
                  ? 'Broadcast a message to all devices...'
                  : 'Send a message...'
              }
              rows={2}
              className="flex-1 bg-[#161A1F] border border-white/8 text-white text-sm px-4 py-3 resize-none outline-none rounded-sm focus:border-[#60A5FA]/40 placeholder:text-gray-600"
            />
            <button
              onClick={sendMessage}
              disabled={!messageText.trim() || sending}
              className="px-5 bg-[#60A5FA] text-black font-bold rounded-sm hover:bg-blue-400 disabled:opacity-40 transition-colors flex items-center gap-2 flex-shrink-0 cursor-pointer"
            >
              <Send size={15} />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>

          <p className="text-[10px] text-gray-600 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* ── PAIRING QR MODAL ── */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-emerald-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl relative text-left">
            <button
              onClick={() => setShowPairModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded">
                <QrCode size={18} />
              </span>
              <h3 className="text-base font-bold text-white">Pair Mobile Device</h3>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Open the Noxis mobile app, go to <strong className="text-white">Settings → Pairing</strong>, and scan this code to connect your phone instantly.
            </p>

            <div className="p-4 bg-slate-950 border border-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
              {pairingQrUrl ? (
                <img
                  src={pairingQrUrl}
                  alt="Pairing QR Code"
                  className="w-48 h-48 filter brightness-110"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-500">
                  Generating QR Code...
                </div>
              )}
            </div>

            {hubInfo && (
              <div className="space-y-2 bg-slate-950/70 p-3 rounded border border-white/5 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>WiFi Bridge Host:</span>
                  <span className="font-mono text-emerald-400">{hubInfo.bridgeUrl || 'Port 7447'}</span>
                </div>
                {hubInfo.mobileUrl && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Direct Web Link:</span>
                    <span className="font-mono text-blue-400 select-all">{hubInfo.mobileUrl}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowPairModal(false)}
              className="w-full mt-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded transition-all cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SUB-COMPONENTS ──

function DeviceRow({
  device,
  isSelected,
  isEditing,
  editLabel,
  editRole,
  onSelect,
  onEditStart,
  onEditSave,
  onEditCancel,
  onLabelChange,
  onRoleChange,
  onDelete,
}: any) {
  if (isEditing) {
    return (
      <div className="p-3 border border-[#60A5FA]/25 rounded-sm bg-[#60A5FA]/5">
        <input
          value={editLabel}
          onChange={e => onLabelChange(e.target.value)}
          placeholder="Device name"
          autoFocus
          className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-2 py-1.5 rounded-sm outline-none focus:border-[#60A5FA]/40 mb-2"
          onKeyDown={e => {
            if (e.key === 'Enter') onEditSave()
            if (e.key === 'Escape') onEditCancel()
          }}
        />
        <select
          value={editRole}
          onChange={e => onRoleChange(e.target.value)}
          className="w-full bg-[#0F1114] border border-white/8 text-gray-400 text-xs px-2 py-1.5 rounded-sm outline-none mb-2"
        >
          {DEVICE_ROLES.map(r => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={onEditSave}
            className="flex-1 py-1 bg-[#60A5FA] text-black text-[10px] font-bold rounded-sm cursor-pointer"
          >
            Save
          </button>
          <button
            onClick={onEditCancel}
            className="flex-1 py-1 border border-white/8 text-gray-400 text-[10px] rounded-sm cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 rounded-sm text-left transition-colors group cursor-pointer ${
        isSelected
          ? 'bg-[#60A5FA]/10 border border-[#60A5FA]/20'
          : 'hover:bg-white/4'
      }`}
    >
      {/* Online indicator */}
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#161A1F] border border-white/8 flex items-center justify-center">
          <Smartphone
            size={14}
            className={device.is_online ? 'text-[#60A5FA]' : 'text-gray-600'}
          />
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A0C0F] ${
            device.is_online ? 'bg-[#10B981]' : 'bg-gray-700'
          }`}
        />
      </div>

      {/* Device info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{device.device_label}</p>
        <p className="text-[10px] text-gray-400 capitalize">
          {DEVICE_ROLES.find(r => r.value === device.device_role)?.label || device.device_role}
          {device.unread_count > 0 && (
            <span className="ml-1 bg-[#60A5FA] text-black text-[9px] font-bold px-1 rounded-sm">
              {device.unread_count}
            </span>
          )}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => {
            e.stopPropagation()
            onEditStart()
          }}
          title="Rename Device"
          className="p-1 text-gray-500 hover:text-gray-300 cursor-pointer"
        >
          <Edit2 size={11} />
        </button>
        <button
          onClick={e => {
            e.stopPropagation()
            onDelete?.()
          }}
          title="Unpair / Remove Device"
          className="p-1 text-gray-500 hover:text-red-400 cursor-pointer"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </button>
  )
}

function MessageBubble({
  message,
  isFromHub,
}: {
  message: Message
  isFromHub: boolean
}) {
  const isUrgent = message.priority === 'urgent'
  const time = new Date(message.created_at).toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex ${isFromHub ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs rounded-sm px-4 py-3 ${
          isFromHub
            ? isUrgent
              ? 'bg-red-500/15 border border-red-500/25'
              : 'bg-[#60A5FA]/15 border border-[#60A5FA]/20'
            : 'bg-[#161A1F] border border-white/8'
        }`}
      >
        {/* Sender label */}
        <p
          className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 ${
            isFromHub ? (isUrgent ? 'text-red-400' : 'text-[#60A5FA]') : 'text-gray-400'
          }`}
        >
          {isUrgent && '🚨 '}
          {message.sender_name}
          {!isFromHub && message.recipient_type === 'hub' ? ' → PC Hub' : ''}
        </p>

        {/* Message text */}
        <p className="text-sm text-white leading-relaxed">{message.message_text}</p>

        {/* Timestamp */}
        <p className="text-[9px] text-gray-400 mt-1.5 text-right">{time}</p>
      </div>
    </div>
  )
}