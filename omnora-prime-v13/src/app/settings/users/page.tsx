'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { usePermissions } from '@/hooks/usePermissions'
import { Can } from '@/components/rbac/Can'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/rbac/permissions'
import { UserPlus, Trash2, Shield } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

export default function UsersPage() {
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const { isOwner } = usePermissions()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'supervisor' as 'manager' | 'accountant' | 'supervisor' | 'viewer',
    pin: '',
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
                if (!merged.some(m => m.id === lm.id || m.email === lm.email)) {
                  merged.push(lm)
                }
              }
              if (typeof window !== 'undefined') {
                try { localStorage.setItem(`noxis_team_members_${bizId}`, JSON.stringify(merged)) } catch {}
              }
              return merged
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
                if (!merged.some(m => m.id === lm.id || m.email === lm.email)) {
                  merged.push(lm)
                }
              }
              if (typeof window !== 'undefined') {
                try { localStorage.setItem(`noxis_team_members_${bizId}`, JSON.stringify(merged)) } catch {}
              }
              return merged
            }
          } catch (err) {
            console.warn('[Users] Cloud query failed, using local:', err)
          }
        }

        return localMembers
      },
      staleTime: 1000 * 60,
    })

  const addUser = useMutation({
    mutationFn: async () => {
      if (!newUser.name.trim() || !newUser.email.trim()) {
        throw new Error('Name and email are required')
      }

      const newMember = {
        id: `staff_${Date.now()}`,
        business_id: bizId,
        name: newUser.name.trim(),
        email: newUser.email.trim().toLowerCase(),
        role: newUser.role,
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
    onSuccess: () => {
      setShowAddUser(false)
      setNewUser({
        name: '',
        email: '',
        role: 'supervisor',
        pin: '',
      })
      toast.success('Success', 'Team member added successfully')
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

  const INPUT = `w-full bg-[#161A1F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40`
  const LABEL = `text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5`

  if (!isOwner) {
    return (
      <div className="p-6 max-w-lg">
        <div className="p-6 bg-[#0F1114] border border-white/8 rounded-sm text-center">
          <Shield size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Only the account owner can manage team members.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight uppercase italic">
            Team Members
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Control who can access Noxis Hub and what they can see.
          </p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#60A5FA] text-black text-sm font-bold hover:bg-blue-400 transition-colors rounded-sm"
        >
          <UserPlus size={14} />
          Add Member
        </button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {Object.entries(ROLE_LABELS)
          .filter(([role]) => role !== 'owner')
          .map(([role, label]) => (
          <div key={role} className="p-3 bg-[#0F1114] border border-white/6 rounded-sm">
            <p className="text-xs font-bold text-white mb-1">{label}</p>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              {ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]}
            </p>
          </div>
        ))}
      </div>

      {/* Users list */}
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[1,2].map(i => (
            <div key={i} className="h-16 bg-white/4 rounded-sm" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center bg-[#0F1114] border border-white/8 rounded-sm">
          <p className="text-sm text-gray-500">
            No team members yet.
          </p>
          <p className="text-xs text-gray-700 mt-1">
            Add team members to let staff access Noxis with limited permissions.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-[#0F1114] border border-white/8 rounded-sm">
              <div>
                <p className="text-sm font-semibold text-white">
                  {user.name}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {user.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#60A5FA] bg-[#60A5FA]/10 px-2 py-1 rounded-sm">
                  {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                </span>
                <button
                  onClick={() => {
                    if (confirm(`Remove ${user.name} from your team?`)) {
                      removeUser.mutate(user.id)
                    }
                  }}
                  className="text-gray-700 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add user modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F1114] border border-white/10 rounded-sm p-6">
            <h2 className="text-base font-bold text-white mb-5">
              Add Team Member
            </h2>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>
                  Full Name *
                </label>
                <input
                  value={newUser.name}
                  onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                  placeholder="Muhammad Ali"
                  className={INPUT}
                  autoFocus
                />
              </div>

              <div>
                <label className={LABEL}>
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                  placeholder="ali@factory.com"
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL}>
                  Role *
                </label>
                <div className="space-y-2">
                  {(['manager', 'accountant', 'supervisor', 'viewer'] as const)
                    .map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setNewUser(p => ({ ...p, role }))}
                      className={`w-full text-left p-3 rounded-sm border transition-colors ${newUser.role === role ? 'border-[#60A5FA]/40 bg-[#60A5FA]/8' : 'border-white/8 hover:border-white/16'}`}
                    >
                      <p className={`text-xs font-bold mb-0.5 ${newUser.role === role ? 'text-[#60A5FA]' : 'text-white'}`}>
                        {ROLE_LABELS[role]}
                      </p>
                      <p className="text-[10px] text-gray-600 leading-relaxed">
                        {ROLE_DESCRIPTIONS[role]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowAddUser(false)}
                className="flex-1 py-2.5 text-sm border border-white/10 text-gray-500 hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={() => addUser.mutate()}
                disabled={addUser.isPending || !newUser.name.trim() || !newUser.email.trim()}
                className="flex-1 py-2.5 text-sm font-bold bg-[#60A5FA] text-black hover:bg-blue-400 disabled:opacity-50"
              >
                {addUser.isPending ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
