import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'

export interface Branch {
  id: string
  business_id: string
  name: string
  city: string | null
  address: string | null
  branch_code: string
  is_headquarters: boolean
  is_active: boolean
  manager_name: string | null
  manager_phone: string | null
  manager_user_id: string | null
  timezone: string
  code: string // for backward compatibility
  status: 'active' | 'suspended' | 'archived'
}

interface BranchState {
  currentBranchId: string | null
  currentBranchName: string
  isHeadquarters: boolean
  setBranch: (
    id: string | null,
    name: string,
    isHQ: boolean
  ) => void
  clearBranch: () => void
  reset: () => void

  // Backward compatibility
  branches: Branch[]
  activeBranchId: string | null
  activeBranch: Branch | null
  isLoading: boolean
  setActiveBranch: (id: string | null) => void
  fetchBranches: (businessId: string) => Promise<void>
  createBranch: (newBranch: any) => Promise<void>
  updateBranch: (id: string, updatedFields: any) => Promise<void>
  suspendBranch: (id: string) => Promise<void>
  archiveBranch: (id: string) => Promise<void>
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      currentBranchId: null,
      currentBranchName: 'All Branches',
      isHeadquarters: true,

      setBranch: (id, name, isHQ) =>
        set({
          currentBranchId: id,
          currentBranchName: name,
          isHeadquarters: isHQ,
          activeBranchId: id,
          activeBranch: get().branches.find((b: any) => b.id === id) || null,
        }),
      clearBranch: () =>
        set({
          currentBranchId: null,
          currentBranchName: 'All Branches',
          isHeadquarters: true,
          activeBranchId: null,
          activeBranch: null,
        }),
      reset: () =>
        set({
          currentBranchId: null,
          currentBranchName: 'All Branches',
          isHeadquarters: true,
          activeBranchId: null,
          activeBranch: null,
          branches: [],
          isLoading: false,
        }),

      // Backward compatibility fields
      branches: [],
      activeBranchId: null,
      activeBranch: null,
      isLoading: false,

      setActiveBranch: (id) => {
        if (!id || id === 'all') {
          get().clearBranch()
        } else {
          const branch = get().branches.find((b: any) => b.id === id)
          if (branch) {
            get().setBranch(branch.id, branch.name, branch.is_headquarters)
          }
        }
      },

