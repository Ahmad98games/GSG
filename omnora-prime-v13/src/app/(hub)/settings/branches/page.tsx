"use client";
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, MoreVertical, Archive, 
  Slash, X, Check, Search, MapPin, 
  Building2, Globe, User, Clock, AlertCircle,
  ShieldAlert, ChevronRight
} from 'lucide-react';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  createColumnHelper 
} from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBranchStore, Branch } from '@/stores/branchStore';
import { useLicense } from '@/hooks/useLicense';
import { usePersona } from '@/hooks/usePersona';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { cn } from '@/lib/utils';
import IndustrialEmptyState from '@/components/ui/IndustrialEmptyState';
import FeatureLock from '@/components/ui/FeatureLock';

// Zod Schema for Branch Validation
const branchSchema = z.object({
  name: z.string().min(1, 'Name required').max(80, 'Max 80 chars'),
  code: z.string().min(1, 'Code required').max(10, 'Max 10 chars').toUpperCase(),
  city: z.string().min(1, 'City required'),
  address: z.string().optional(),
  timezone: z.string().min(1, 'Timezone required').default('Asia/Karachi'),
  manager_user_id: z.string().uuid().optional().nullable(),
  is_headquarters: z.boolean().default(false),
});

type BranchFormValues = z.infer<typeof branchSchema>;

