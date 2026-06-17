"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Shield, Mail, CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ROLE_LABELS, type StaffRole } from "@/lib/auth/permissions";
import { useTierStore } from "@/stores/tierStore";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { useToast } from "@/hooks/useToast";
import { humanizeError } from '@/lib/utils/errors';

export default function StaffUsersPage() {
  const router = useRouter();
  const { businessId } = usePersona();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("viewer");
  const { canAddStaff, limits } = useTierStore();
  const toast = useToast();

  const { data: staffList, isLoading } = useQuery({
    queryKey: ['staff_users', businessId],
    queryFn: async () => {
      const res = await fetch(`/api/staff/invite?businessId=${businessId}`);
      const data = await res.json();
      return data.staff || [];
    },
    enabled: !!businessId
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole, businessId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_users'] });
      setShowInvite(false);
      setInviteEmail(""); setInviteName(""); setInviteRole("viewer");
      toast.success('Invitation sent successfully');
    },
    onError: (err: any) => toast.error(humanizeError(err, 'send invitation')),
  });

  const roleInfo = (role: string) => ROLE_LABELS[role as StaffRole] || ROLE_LABELS.viewer;

  return (
    <div className="min-h-screen bg-black text-slate-200 p-6">
      <main className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.push('/settings')} className="text-gray-500 hover:text-white transition-colors"><ArrowLeft size={16} /></button>
            <div><h1 className="text-lg font-semibold tracking-tight text-white">Staff & Access Control</h1><p className="text-xs text-gray-500 mt-0.5">Manage team members and role-based permissions</p></div>
          </div>
          <FeatureGate feature="staffUsers">
            <button 
              onClick={() => {
                if (!canAddStaff(staffList?.length || 0)) {
                  toast.error("Limit Reached", `Your plan allows up to ${limits.maxStaffUsers} staff members.`);
                  return;
                }
                setShowInvite(true)
              }} 
              className="flex items-center space-x-2 px-4 py-2 bg-[#3B82F6] text-white text-sm font-semibold rounded-sm hover:brightness-110 shadow-lg"
            >
              <UserPlus size={14} /><span>Invite Staff</span>
            </button>
          </FeatureGate>
        </div>

        {/* Role Legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(ROLE_LABELS).map(([key, info]) => (
            <div key={key} className="bg-white/5 border border-white/5 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Shield size={12} className={info.color} />
                <span className={cn("text-xs font-bold uppercase tracking-widest", info.color)}>{info.label}</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">{info.description}</p>
            </div>
          ))}
        </div>

        {/* Staff Table */}
        {isLoading ? (
          <div className="py-20 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gray-600 animate-pulse">Loading Staff Registry...</div>
        ) : !staffList || staffList.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <Users size={48} className="mx-auto text-gray-700" />
            <h3 className="text-lg font-bold text-white">No Staff Members Yet</h3>
            <p className="text-sm text-gray-500">Invite your team to start collaborating.</p>
          </div>
        ) : (
          <FeatureGate feature="staffUsers">
            <div className="bg-[#1A1D21] border border-white/5 overflow-hidden rounded-lg">
              <table className="w-full border-collapse">
                <thead><tr className="bg-[#0F1113] text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                  <th className="px-6 py-4 text-left">Name</th><th className="px-6 py-4 text-left">Email</th><th className="px-6 py-4 text-center">Role</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-left">Invited</th>
                </tr></thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {staffList.map((staff: any) => (
                    <tr key={staff.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4"><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-xs font-bold text-white">{staff.name?.[0] || '?'}</div><span className="text-sm font-bold text-white">{staff.name}</span></div></td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono">{staff.email}</td>
                      <td className="px-6 py-4 text-center"><span className={cn("px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border rounded-sm", roleInfo(staff.role).color, "bg-white/5 border-white/10")}>{roleInfo(staff.role).label}</span></td>
                      <td className="px-6 py-4 text-center">{staff.is_active ? <span className="inline-flex items-center space-x-1 text-emerald-500 text-[9px] font-black uppercase"><CheckCircle2 size={10} /><span>Active</span></span> : <span className="inline-flex items-center space-x-1 text-red-500 text-[9px] font-black uppercase"><XCircle size={10} /><span>Inactive</span></span>}</td>
                      <td className="px-6 py-4 text-[10px] text-gray-500 font-mono">{staff.invited_at ? new Date(staff.invited_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FeatureGate>
        )}

        {/* Invite Modal */}
        <AnimatePresence>
          {showInvite && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowInvite(false)}>
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="bg-[#1A1D21] border border-white/10 p-8 max-w-md w-full space-y-6 rounded-lg shadow-2xl">
                <div><h2 className="text-xl font-bold text-white">Invite Staff Member</h2><p className="text-xs text-gray-500 mt-1">They will receive an email to set up their account.</p></div>
                <div className="space-y-4">
                  <div className="space-y-2"><label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Full Name</label><input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="e.g. Ali Hassan" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50" /></div>
                  <div className="space-y-2"><label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Email Address</label><input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="ali@company.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50" /></div>
                  <div className="space-y-2"><label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Role</label>
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value as StaffRole)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50 appearance-none text-white [&>option]:bg-[#1A1D21]">
                      {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([key, info]) => (<option key={key} value={key}>{info.label} — {info.description}</option>))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending || !inviteEmail || !inviteName} className="flex items-center space-x-2 px-6 py-2.5 bg-electric-blue text-black font-bold text-sm rounded-sm hover:brightness-110 disabled:opacity-50">
                    {inviteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}<span>{inviteMutation.isPending ? 'Sending...' : 'Send Invite'}</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
