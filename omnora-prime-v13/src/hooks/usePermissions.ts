import { useMemo } from 'react'
import {
  hasPermission,
  Permission, Role,
  ROLE_LABELS,
} from '@/lib/rbac/permissions'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function usePermissions() {
  const { currentUser } = useCurrentUser()
  const role = (currentUser?.role || 'owner') as Role

  const can = useMemo(
    () => (permission: Permission) =>
      hasPermission(role, permission),
    [role]
  )

  const cannot = useMemo(
    () => (permission: Permission) =>
      !hasPermission(role, permission),
    [role]
  )

  return {
    role,
    currentUser,
    can,
    cannot,
    isOwner: role === 'owner',
    isManager: role === 'manager',
    isAccountant: role === 'accountant',
    isSupervisor: role === 'supervisor',
    isViewer: role === 'viewer',
    roleLabel: ROLE_LABELS[role] || 'Owner',
  }
}
