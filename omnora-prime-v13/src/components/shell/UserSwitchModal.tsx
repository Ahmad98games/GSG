'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Shield, ShieldCheck, KeyRound, Lock, Unlock, 
  UserCheck, ArrowRight, Eye, EyeOff, User, Check, AlertCircle
} from 'lucide-react'
import { useCurrentUserStore } from '@/hooks/useCurrentUser'
import { usePermissions } from '@/hooks/usePermissions'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useToast } from '@/hooks/useToast'
import { ROLE_LABELS, Role } from '@/lib/rbac/permissions'
import { useRouter, usePathname } from 'next/navigation'

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'noxis-salt-2026')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

interface UserSwitchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserSwitchModal({ isOpen, onClose }: UserSwitchModalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()
  const { profile } = useBusinessProfile()
  const { currentUser, setCurrentUser } = useCurrentUserStore()
  const { isOwner, role: activeRole } = usePermissions()

  const bizId = profile?.id || 'local_tenant'

  const [members, setMembers] = useState<any[]>([])
  const [selectedTarget, setSelectedTarget] = useState<any | 'owner' | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Direct Staff ID & Password tab
  const [activeTab, setActiveTab] = useState<'members' | 'direct'>('members')
  const [directId, setDirectId] = useState('')
  const [directPassword, setDirectPassword] = useState('')

  // Load team members from local storage & cache
  useEffect(() => {
    if (!isOpen) {
      setPinInput('')
      setErrorMsg('')
      setSelectedTarget(null)
      setDirectId('')
      setDirectPassword('')
      return
    }

    try {
      const raw = localStorage.getItem(`noxis_team_members_${bizId}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        const normalized = (Array.isArray(parsed) ? parsed : []).map((m: any) => ({
          ...m,
          login_id: m.login_id || m.username || m.email?.split('@')[0] || m.name.toLowerCase().replace(/\s+/g, ''),
          pin: m.pin || '1234',
        }))
        setMembers(normalized)
      } else {
        setMembers([])
      }
    } catch {
      setMembers([])
    }
  }, [isOpen, bizId])

  // Verify PIN and perform role switch
  const handleSwitchToMember = async (targetMember: any, providedPin: string) => {
    setErrorMsg('')
    setIsVerifying(true)

    try {
      const memberPin = String(targetMember.pin || '1234').trim()
      const entered = String(providedPin).trim()

      if (memberPin && entered !== memberPin) {
        setErrorMsg('Invalid Passcode / PIN for this user.')
        setIsVerifying(false)
        return
      }

      // Successful switch
      const newUser = {
        id: targetMember.id,
        name: targetMember.name,
        username: targetMember.login_id,
        email: targetMember.email || `${targetMember.login_id}@local`,
        role: targetMember.role,
        businessId: bizId,
      }

      setCurrentUser(newUser)
      toast.success(
        'Operator Switched',
        `Active Role: ${targetMember.name} (${ROLE_LABELS[targetMember.role as Role] || targetMember.role})`
      )

      // If switched to restricted role while on /settings, redirect to /dashboard
      if (pathname.startsWith('/settings')) {
        router.replace('/dashboard')
      }

      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch user')
    } finally {
      setIsVerifying(false)
    }
  }

  // Switch back to Owner
  const handleSwitchToOwner = async (providedPin: string) => {
    setErrorMsg('')
    setIsVerifying(true)

    try {
      const api = (window as any).electronAPI
      let storedHash = ''
      if (api?.store?.getPinHash) {
        storedHash = await api.store.getPinHash()
      } else {
        storedHash = localStorage.getItem('noxis_pin_hash') || ''
      }

      // If a Master PIN hash is configured, verify it
      if (storedHash) {
        const enteredHash = await hashPin(providedPin)
        if (enteredHash !== storedHash) {
          setErrorMsg('Incorrect Master PIN.')
          setIsVerifying(false)
          return
        }
      }

      // Revert to Owner (null = owner default)
      setCurrentUser(null)
      toast.success('Owner Restored', 'Switched back to Owner (Unrestricted All-Access)')
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to restore owner')
    } finally {
      setIsVerifying(false)
    }
  }

  // Direct login by Staff ID and Passcode
  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const cleanId = directId.trim().toLowerCase()
    const cleanPass = directPassword.trim()

    if (!cleanId) {
      setErrorMsg('Please enter Staff ID or Username.')
      return
    }

    // Check if logging in as owner
    if (cleanId === 'owner' || cleanId === 'admin') {
      handleSwitchToOwner(cleanPass)
      return
    }

    const matched = members.find(
      m =>
        String(m.login_id || '').toLowerCase() === cleanId ||
        String(m.name || '').toLowerCase() === cleanId ||
        String(m.email || '').toLowerCase() === cleanId
    )

    if (!matched) {
      setErrorMsg(`No staff member found with ID "${directId}".`)
      return
    }

    handleSwitchToMember(matched, cleanPass)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-lg bg-[#0F1319] border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <KeyRound size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Switch User / Operator Profile
              </h2>
              <p className="text-[11px] text-gray-400">
                Current: <strong className={isOwner ? "text-blue-400" : "text-amber-400"}>
                  {isOwner ? '👑 Owner (All Access)' : `🛡️ ${currentUser?.name} (${ROLE_LABELS[activeRole as Role] || activeRole})`}
                </strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 bg-black/20 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setActiveTab('members')
              setSelectedTarget(null)
              setErrorMsg('')
            }}
            className={`flex-1 py-2.5 px-4 text-center transition-colors cursor-pointer font-semibold ${
              activeTab === 'members'
                ? 'text-blue-400 border-b-2 border-blue-500 bg-white/[0.03]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Staff Directory ({members.length + 1})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('direct')
              setSelectedTarget(null)
              setErrorMsg('')
            }}
            className={`flex-1 py-2.5 px-4 text-center transition-colors cursor-pointer font-semibold ${
              activeTab === 'direct'
                ? 'text-blue-400 border-b-2 border-blue-500 bg-white/[0.03]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Enter Staff ID & Passcode
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[65vh]">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle size={15} className="flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'members' ? (
            <div className="space-y-4">
              {/* If user clicked a member and needs to enter PIN */}
              {selectedTarget ? (
                <div className="p-4 bg-white/[0.03] border border-blue-500/30 rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">
                        Enter Passcode for {selectedTarget === 'owner' ? 'Owner' : selectedTarget.name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {selectedTarget === 'owner'
                          ? 'Enter your Master PIN'
                          : `Role: ${ROLE_LABELS[selectedTarget.role as Role] || selectedTarget.role} (Default PIN: 1234)`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTarget(null)
                        setPinInput('')
                        setErrorMsg('')
                      }}
                      className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
                    >
                      Back
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pinInput}
                      onChange={e => setPinInput(e.target.value)}
                      placeholder={selectedTarget === 'owner' ? 'Master PIN' : 'Staff Passcode / PIN'}
                      className="w-full bg-[#141820] border border-white/10 rounded px-3 py-2 text-sm text-white font-mono outline-none focus:border-blue-400"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (selectedTarget === 'owner') {
                            handleSwitchToOwner(pinInput)
                          } else {
                            handleSwitchToMember(selectedTarget, pinInput)
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedTarget === 'owner') {
                          handleSwitchToOwner(pinInput)
                        } else {
                          handleSwitchToMember(selectedTarget, pinInput)
                        }
                      }}
                      disabled={isVerifying}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold font-mono transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isVerifying ? 'Verifying...' : 'Confirm & Switch'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                    Select Profile to Activate:
                  </p>

                  {/* Owner Profile Option */}
                  <div
                    onClick={() => {
                      if (isOwner) return
                      setSelectedTarget('owner')
                      setPinInput('')
                      setErrorMsg('')
                    }}
                    className={`flex items-center justify-between p-3 rounded-md border transition-all ${
                      isOwner
                        ? 'bg-blue-500/10 border-blue-500/30 cursor-default'
                        : 'bg-white/[0.02] border-white/10 hover:border-blue-400/50 hover:bg-white/[0.05] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        👑
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">Owner / Administrator</p>
                          {isOwner && (
                            <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">Full system access & financial controls</p>
                      </div>
                    </div>
                    {!isOwner && (
                      <span className="text-xs font-mono text-blue-400 hover:underline">
                        Switch ➔
                      </span>
                    )}
                  </div>

                  {/* Registered Staff Members */}
                  {members.map(member => {
                    const isCurrent = currentUser?.id === member.id
                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          if (isCurrent) return
                          setSelectedTarget(member)
                          setPinInput('')
                          setErrorMsg('')
                        }}
                        className={`flex items-center justify-between p-3 rounded-md border transition-all ${
                          isCurrent
                            ? 'bg-amber-500/10 border-amber-500/30 cursor-default'
                            : 'bg-white/[0.02] border-white/10 hover:border-amber-400/50 hover:bg-white/[0.05] cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs uppercase">
                            {member.name ? member.name[0] : 'S'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-white">{member.name}</p>
                              <span className="text-[10px] font-mono text-gray-400">
                                @{member.login_id}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                                {ROLE_LABELS[member.role as Role] || member.role}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!isCurrent && (
                          <span className="text-xs font-mono text-amber-400 hover:underline">
                            Switch ➔
                          </span>
                        )}
                      </div>
                    )
                  })}

                  {members.length === 0 && (
                    <div className="p-4 text-center border border-dashed border-white/10 rounded-md">
                      <p className="text-xs text-gray-400">No staff members created yet.</p>
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          router.push('/settings/users')
                        }}
                        className="mt-2 text-xs text-blue-400 hover:underline cursor-pointer"
                      >
                        + Add Team Member in Settings
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Direct Login Form */
            <form onSubmit={handleDirectLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                  Staff ID / Username / Name
                </label>
                <input
                  type="text"
                  value={directId}
                  onChange={e => setDirectId(e.target.value)}
                  placeholder="e.g. bilall or manager"
                  className="w-full bg-[#141820] border border-white/10 rounded px-3 py-2 text-sm text-white font-mono outline-none focus:border-blue-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                  Passcode / PIN
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={directPassword}
                    onChange={e => setDirectPassword(e.target.value)}
                    placeholder="Enter 4-digit PIN or password"
                    className="w-full bg-[#141820] border border-white/10 rounded px-3 py-2 text-sm text-white font-mono outline-none focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                  >
                    {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 font-mono">
                  Default passcode for new staff is 1234
                </p>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold font-mono transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                {isVerifying ? 'Authenticating...' : 'Sign In as Operator'}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/30 flex items-center justify-between text-xs text-gray-400">
          <span>Active Session: {isOwner ? '👑 Owner' : `🛡️ ${currentUser?.name}`}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded font-mono transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

