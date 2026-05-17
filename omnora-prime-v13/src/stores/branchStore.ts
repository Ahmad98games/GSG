import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

export type BranchStatus = 'active' | 'suspended' | 'archived';

export interface Branch {
  id: string;
  business_id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  manager_user_id: string | null;
  timezone: string;
  status: BranchStatus;
  is_headquarters: boolean;
  created_at: string;
  updated_at: string;
}

export type NewBranch = Omit<Branch, 'id' | 'created_at' | 'updated_at'>;

interface BranchState {
  branches: Branch[];
  activeBranchId: string | null;
  activeBranch: Branch | null;
  isLoading: boolean;
  error: string | null;

  fetchBranches: (businessId: string) => Promise<void>;
  setActiveBranch: (branchId: string) => Promise<void>;
  createBranch: (data: NewBranch) => Promise<Branch>;
  updateBranch: (id: string, data: Partial<Branch>) => Promise<void>;
  suspendBranch: (id: string) => Promise<void>;
  archiveBranch: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: [],
      activeBranchId: null,
      activeBranch: null,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      fetchBranches: async (businessId: string) => {
        set({ isLoading: true, error: null });
        const supabase = createClient();
        try {
          const { data, error } = await supabase
            .from('branches')
            .select('*')
            .eq('business_id', businessId)
            .neq('status', 'archived')
            .order('is_headquarters', { ascending: false });

          if (error) throw error;

          const branches = data as Branch[];
          let activeId = get().activeBranchId;
          
          // Auto-select HQ if no active branch or active branch no longer available in the fetched list
          if (!activeId || !branches.find(b => b.id === activeId)) {
            const hq = branches.find(b => b.is_headquarters);
            activeId = hq ? hq.id : (branches[0]?.id || null);
          }

          set({ 
            branches, 
            activeBranchId: activeId,
            activeBranch: branches.find(b => b.id === activeId) || null,
            isLoading: false 
          });

          // Sync branch context with Supabase if we have an active branch
          if (activeId) {
            await supabase.rpc('set_branch_context', { branch_id: activeId });
          }
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      setActiveBranch: async (branchId: string) => {
        const supabase = createClient();
        const branch = get().branches.find(b => b.id === branchId);
        if (!branch) return;

        try {
          // Call Supabase RPC to set app.branch_id in the current session
          const { error } = await supabase.rpc('set_branch_context', { branch_id: branchId });
          if (error) throw error;

          set({ 
            activeBranchId: branchId, 
            activeBranch: branch 
          });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      createBranch: async (data: NewBranch) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
          // 1. Check business tier (Elite Only)
          const { data: license, error: licenseError } = await supabase
            .from('licenses')
            .select('tier')
            .eq('tenant_id', data.business_id)
            .eq('status', 'active')
            .single();

          if (licenseError) throw licenseError;
          if (license.tier !== 'elite') {
            throw new Error('BRANCH_ELITE_ONLY');
          }

          // 2. Enforce max 10 branches per business
          const { count, error: countError } = await supabase
            .from('branches')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', data.business_id)
            .neq('status', 'archived');

          if (countError) throw countError;
          if (count !== null && count >= 10) {
            throw new Error('MAX_BRANCHES_REACHED');
          }

          // 3. Insert new branch
          const { data: newBranch, error: insertError } = await supabase
            .from('branches')
            .insert(data)
            .select()
            .single();

          if (insertError) throw insertError;

          // Re-fetch branches to sync UI
          await get().fetchBranches(data.business_id);
          return newBranch as Branch;
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      updateBranch: async (id: string, data: Partial<Branch>) => {
        const supabase = createClient();
        // Restrict updates to UI-safe fields only
        const { name, address, city, manager_user_id, timezone, status } = data;
        const updateData = { name, address, city, manager_user_id, timezone, status };

        try {
          const { error } = await supabase
            .from('branches')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;

          const businessId = get().branches[0]?.business_id;
          if (businessId) await get().fetchBranches(businessId);
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      suspendBranch: async (id: string) => {
        const branch = get().branches.find(b => b.id === id);
        if (!branch) return;
        
        // Prevent suspending the Headquarters
        if (branch.is_headquarters) {
          throw new Error('CANNOT_SUSPEND_HQ');
        }

        await get().updateBranch(id, { status: 'suspended' });
      },

      archiveBranch: async (id: string) => {
        const supabase = createClient();
        const branch = get().branches.find(b => b.id === id);
        if (!branch) return;

        // 1. Block if HQ
        if (branch.is_headquarters) {
          throw new Error('CANNOT_ARCHIVE_HQ');
        }

        // 2. Block if branch has active POS sessions
        const { data: pos, error: posError } = await supabase
          .from('pos_sessions')
          .select('id')
          .eq('branch_id', id)
          .eq('is_closed', false)
          .limit(1);

        if (posError) throw posError;
        if (pos && pos.length > 0) {
          throw new Error('BRANCH_HAS_ACTIVE_POS_SESSIONS');
        }

        // 3. Block if branch has in-transit inter-branch transfers
        const { data: ibt, error: ibtError } = await supabase
          .from('inter_branch_transfers')
          .select('id')
          .or(`from_branch_id.eq.${id},to_branch_id.eq.${id}`)
          .eq('status', 'in_transit')
          .limit(1);

        if (ibtError) throw ibtError;
        if (ibt && ibt.length > 0) {
          throw new Error('BRANCH_HAS_PENDING_TRANSFERS');
        }

        // Proceed with archiving (logical delete)
        await get().updateBranch(id, { status: 'archived' });
      },

      reset: () => set({
        branches: [],
        activeBranchId: null,
        activeBranch: null,
        isLoading: false,
        error: null,
      }),
    }),
    {
      name: 'NOXIS-branch-selection',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeBranchId: state.activeBranchId }),
    }
  )
);

