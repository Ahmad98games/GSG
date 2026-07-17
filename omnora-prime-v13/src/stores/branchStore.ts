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
        try {
          const supabase = createClient()
          const { data } = await supabase
            .from('branches')
            .select('*')
            .eq('business_id', businessId)
            .order('name')

          const mappedBranches = (data || []).map((b: any) => ({
            ...b,
            code: b.branch_code || b.code || '',
            status: b.is_active ? 'active' : 'suspended',
          }))

          const activeId = get().currentBranchId
          const active = mappedBranches.find((b: any) => b.id === activeId) || null

          set({
            branches: mappedBranches,
            activeBranch: active,
            isLoading: false,
          })
        } catch {
          set({ isLoading: false })
        }
      },

      createBranch: async (newBranch: any) => {
        set({ isLoading: true })
        try {
          const supabase = createClient()
          
          // Map frontend form properties to database columns
          const dbPayload = {
            business_id: newBranch.business_id,
            name: newBranch.name,
            city: newBranch.city || null,
            address: newBranch.address || null,
            branch_code: newBranch.code,
            is_headquarters: newBranch.is_headquarters || false,
            is_active: newBranch.status === 'active' || true,
            timezone: newBranch.timezone || 'Asia/Karachi',
            manager_user_id: newBranch.manager_user_id || null,
          }

          const { error } = await supabase
            .from('branches')
            .insert(dbPayload)

          if (error) throw error

          // Refetch branches
          await get().fetchBranches(newBranch.business_id)
        } catch (err) {
          console.error('[BranchStore] Create failed:', err)
          set({ isLoading: false })
          throw err
        }
      },

      updateBranch: async (id: string, updatedFields: any) => {
        set({ isLoading: true })
        try {
          const supabase = createClient()

          // Map frontend fields to DB columns
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

          const { error } = await supabase
            .from('branches')
            .update(dbPayload)
            .eq('id', id)

          if (error) throw error

          // Get business_id from local state to refresh list
          const firstBranch = get().branches[0]
          if (firstBranch) {
            await get().fetchBranches(firstBranch.business_id)
          } else {
            set({ isLoading: false })
          }
        } catch (err) {
          console.error('[BranchStore] Update failed:', err)
          set({ isLoading: false })
          throw err
        }
      },

      suspendBranch: async (id: string) => {
        await get().updateBranch(id, { status: 'suspended' })
      },

      archiveBranch: async (id: string) => {
        set({ isLoading: true })
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from('branches')
            .update({ is_active: false }) // archive sets is_active false
            .eq('id', id)

          if (error) throw error

          const firstBranch = get().branches[0]
          if (firstBranch) {
            await get().fetchBranches(firstBranch.business_id)
          } else {
            set({ isLoading: false })
          }
        } catch (err) {
          console.error('[BranchStore] Archive failed:', err)
          set({ isLoading: false })
          throw err
        }
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
      }),
    }
  )
)
