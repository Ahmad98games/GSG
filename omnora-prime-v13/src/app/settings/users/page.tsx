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

  const { data: users = [], isLoading } =
    useQuery({
      queryKey: ['sub-users', profile?.id],
      queryFn: async () => {
        const { data } = await supabase
          .from('sub_users')
          .select('*')
          .eq('business_id', profile!.id)
          .eq('is_active', true)
          .order('created_at')
        return data || []
      },
      enabled: !!profile?.id && isOwner,
    })

  const addUser = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('sub_users')
        .insert({
          business_id: profile!.id,
          name: newUser.name.trim(),
          email: newUser.email.trim().toLowerCase(),
          role: newUser.role,
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sub-users', profile?.id]
      })
      setShowAddUser(false)
      setNewUser({
        name: '', email: '',
        role: 'supervisor', pin: '',
      })
      toast.success('Success', 'Team member added successfully')
    },
    onError: (err: any) => {
      toast.error(
        'Failed',
        err.message.includes('duplicate')
          ? 'This email is already a team member'
          : 'Could not add team member'
      )
    },
  })

  const removeUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('sub_users')
        .update({ is_active: false })
        .eq('id', userId)
        .eq('business_id', profile!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sub-users', profile?.id]
      })
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
