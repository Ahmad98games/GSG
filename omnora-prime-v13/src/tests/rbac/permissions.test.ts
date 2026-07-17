import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  getRolePermissions,
} from '@/lib/rbac/permissions'

describe('RBAC Permission System', () => {
  describe('Owner permissions', () => {
    it('owner can do everything', () => {
      expect(hasPermission('owner',
        'view:profit')).toBe(true)
      expect(hasPermission('owner',
        'manage:users')).toBe(true)
      expect(hasPermission('owner',
        'delete:invoices')).toBe(true)
      expect(hasPermission('owner',
        'edit:settings')).toBe(true)
    })
  })

  describe('Supervisor permissions', () => {
    it('supervisor can log production', () => {
      expect(hasPermission('supervisor',
        'create:production_logs')).toBe(true)
      expect(hasPermission('supervisor',
        'create:attendance')).toBe(true)
    })

    it('supervisor cannot see financials', () => {
      expect(hasPermission('supervisor',
        'view:revenue')).toBe(false)
      expect(hasPermission('supervisor',
        'view:profit')).toBe(false)
      expect(hasPermission('supervisor',
        'view:party_balances')).toBe(false)
    })

    it('supervisor cannot create invoices', () => {
      expect(hasPermission('supervisor',
        'create:invoices')).toBe(false)
      expect(hasPermission('supervisor',
        'post:invoices')).toBe(false)
    })

    it('supervisor cannot manage users', () => {
      expect(hasPermission('supervisor',
        'manage:users')).toBe(false)
    })
  })

  describe('Accountant permissions', () => {
    it('accountant can view all reports', () => {
      expect(hasPermission('accountant',
        'view:reports_financial')).toBe(true)
      expect(hasPermission('accountant',
        'view:reports_payroll')).toBe(true)
    })

    it('accountant cannot create invoices', () => {
      expect(hasPermission('accountant',
        'create:invoices')).toBe(false)
    })

    it('accountant can view audit log', () => {
      expect(hasPermission('accountant',
        'view:audit_log')).toBe(true)
    })
  })

  describe('Viewer permissions', () => {
    it('viewer cannot see financial data', () => {
      expect(hasPermission('viewer',
        'view:revenue')).toBe(false)
      expect(hasPermission('viewer',
        'view:party_balances')).toBe(false)
      expect(hasPermission('viewer',
        'view:inventory_costs')).toBe(false)
    })

    it('viewer cannot create anything', () => {
      expect(hasPermission('viewer',
        'create:invoices')).toBe(false)
      expect(hasPermission('viewer',
        'create:karigars')).toBe(false)
      expect(hasPermission('viewer',
        'create:inventory')).toBe(false)
    })
  })

  describe('Role escalation prevention', () => {
    it('no role has more permissions than owner', () => {
      const ownerPerms = new Set(
        getRolePermissions('owner')
      )
      const roles = [
        'manager', 'accountant',
        'supervisor', 'viewer'
      ] as const

      roles.forEach(role => {
        const rolePerms = getRolePermissions(role)
        rolePerms.forEach(perm => {
          expect(ownerPerms.has(perm)).toBe(true)
        })
      })
    })
  })
})
