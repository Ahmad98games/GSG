'use client'

import {
  useState, useEffect, useCallback,
  useRef,
} from 'react'
import {
  Send, Smartphone, Users, Wifi,
  WifiOff, Edit2, Check, Crown,
  MessageCircle, AlertTriangle,
  Bell, BellOff, Clock,
} from 'lucide-react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load connected devices
  useEffect(() => {
    if (!profile?.id) return

    const loadDevices = async () => {
      const data = await (window as any).electronAPI?.getBridgeStatus?.();
      if (data?.pairedDevices) {
        setDevices(data.pairedDevices.map((d: any) => ({
          id: d.deviceId || String(Math.random()),
          device_id: d.deviceId || '',
          device_label: d.deviceLabel || 'Mobile Device',
          device_role: 'general',
          last_seen: d.lastHeartbeat || new Date().toISOString(),
          is_online: true,
          unread_count: 0,
        })))
      }
    }

    loadDevices()
    const interval = setInterval(loadDevices, 10000)
    return () => clearInterval(interval)
  }, [profile?.id])

  // Load message history
  useEffect(() => {
    if (!profile?.id) return

    const load = async () => {
      const data = await (window as any).electronAPI?.messaging?.getHistory({
        businessId: profile.id,
        limit: 100,
      })
      setMessages(data || [])
    }

    load()
  }, [profile?.id])

  // Listen for new incoming messages
  useEffect(() => {
    if (!(window as any).electronAPI?.messaging) return

    (window as any).electronAPI.messaging.onNewMessage((msg: Message) => {
      setMessages(prev => [msg, ...prev])
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    })

    return () => {
      (window as any).electronAPI.messaging.removeMessageListener()
    }
  }, [])

  const sendMessage = useCallback(async () => {
    if (!messageText.trim() || !profile?.id) return

    setSending(true)
    try {
      await (window as any).electronAPI?.messaging?.send({
        businessId: profile.id,
        text: messageText.trim(),
        recipientType: selectedRecipient === 'all' ? 'all' : 'device',
        recipientDeviceId: selectedRecipient !== 'all' ? selectedRecipient : null,
        priority,
      })

      setMessageText('')
      setPriority('normal')
    } finally {
      setSending(false)
    }
  }, [messageText, selectedRecipient, priority, profile?.id])

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
        <div className="p-4 border-b border-white/6">
          <h2 className="text-sm font-bold text-white mb-1">Messaging</h2>
          <p className="text-[10px] text-gray-400">
            {onlineDevices.length} online · {devices.length} paired
          </p>
        </div>

        {/* Recipient selector */}
        <div className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
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
              Online
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
            />
          ))}

          {/* Offline devices */}
          {offlineDevices.length > 0 && (
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 px-2 pt-3 pb-1">
              Offline
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

      {/* Edit button */}
      <button
        onClick={e => {
          e.stopPropagation()
          onEditStart()
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-gray-300 cursor-pointer"
      >
        <Edit2 size={11} />
      </button>
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