export default function BranchesPage() {
  const router = useRouter();
  const { tier, isLoading: isLicenseLoading } = useLicense();
  const { branches, fetchBranches, createBranch, updateBranch, suspendBranch, archiveBranch, isLoading: isBranchLoading } = useBranchStore();
  const { profile } = useBusinessProfile();
  const { t } = usePersona();

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<{ type: 'suspend' | 'archive', branch: Branch } | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');

  if (!isLicenseLoading && tier !== 'elite') {
    return (
      <div className="min-h-screen bg-onyx flex items-center justify-center p-8">
        <FeatureLock 
          title="Multi-Branch Management" 
          description="Consolidate ledgers, track cross-branch inventory transfers, and coordinate staff across multiple physical factories. Upgrade to Elite to unlock."
          requiredTier="elite"
        />
      </div>
    );
  }

  useEffect(() => {
    if (profile?.id) {
      fetchBranches(profile.id);
    }
  }, [profile?.id, fetchBranches]);

  const columnHelper = createColumnHelper<Branch>();

  const columns =  useMemo (() => [
    columnHelper.accessor('code', {
      header: () => <span className="text-[10px] uppercase tracking-widest text-gray-500">{t('branches.col_code') || 'Code'}</span>,
      cell: info => (
        <span className="font-mono text-sandstone-gold font-bold tracking-wider">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('name', {
      header: () => <span className="text-[10px] uppercase tracking-widest text-gray-500">{t('branches.col_name') || 'Name'}</span>,
      cell: info => (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-white">{info.getValue()}</span>
          {info.row.original.is_headquarters && (
            <span className="text-[8px] bg-electric-blue/20 text-electric-blue px-1.5 py-0.5 rounded-sm uppercase font-bold tracking-tighter border border-electric-blue/20">HQ</span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('city', {
      header: () => <span className="text-[10px] uppercase tracking-widest text-gray-500">{t('branches.col_city') || 'City'}</span>,
      cell: info => <span className="text-xs text-gray-400">{info.getValue()}</span>,
    }),
    columnHelper.accessor('manager_user_id', {
      header: () => <span className="text-[10px] uppercase tracking-widest text-gray-500">{t('branches.col_manager') || 'Manager'}</span>,
      cell: info => (
        <span className="text-xs text-gray-500 italic">
          {info.getValue() ? t('branches.assigned') || 'Assigned' : t('branches.unassigned') || 'Unassigned'}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: () => <span className="text-[10px] uppercase tracking-widest text-gray-500">{t('branches.col_status') || 'Status'}</span>,
      cell: info => {
        const status = info.getValue();
        return (
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-sm inline-block",
            status === 'active' && "text-emerald bg-emerald/10 border border-emerald/20",
            status === 'suspended' && "text-amber-500 bg-amber-500/10 border border-amber-500/20",
            status === 'archived' && "text-gray-500 bg-white/5 border border-white/5 italic"
          )}>
            {status}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      cell: info => (
        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setEditingBranch(info.row.original);
              setIsSlideOverOpen(true);
            }}
            className="p-1 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      ),
    }),
  ], [t, columnHelper]);

  const table = useReactTable({
    data: branches,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLicenseLoading || isBranchLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 w-48 bg-white/5 animate-pulse rounded-sm" />
        <div className="h-64 w-full bg-white/5 animate-pulse rounded-sm" />
      </div>
    );
  }

  const hqExists = branches.some(b => b.is_headquarters);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em]">
            {t('branches.title') || 'Site & Branch Management'}
          </h1>
          <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest flex items-center">
            <span className="font-mono text-sandstone-gold font-bold text-base mr-2">{branches.length}</span> 
            {t('branches.of_max') || 'of 10 operational branches active'}
          </p>
        </div>
        <button
          disabled={branches.length >= 10}
          onClick={() => {
            setEditingBranch(null);
            setIsSlideOverOpen(true);
          }}
          className="flex items-center space-x-3 px-8 py-3 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-electric-blue disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500 shadow-xl shadow-electric-blue/10"
        >
          <Plus size={16} />
          <span>{t('branches.btn_new') || 'Deploy New Branch'}</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-surface border border-white/5 overflow-hidden">
        {branches.length === 0 ? (
          <IndustrialEmptyState 
            title={t('branches.empty_title') || 'No Active Branches'}
            description={t('branches.empty_desc') || 'Initialize your industrial network by deploying your first branch or headquarters.'}
            actionLabel={t('branches.btn_new') || 'Deploy Branch'}
            onAction={() => setIsSlideOverOpen(true)}
          />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-white/5 bg-white/[0.01]">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-5 font-normal">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id} 
                  onClick={() => {
                    setEditingBranch(row.original);
                    setIsSlideOverOpen(true);
                  }}
                  className={cn(
                    "border-b border-white/[0.02] hover:bg-white/[0.01] transition-all cursor-pointer group",
                    row.original.is_headquarters && "border-l-[2px] border-electric-blue bg-electric-blue/[0.01]"
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Side-over Form Panel */}
      <AnimatePresence>
        {isSlideOverOpen && (
          <BranchFormPanel 
            branch={editingBranch}
            hqExists={hqExists}
            onClose={() => setIsSlideOverOpen(false)}
            onSuspend={() => setConfirmingAction({ type: 'suspend', branch: editingBranch! })}
            onArchive={() => setConfirmingAction({ type: 'archive', branch: editingBranch! })}
          />
        )}
      </AnimatePresence>

      {/* Destructive Action Confirmation */}
      <AnimatePresence>
        {confirmingAction && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmingAction(null)}
              className="absolute inset-0 bg-onyx/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-surface border border-critical-red/20 p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-critical-red/10 text-critical-red rounded-full">
                  <ShieldAlert size={32} />
                </div>
                <h2 className="text-lg font-black text-white uppercase tracking-widest">
                  {confirmingAction.type === 'suspend' ? 'Suspend Operations?' : 'Archive Branch?'}
                </h2>
                <p className="text-xs text-gray-400 uppercase tracking-wider leading-relaxed">
                  This action is irreversible for archived branches. To confirm, type the branch name <span className="text-white font-bold">"{confirmingAction.branch.name}"</span> below:
                </p>
                <input 
                  autoFocus
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className="w-full bg-onyx border border-white/10 px-4 py-3 text-sm text-center text-white outline-none focus:border-critical-red transition-colors font-mono"
                  placeholder="Type name here"
                />
                <div className="flex w-full space-x-3 pt-4">
                  <button 
                    onClick={() => setConfirmingAction(null)}
                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white border border-white/5 hover:border-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={confirmationInput !== confirmingAction.branch.name}
                    onClick={async () => {
                      if (confirmingAction.type === 'suspend') await suspendBranch(confirmingAction.branch.id);
                      else await archiveBranch(confirmingAction.branch.id);
                      setConfirmingAction(null);
                      setIsSlideOverOpen(false);
                      setConfirmationInput('');
                    }}
                    className="flex-1 py-3 bg-critical-red text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-500 disabled:opacity-20 disabled:grayscale transition-all"
                  >
                    Confirm Action
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface BranchFormPanelProps {
  branch: Branch | null;
  hqExists: boolean;
  onClose: () => void;
  onSuspend: () => void;
  onArchive: () => void;
}

function BranchFormPanel({ branch, hqExists, onClose, onSuspend, onArchive }: BranchFormPanelProps) {
  const { t } = usePersona();
  const { profile } = useBusinessProfile();
  const { createBranch, updateBranch } = useBranchStore();
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: branch ? {
      name: branch.name,
      code: branch.code,
      city: branch.city || '',
      address: branch.address || '',
      timezone: branch.timezone,
      manager_user_id: branch.manager_user_id,
      is_headquarters: branch.is_headquarters
    } : {
      timezone: 'Asia/Karachi',
      is_headquarters: !hqExists
    }
  });

  const onSubmit = async (data: BranchFormValues) => {
    if (branch) {
      await updateBranch(branch.id, data);
    } else {
      await createBranch({ ...data, business_id: profile!.id, status: 'active' } as any);
    }
    onClose();
  };

  const timezones = Intl.supportedValuesOf('timeZone');

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-onyx/80 backdrop-blur-sm z-[100]"
      />
      <motion.div 
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-[450px] bg-surface border-l border-white/5 z-[101] shadow-2xl flex flex-col"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-onyx/30">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-widest">
              {branch ? 'Modify Operations' : 'Initialize Site'}
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
              Branch Configuration Engine
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 text-gray-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {/* Branch Code & Name */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-2">
              <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Site Code</label>
              <input 
                {...register('code')} 
                disabled={!!branch}
                className="w-full bg-onyx border border-white/5 px-4 py-3 text-xs text-sandstone-gold font-mono font-bold uppercase outline-none focus:border-electric-blue transition-colors disabled:opacity-50" 
                placeholder="KHI-01"
              />
              {errors.code && <p className="text-[9px] text-critical-red uppercase font-bold">{errors.code.message}</p>}
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Branch Name</label>
              <input 
                {...register('name')} 
                className="w-full bg-onyx border border-white/5 px-4 py-3 text-xs text-white outline-none focus:border-electric-blue transition-colors" 
                placeholder="Main Processing Plant"
              />
              {errors.name && <p className="text-[9px] text-critical-red uppercase font-bold">{errors.name.message}</p>}
            </div>
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Operational City</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3.5 text-gray-600" size={14} />
              <input 
                {...register('city')} 
                className="w-full bg-onyx border border-white/5 pl-12 pr-4 py-3 text-xs text-white outline-none focus:border-electric-blue transition-colors" 
                placeholder="Karachi"
              />
            </div>
            {errors.city && <p className="text-[9px] text-critical-red uppercase font-bold">{errors.city.message}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Physical Address</label>
            <textarea 
              {...register('address')} 
              rows={3}
              className="w-full bg-onyx border border-white/5 px-4 py-3 text-xs text-white outline-none focus:border-electric-blue transition-colors resize-none" 
              placeholder="Plot No. 12, Industrial Area..."
            />
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Site Timezone</label>
            <div className="relative">
              <Clock className="absolute left-4 top-3.5 text-gray-600" size={14} />
              <select 
                {...register('timezone')} 
                className="w-full bg-onyx border border-white/5 pl-12 pr-4 py-3 text-xs text-white outline-none focus:border-electric-blue transition-colors appearance-none"
              >
                {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>

          {/* Headquarters Toggle */}
          {!branch && (
            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Headquarters Site</p>
                <p className="text-[8px] text-gray-500 uppercase tracking-tighter">Designate this site as primary HQ</p>
              </div>
              <input 
                type="checkbox" 
                disabled={hqExists}
                {...register('is_headquarters')}
                className="w-4 h-4 accent-electric-blue bg-onyx border-white/10"
              />
            </div>
          )}

          {/* Administrative Actions for Existing Branches */}
          {branch && !branch.is_headquarters && (
            <div className="pt-8 border-t border-white/5 space-y-4">
              <p className="text-[9px] uppercase tracking-widest font-bold text-gray-600">Administrative Controls</p>
              <div className="flex space-x-3">
                <button 
                  type="button" onClick={onSuspend}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-onyx transition-all"
                >
                  <Slash size={14} />
                  <span>Suspend</span>
                </button>
                <button 
                  type="button" onClick={onArchive}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-critical-red/10 text-critical-red text-[10px] font-black uppercase tracking-widest hover:bg-critical-red hover:text-white transition-all"
                >
                  <Archive size={14} />
                  <span>Archive</span>
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="p-8 border-t border-white/5 bg-onyx/30 flex space-x-4">
          <button 
            type="button" onClick={onClose}
            className="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors"
          >
            Discard
          </button>
          <button 
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-2 px-12 py-3 bg-white text-onyx text-[10px] font-black uppercase tracking-[0.2em] hover:bg-electric-blue hover:text-white transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Syncing...' : (branch ? 'Sync Changes' : 'Initialize')}
          </button>
        </div>
      </motion.div>
    </>
  );
}

