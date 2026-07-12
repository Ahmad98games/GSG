import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/rbac/permissions'

interface Props {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Can({
  permission,
  children,
  fallback = null,
}: Props) {
  const { can } = usePermissions()
  if (can(permission)) return <>{children}</>
  return <>{fallback}</>
}
