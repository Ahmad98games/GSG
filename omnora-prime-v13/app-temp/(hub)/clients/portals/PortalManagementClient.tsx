"use client";
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { useLicense } from '@/hooks/useLicense';
import { redirect } from 'next/navigation';
import { PersonaEngine } from '@/lib/persona/PersonaEngine';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  ColumnDef 
} from '@tanstack/react-table';
import { 
  Plus, 
  MoreVertical, 
  Mail, 
  ShieldOff, 
  Loader2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { inviteClientToPortal } from '@/lib/actions/clientPortal';
import { usePersona } from '@/hooks/usePersona';
import { Decimal } from 'decimal.js';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';

// --- Zod Schema ---
const inviteSchema = z.object({
  partyId: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(2),
});

type InviteForm = z.infer<typeof inviteSchema>;

interface PortalRow {
  id: string;
  display_name: string;
  email: string;
  party_name: string;
  status: 'active' | 'suspended' | 'revoked';
  invite_sent_at: string | null;
  last_login_at: string | null;
  outstanding_balance?: number;
  overdue_amount?: number;
}

export default function PortalManagementPage({ 
  initialPortals, 
  parties,
  businessId 
}: { 
  initialPortals: PortalRow[], 
  parties: { id: string; name: string; email?: string }[],
  businessId: string 
}) {
  const { tier } = useLicense();
  const { t, fmt } = usePersona();
  const supabase = createClient();
  const toast = useToast();
  if (tier === 'lite') redirect('/settings');

  const [isInviteOpen, setIsInviteOpen] =  useState(false);
  const portals = initialPortals;

  const columns = useMemo<ColumnDef<PortalRow>[]>(() => [
    {
      accessorKey: 'display_name',
      header: t('portal.client_name'),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className={`text-xs font-bold text-white ${row.original.status === 'revoked' ? 'line-through text-gray-600' : ''}`}>
            {row.original.display_name}
          </span>
          <span className="text-[10px] text-gray-500 font-medium">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'party_name',
      header: t('portal.party'),
      cell: ({ row }) => <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{row.original.party_name}</span>,
    },
    {
      accessorKey: 'status',
      header: t('portal.status'),
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border ${
          row.original.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
          row.original.status === 'suspended' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
          'bg-white/5 text-gray-500 border-white/10'
        }`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'invite_sent_at',
      header: t('portal.invite_sent'),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 text-[10px] text-gray-500">
          <Clock size={12} />
          <span>{row.original.invite_sent_at ? PersonaEngine.formatDate(row.original.invite_sent_at) : t('portal.never')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'last_login_at',
      header: t('portal.last_login'),
      cell: ({ row }) => <span className="text-[10px] text-gray-500">{row.original.last_login_at ? PersonaEngine.formatDate(row.original.last_login_at) : '—'}</span>,
    },
    {
      accessorKey: 'outstanding_balance',
      header: () => <div className="text-right">{t('portal.outstanding_balance')}</div>,
      cell: ({ row }) => (
        <div className={`text-right font-mono font-bold ${row.original.overdue_amount && row.original.overdue_amount > 0 ? 'text-[#EF4444]' : 'text-sandstone-gold'}`}>
          {row.original.outstanding_balance != null ? fmt(new Decimal(row.original.outstanding_balance)) : '—'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => {
        const portal = row.original;
        if (portal.status === 'revoked') return null;
        return (
          <div className="flex justify-end">
            <button
              onClick={async () => {
                if (!confirm(`Revoke portal access for ${portal.display_name}?`)) return;
                try {
                  const { error } = await supabase
                    .from('client_portals')
                    .update({ status: 'revoked' })
                    .eq('id', portal.id);
                    
                  if (!error) {
                    import('@/stores/undoStore').then(({ useUndoStore }) => {
                      useUndoStore.getState().pushAction({
                        description: `Revoked portal access for ${portal.display_name}`,
                        undo: async () => {
                          const supabaseClient = createClient();
                          await supabaseClient
                            .from('client_portals')
                            .update({ status: 'active' })
                            .eq('id', portal.id);
                          window.location.reload();
                        }
                      });
                    });
                    
                    toast.success('Access revoked', 'Press Ctrl+Z to undo');
                    window.location.reload();
                  } else {
                    toast.error('Failed to revoke access');
                  }
                } catch (e) {
                  console.error(e);
                  toast.error('Failed to revoke access');
                }
              }}
              className="text-[9px] font-black tracking-widest uppercase text-red-400 hover:text-red-300 border border-red-500/20 bg-red-500/10 px-3 py-1 rounded-sm transition-all"
            >
              Revoke
            </button>
          </div>
        );
      },
    },
  ], [t, fmt]);

  const table = useReactTable({
    data: portals,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen bg-onyx text-slate-200">
      <div className="p-8 max-w-[1600px] mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">{t('portal.management_title')}</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-[0.2em] mt-1">
              <span className="text-sandstone-gold font-mono">{portals.length}</span> {t('portal.active_nodes')}
            </p>
          </div>
          <button 
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center space-x-3 px-6 py-3 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-400 transition-all"
          >
            <Plus size={16} />
            <span>{t('portal.invite_client')}</span>
          </button>
        </div>

        {/* Table */}
        <div className="border border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="bg-white/5 border-b border-white/5">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Slide-Over */}
      <InvitePortalPanel 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        parties={parties}
        businessId={businessId}
      />
    </div>
  );
}

// --- Invite Panel Sub-component ---
function InvitePortalPanel({ isOpen, onClose, parties, businessId }: { 
  isOpen: boolean, 
  onClose: () => void, 
  parties: { id: string; name: string; email?: string }[],
  businessId: string
}) {
  const { t } = usePersona();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      partyId: '',
      email: '',
      displayName: ''
    }
  });

  const selectedPartyId = watch('partyId');
  
  useEffect(() => {
    if (selectedPartyId) {
      const party = parties.find(p => p.id === selectedPartyId);
      if (party) {
        setValue('email', party.email || '');
        setValue('displayName', party.name);
      }
    }
  }, [selectedPartyId, parties, setValue]);

  const onSubmit = async (data: InviteForm) => {
    try {
      await inviteClientToPortal({ ...data, businessId });
      reset();
      onClose();
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-onyx/80 backdrop-blur-sm" 
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#1A1D21] z-[70] border-l border-white/10 shadow-2xl p-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">{t('portal.initialize_access')}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><ShieldOff size={20} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('portal.select_partner')}</label>
                <select 
                  {...register('partyId')}
                  className="w-full bg-onyx border border-white/10 p-4 text-xs text-white focus:outline-none focus:border-electric-blue transition-colors appearance-none rounded-none"
                >
                  <option value="">{t('portal.select_party_placeholder')}</option>
                  {(parties ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.partyId && <span className="text-[9px] text-critical-red font-bold uppercase">{errors.partyId.message}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('portal.access_email')}</label>
                <input 
                  {...register('email')}
                  className="w-full bg-onyx border border-white/10 p-4 text-xs text-white focus:outline-none focus:border-electric-blue transition-colors rounded-none"
                  placeholder="client@company.com"
                />
                {errors.email && <span className="text-[9px] text-critical-red font-bold uppercase">{errors.email.message}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('portal.display_name')}</label>
                <input 
                  {...register('displayName')}
                  className="w-full bg-onyx border border-white/10 p-4 text-xs text-white focus:outline-none focus:border-electric-blue transition-colors rounded-none"
                  placeholder="Primary Point of Contact"
                />
              </div>

              <div className="pt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-400 transition-all flex items-center justify-center space-x-3 rounded-none"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                  <span>{t('portal.dispatch_invite')}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
