'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { usePermissions } from '@/hooks/usePermissions'
import { useCurrentUserStore } from '@/hooks/useCurrentUser'
import { ROLE_LABELS, ROLE_DESCRIPTIONS, Role } from '@/lib/rbac/permissions'
import { UserPlus, Trash2, Shield, KeyRound, Eye, EyeOff, ArrowRightLeft, Check, Lock } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { UserSwitchModal } from '@/components/shell/UserSwitchModal'

export default function UsersPage() {
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const { isOwner, currentUser, role: activeRole } = usePermissions()
  const { setCurrentUser } = useCurrentUserStore()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [showAddUser, setShowAddUser] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({})

  const [newUser, setNewUser] = useState({
    name: '',
    loginId: '',
    role: 'viewer' as 'manager' | 'accountant' | 'supervisor' | 'viewer',
    pin: '1234',
  })

  const bizId = profile?.id || 'local_tenant'

  const { data: users = [], isLoading } =
    useQuery({
      queryKey: ['sub-users', bizId],
      queryFn: async () => {
        let localMembers: any[] = []
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem(`noxis_team_members_${bizId}`)
            if (cached) localMembers = JSON.parse(cached)
          } catch {}
        }

        if (profile?.id) {
          try {
            // Try sub_users table first
            const { data: subData, error: subErr } = await supabase
              .from('sub_users')
              .select('*')
              .eq('business_id', profile.id)
              .eq('is_active', true)
              .order('created_at')

            if (!subErr && subData && subData.length > 0) {
              const merged = [...subData]
              for (const lm of localMembers) {
                if (!merged.some(m => m.id === lm.id || m.login_id === lm.login_id || m.email === lm.email)) {
                  merged.push(lm)
                }
              }
              const normalized = merged.map(m => ({
                ...m,
                login_id: m.login_id || m.username || m.email?.split('@')[0] || m.name.toLowerCase().replace(/\s+/g, ''),
                pin: m.pin || '1234',
              }))
              if (typeof window !== 'undefined') {
                try { localStorage.setItem(`noxis_team_members_${bizId}`, JSON.stringify(normalized)) } catch {}
              }
              return normalized
            }

            // Fallback to staff_users table
            const { data: staffData } = await supabase
              .from('staff_users')
              .select('*')
              .eq('business_id', profile.id)
              .eq('is_active', true)
              .order('created_at')

            if (staffData && staffData.length > 0) {
              const merged = [...staffData]
              for (const lm of localMembers) {
                if (!merged.some(m => m.id === lm.id || m.login_id === lm.login_id || m.email === lm.email)) {
                  merged.push(lm)
                }
              }
              const normalized = merged.map(m => ({
                ...m,
                login_id: m.login_id || m.username || m.email?.split('@')[0] || m.name.toLowerCase().replace(/\s+/g, ''),
                pin: m.pin || '1234',
              }))
              if (typeof window !== 'undefined') {
                try { localStorage.setItem(`noxis_team_members_${bizId}`, JSON.stringify(normalized)) } catch {}
              }
              return normalized
            }
          } catch (err) {
            console.warn('[Users] Cloud query failed, using local:', err)
          }
        }

        const normalized = localMembers.map(m => ({
          ...m,
          login_id: m.login_id || m.username || m.email?.split('@')[0] || m.name.toLowerCase().replace(/\s+/g, ''),
          pin: m.pin || '1234',
        }))
        return normalized
      },
      staleTime: 1000 * 60,
    })

  const addUser = useMutation({
    mutationFn: async () => {
      const cleanName = newUser.name.trim()
      const cleanLoginId = (newUser.loginId.trim() || cleanName.toLowerCase().replace(/\s+/g, ''))
      const cleanPin = newUser.pin.trim() || '1234'

      if (!cleanName) {
        throw new Error('Name is required')
      }
      if (!cleanLoginId) {
        throw new Error('Staff ID / Username is required')
      }

      const newMember = {
        id: `staff_${Date.now()}`,
        business_id: bizId,
        name: cleanName,
        login_id: cleanLoginId.toLowerCase(),
        email: `${cleanLoginId.toLowerCase()}@local`,
        role: newUser.role,
        pin: cleanPin,
        is_active: true,
        created_at: new Date().toISOString(),
      }

      // 1. Instant local persistence
      if (typeof window !== 'undefined') {
        try {
          const cached = JSON.parse(localStorage.getItem(`noxis_team_members_${bizId}`) || '[]')
          const updated = [...cached, newMember]
          localStorage.setItem(`noxis_team_members_${bizId}`, JSON.stringify(updated))
        } catch {}
      }

      // 2. Optimistic UI update
      queryClient.setQueryData(['sub-users', bizId], (old: any) => {
        const arr = Array.isArray(old) ? old : []
        return [...arr, newMember]
      })

      // 3. Cloud / API attempt in background
      if (profile?.id) {
        try {
          fetch('/api/staff/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: profile.id,
              name: newMember.name,
              email: newMember.email,
              role: newMember.role,
              login_id: newMember.login_id,
            }),
          }).catch(() => null)

          await supabase.from('staff_users').insert({
            business_id: profile.id,
            name: newMember.name,
            email: newMember.email,
            role: newMember.role,
            is_active: true,
          })
        } catch (err) {
          console.warn('[Users] Cloud sync deferred:', err)
        }
      }

      return newMember
    },
    onSuccess: (added) => {
      setShowAddUser(false)
      setNewUser({
        name: '',
        loginId: '',
        role: 'viewer',
        pin: '1234',
      })
      toast.success('Team Member Added', `Staff ID: @${added.login_id} (PIN: ${added.pin})`)
    },
    onError: (err: any) => {
      toast.error('Failed', err.message || 'Could not add team member')
    },
  })

  const removeUser = useMutation({
    mutationFn: async (userId: string) => {
      // 1. Instant local update
      if (typeof window !== 'undefined') {
        try {
          const cached = JSON.parse(localStorage.getItem(`noxis_team_members_${bizId}`) || '[]')
          const updated = cached.filter((u: any) => u.id !== userId)
          localStorage.setItem(`noxis_team_members_${bizId}`, JSON.stringify(updated))
        } catch {}
      }

      // 2. Optimistic UI update
      queryClient.setQueryData(['sub-users', bizId], (old: any) => {
        if (!Array.isArray(old)) return []
        return old.filter((u: any) => u.id !== userId)
      })

      // 3. Cloud update
      if (profile?.id) {
        try {
          fetch('/api/staff/invite', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, businessId: profile.id }),
          }).catch(() => null)

          await supabase
            .from('sub_users')
            .update({ is_active: false })
            .eq('id', userId)
            .eq('business_id', profile.id)

          await supabase
            .from('staff_users')
            .update({ is_active: false })
            .eq('id', userId)
            .eq('business_id', profile.id)
        } catch {}
      }
    },
    onSuccess: () => {
      toast.success('Removed', 'Team member removed successfully')
    },
  })

  // Quick switch into member profile
  const handleDirectSwitch = (user: any) => {
    setCurrentUser({
      id: user.id,
      name: user.name,
      username: user.login_id,
      email: user.email || `${user.login_id}@local`,
      role: user.role,
      businessId: bizId,
    })
    toast.success('Role Activated', `Switched into ${user.name} (${ROLE_LABELS[user.role as Role] || user.role})`)
  }

  const INPUT = `w-full bg-[#161A1F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40 font-mono`
  const LABEL = `text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5`

  if (!isOwner) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="p-8 bg-[#0F1114] border border-white/8 rounded-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Lock size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Restricted Access: {ROLE_LABELS[activeRole as Role] || activeRole}
            </h2>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Operating as <strong>{currentUser?.name}</strong>. Only the account owner can manage team members and permissions.
            </p>
          </div>
          <button
            onClick={() => setShowPinModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded transition-colors cursor-pointer"
          >
            Switch Back to Owner 👑
          </button>
        </div>
        <UserSwitchModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight uppercase italic">
              Staff & Role Accounts
            </h1>
            <span className="text-[10px] font-mono bg-blue-500/15 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded">
              PIN & ID Based
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Create role-based operators with unique Staff IDs and Passcodes. No external email needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPinModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-mono font-semibold transition-colors rounded-sm cursor-pointer"
          >
            <ArrowRightLeft size={13} />
            Switch User
          </button>
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#60A5FA] text-black text-xs font-bold hover:bg-blue-400 transition-colors rounded-sm cursor-pointer"
          >
            <UserPlus size={14} />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {Object.entries(ROLE_LABELS)
          .filter(([role]) => role !== 'owner')
          .map(([role, label]) => (
          <div key={role} className="p-3 bg-[#0F1114] border border-white/6 rounded-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-white">{label}</p>
              <span className="text-[9px] font-mono uppercase text-gray-500">ID + PIN</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]}
            </p>
          </div>
        ))}
      </div>

      {/* Users list */}
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-white/4 rounded-sm" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center bg-[#0F1114] border border-white/8 rounded-sm">
          <p className="text-sm text-gray-400 font-semibold">
            No team members added yet.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Add team members with their Staff ID and Passcode to let them use Noxis Hub in restricted mode.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {users.map((user: any) => {
            const isRevealed = revealedPins[user.id] || false
            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-[#0F1114] border border-white/8 hover:border-white/15 transition-colors rounded-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center text-sm font-bold text-white uppercase">
                    {user.name ? user.name[0] : 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {user.name}
                      </p>
                      <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                        @{user.login_id || user.name.toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 font-mono">
                      <span className="flex items-center gap-1">
                        PIN: <strong className="text-white">{isRevealed ? user.pin || '1234' : '••••'}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedPins(prev => ({ ...prev, [user.id]: !isRevealed }))
                        }
                        className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                        title={isRevealed ? 'Hide PIN' : 'Reveal PIN'}
                      >
                        {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#60A5FA] bg-[#60A5FA]/10 border border-[#60A5FA]/20 px-2.5 py-1 rounded-sm">
                    {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDirectSwitch(user)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-mono rounded-sm border border-white/10 transition-colors cursor-pointer"
                    title="Switch directly to this user to test their permissions"
                  >
                    <ArrowRightLeft size={12} />
                    <span>Switch Role</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Remove ${user.name} (@${user.login_id}) from your team?`)) {
                        removeUser.mutate(user.id)
                      }
                    }}
                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete member"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F1114] border border-white/10 rounded-sm p-6 shadow-2xl">
            <h2 className="text-base font-bold text-white mb-1 uppercase tracking-wide">
              Add Staff / Team Member
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Assign a unique Staff ID and Passcode for terminal login.
            </p>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>
                  Staff Full Name *
                </label>
                <input
                  value={newUser.name}
                  onChange={e => {
                    const name = e.target.value
                    setNewUser(p => ({
                      ...p,
                      name,
                      // Auto-suggest loginId if user hasn't typed one
                      loginId: p.loginId ? p.loginId : name.toLowerCase().replace(/\s+/g, ''),
                    }))
                  }}
                  placeholder="e.g. Bilal Khan"
                  className={INPUT}
                  autoFocus
                />
              </div>

              <div>
                <label className={LABEL}>
                  Staff Login ID / Username *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">@</span>
                  <input
                    value={newUser.loginId}
                    onChange={e => setNewUser(p => ({ ...p, loginId: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                    placeholder="bilall"
                    className={`${INPUT} pl-7`}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 font-mono">
                  Used by the operator to sign in or switch profile.
                </p>
              </div>

              <div>
                <label className={LABEL}>
                  Passcode / PIN (4 Digits) *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={newUser.pin}
                  onChange={e => setNewUser(p => ({ ...p, pin: e.target.value }))}
                  placeholder="1234"
                  className={INPUT}
                />
                <p className="text-[10px] text-gray-500 mt-1 font-mono">
                  Secret PIN entered on switch (e.g. 1234, 5678).
                </p>
              </div>

              <div>
                <label className={LABEL}>
                  Assigned Role *
                </label>
                <div className="space-y-2">
                  {(['viewer', 'supervisor', 'manager', 'accountant'] as const)
                    .map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setNewUser(p => ({ ...p, role }))}
                      className={`w-full text-left p-3 rounded-sm border transition-colors cursor-pointer ${
                        newUser.role === role ? 'border-[#60A5FA]/40 bg-[#60A5FA]/8' : 'border-white/8 hover:border-white/16'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-xs font-bold ${newUser.role === role ? 'text-[#60A5FA]' : 'text-white'}`}>
                          {ROLE_LABELS[role]}
                        </p>
                        {newUser.role === role && (
                          <span className="text-[10px] font-mono text-[#60A5FA]">✓ SELECTED</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        {ROLE_DESCRIPTIONS[role]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="flex-1 py-2.5 text-xs font-mono border border-white/10 text-gray-400 hover:border-white/20 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => addUser.mutate()}
                disabled={addUser.isPending || !newUser.name.trim()}
                className="flex-1 py-2.5 text-xs font-mono font-bold bg-[#60A5FA] text-black hover:bg-blue-400 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {addUser.isPending ? 'Saving...' : 'Create Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch User Modal */}
      <UserSwitchModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} />
    </div>
  )
}