      fetchBranches: async (businessId) => {
        set({ isLoading: true })
        const effectiveBizId = businessId || 'local'

        // 1. Check local storage cache
        let localBranches: Branch[] = []
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(`noxis_branches_cache_${effectiveBizId}`)
            if (raw) localBranches = JSON.parse(raw)
          } catch {}
        }

        // 2. Default Seed Headquarters if zero branches exist
        if (localBranches.length === 0) {
          localBranches = [
            {
              id: 'branch_hq_01',
              business_id: effectiveBizId,
              name: 'Main Plant & Central Headquarters',
              city: 'Karachi',
              address: 'Plot 42, Industrial Area, Sector 5',
              branch_code: 'HQ-01',
              code: 'HQ-01',
              is_headquarters: true,
              is_active: true,
              status: 'active',
              timezone: 'Asia/Karachi',
              manager_name: 'Lead Operations Director',
              manager_phone: '+92 300 1234567',
              manager_user_id: null,
            }
          ]
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`noxis_branches_cache_${effectiveBizId}`, JSON.stringify(localBranches))
            } catch {}
          }
        }

        const activeId = get().currentBranchId || localBranches[0]?.id
        const active = localBranches.find((b: any) => b.id === activeId) || localBranches[0] || null

        set({
          branches: localBranches,
          currentBranchId: active?.id || null,
          currentBranchName: active?.name || 'Main Plant & Central Headquarters',
          isHeadquarters: active?.is_headquarters ?? true,
          activeBranchId: active?.id || null,
          activeBranch: active,
          isLoading: false,
        })

        // 3. Background sync with Supabase if online
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('branches')
            .select('*')
            .eq('business_id', effectiveBizId)
            .order('name')

          if (!error && data && data.length > 0) {
            const mappedBranches = data.map((b: any) => ({
              ...b,
              code: b.branch_code || b.code || '',
              status: b.is_active ? 'active' : 'suspended',
            }))
            if (typeof window !== 'undefined') {
              localStorage.setItem(`noxis_branches_cache_${effectiveBizId}`, JSON.stringify(mappedBranches))
            }
            set({
              branches: mappedBranches,
              activeBranch: mappedBranches.find((b: any) => b.id === get().currentBranchId) || mappedBranches[0] || null,
            })
          }
        } catch {
          // Offline mode resilient - local cache is already active
        }
      },

      createBranch: async (newBranch: any) => {
        set({ isLoading: true })
        const effectiveBizId = newBranch.business_id || 'local'

        const branchId = `branch_${Date.now()}`
        const branchItem: Branch = {
          id: branchId,
          business_id: effectiveBizId,
          name: newBranch.name,
          city: newBranch.city || 'Karachi',
          address: newBranch.address || null,
          branch_code: newBranch.code,
          code: newBranch.code,
          is_headquarters: newBranch.is_headquarters || false,
          is_active: newBranch.status === 'active' || true,
          status: 'active',
          timezone: newBranch.timezone || 'Asia/Karachi',
          manager_name: newBranch.manager_name || 'Floor Manager',
          manager_phone: newBranch.manager_phone || null,
          manager_user_id: newBranch.manager_user_id || null,
        }

        const currentList = get().branches
        const updatedList = [...currentList, branchItem]

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`noxis_branches_cache_${effectiveBizId}`, JSON.stringify(updatedList))
          } catch {}
        }

        set({
          branches: updatedList,
          isLoading: false,
        })

        // Background sync to Supabase if connected
        try {
          const supabase = createClient()
          const dbPayload = {
            id: branchId,
            business_id: effectiveBizId,
            name: branchItem.name,
            city: branchItem.city,
            address: branchItem.address,
            branch_code: branchItem.branch_code,
            is_headquarters: branchItem.is_headquarters,
            is_active: true,
            timezone: branchItem.timezone,
            manager_user_id: branchItem.manager_user_id,
          }
          await supabase.from('branches').insert(dbPayload)
        } catch {
          // Offline mode: locally saved
        }
      },

      updateBranch: async (id: string, updatedFields: any) => {
        set({ isLoading: true })
        const currentList = get().branches
        const updatedList = currentList.map(b => {
          if (b.id !== id) return b
          return {
            ...b,
            ...updatedFields,
            code: updatedFields.code || b.code,
            branch_code: updatedFields.code || b.branch_code,
            status: updatedFields.status || b.status,
            is_active: updatedFields.status ? updatedFields.status === 'active' : b.is_active,
          }
        })

        const effectiveBizId = currentList[0]?.business_id || 'local'
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`noxis_branches_cache_${effectiveBizId}`, JSON.stringify(updatedList))
          } catch {}
        }

        set({
          branches: updatedList,
          activeBranch: updatedList.find(b => b.id === get().currentBranchId) || updatedList[0] || null,
          isLoading: false,
        })

        // Background sync
        try {
          const supabase = createClient()
          const dbPayload: any = {}
          if (updatedFields.name !== undefined) dbPayload.name = updatedFields.name
          if (updatedFields.city !== undefined) dbPayload.city = updatedFields.city || null
          if (updatedFields.address !== undefined) dbPayload.address = updatedFields.address || null
          if (updatedFields.code !== undefined) dbPayload.branch_code = updatedFields.code
          if (updatedFields.is_headquarters !== undefined) dbPayload.is_headquarters = updatedFields.is_headquarters
          if (updatedFields.timezone !== undefined) dbPayload.timezone = updatedFields.timezone
          if (updatedFields.manager_user_id !== undefined) dbPayload.manager_user_id = updatedFields.manager_user_id
          if (updatedFields.status !== undefined) {
            dbPayload.is_active = updatedFields.status === 'active'
          }
          await supabase.from('branches').update(dbPayload).eq('id', id)
        } catch {}
      },

      suspendBranch: async (id: string) => {
        await get().updateBranch(id, { status: 'suspended' })
      },

      archiveBranch: async (id: string) => {
        await get().updateBranch(id, { status: 'archived', is_active: false })
      },
    }),
    {
      name: 'noxis-branch',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentBranchId: state.currentBranchId,
        currentBranchName: state.currentBranchName,
        isHeadquarters: state.isHeadquarters,
        activeBranchId: state.activeBranchId,
        activeBranch: state.activeBranch,
        branches: state.branches,
      }),
    }
  )
)
