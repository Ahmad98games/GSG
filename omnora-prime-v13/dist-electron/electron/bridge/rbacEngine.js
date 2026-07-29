"use strict";
/**
 * WebSocket Bridge RBAC Engine
 *
 * Defines per-role table access for mobile pairing.
 * Consumed by the WebSocket bridge server running in main.ts.
 *
 * Roles mirror the business_users table:
 *   owner | manager | accountant | supervisor | cashier
 *
 * allowedTables: mobile device is permitted to read/write
 * blockedTables: mobile device is explicitly denied
 * canWriteKhata: ledger entry write permission
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPolicyForRole = getPolicyForRole;
exports.buildHubAck = buildHubAck;
exports.canWriteKhata = canWriteKhata;
exports.canAccessTable = canAccessTable;
exports.normalizeRole = normalizeRole;
// ── Role → Policy Matrix ──────────────────────────────────────────────────────
const ROLE_POLICIES = {
    owner: {
        role: 'owner',
        allowedTables: [
            'attendance_logs',
            'karigar_production_logs',
            'peshgi_transactions',
            'invoices',
            'invoice_items',
            'ledger_entries',
            'parties',
            'skus',
            'purchase_orders',
            'purchase_order_items',
            'payments',
            'business_users',
        ],
        blockedTables: [],
        canViewKhata: true,
        canWriteKhata: true,
        canViewReports: true,
        canManageInventory: true,
        canCreateInvoice: true,
        canMarkAttendance: true,
        canLogProduction: true,
        canAddPeshgi: true,
    },
    manager: {
        role: 'manager',
        allowedTables: [
            'attendance_logs',
            'karigar_production_logs',
            'peshgi_transactions',
            'invoices',
            'invoice_items',
            'ledger_entries',
            'parties',
            'skus',
            'purchase_orders',
            'purchase_order_items',
            'payments',
        ],
        blockedTables: ['business_users'],
        canViewKhata: true,
        canWriteKhata: true,
        canViewReports: true,
        canManageInventory: true,
        canCreateInvoice: true,
        canMarkAttendance: true,
        canLogProduction: true,
        canAddPeshgi: true,
    },
    accountant: {
        role: 'accountant',
        allowedTables: [
            'invoices',
            'invoice_items',
            'ledger_entries',
            'parties',
            'payments',
            'purchase_orders',
        ],
        blockedTables: [
            'attendance_logs',
            'karigar_production_logs',
            'peshgi_transactions',
            'skus',
            'business_users',
        ],
        canViewKhata: true,
        canWriteKhata: true,
        canViewReports: true,
        canManageInventory: false,
        canCreateInvoice: true,
        canMarkAttendance: false,
        canLogProduction: false,
        canAddPeshgi: false,
    },
    supervisor: {
        role: 'supervisor',
        allowedTables: [
            'attendance_logs',
            'karigar_production_logs',
            'peshgi_transactions',
        ],
        blockedTables: [
            'ledger_entries',
            'invoices',
            'invoice_items',
            'parties',
            'skus',
            'purchase_orders',
            'payments',
            'business_users',
        ],
        canViewKhata: false,
        canWriteKhata: false,
        canViewReports: false,
        canManageInventory: false,
        canCreateInvoice: false,
        canMarkAttendance: true,
        canLogProduction: true,
        canAddPeshgi: true,
    },
    cashier: {
        role: 'cashier',
        allowedTables: [
            'invoices',
            'invoice_items',
            'parties',
            'payments',
        ],
        blockedTables: [
            'attendance_logs',
            'karigar_production_logs',
            'peshgi_transactions',
            'ledger_entries',
            'skus',
            'purchase_orders',
            'business_users',
        ],
        canViewKhata: false,
        canWriteKhata: false,
        canViewReports: false,
        canManageInventory: false,
        canCreateInvoice: true,
        canMarkAttendance: false,
        canLogProduction: false,
        canAddPeshgi: false,
    },
};
// ── Public API ────────────────────────────────────────────────────────────────
function getPolicyForRole(role) {
    return ROLE_POLICIES[role] || ROLE_POLICIES.cashier;
}
/**
 * Builds the HUB_ACK payload sent to a mobile client upon successful pairing.
 */
function buildHubAck(role, tierName, maxDevices) {
    const policy = getPolicyForRole(role);
    return {
        type: 'HUB_ACK',
        role,
        allowedTables: policy.allowedTables,
        blockedTables: policy.blockedTables,
        permissions: {
            canViewKhata: policy.canViewKhata,
            canWriteKhata: policy.canWriteKhata,
            canViewReports: policy.canViewReports,
            canManageInventory: policy.canManageInventory,
            canCreateInvoice: policy.canCreateInvoice,
            canMarkAttendance: policy.canMarkAttendance,
            canLogProduction: policy.canLogProduction,
            canAddPeshgi: policy.canAddPeshgi,
        },
        tierName,
        maxDevices,
        connectedAt: Date.now(),
    };
}
/**
 * Validates that a mobile role has khata write permission.
 */
function canWriteKhata(role) {
    return getPolicyForRole(role).canWriteKhata;
}
/**
 * Validates that a mobile role can access a specific table.
 */
function canAccessTable(role, table) {
    const policy = getPolicyForRole(role);
    if (policy.blockedTables.includes(table))
        return false;
    if (policy.allowedTables.includes(table))
        return true;
    return false;
}
/**
 * Normalizes a raw role string from SQLite, falls back to 'cashier'.
 */
function normalizeRole(raw) {
    const valid = ['owner', 'manager', 'accountant', 'supervisor', 'cashier'];
    const lower = (raw || '').toLowerCase();
    return valid.includes(lower) ? lower : 'cashier';
}
