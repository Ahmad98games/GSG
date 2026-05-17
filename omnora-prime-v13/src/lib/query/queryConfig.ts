/**
 * Noxis v13.0 — TanStack Query Configuration
 * Performance-tuned stale times for industrial workloads.
 */

export const STALE = {
  REALTIME: 0,
  FAST: 1000 * 5,           // 5s: CCTV node health
  STANDARD: 1000 * 30,       // 30s: Stock/Inventory deltas
  MEDIUM: 1000 * 60 * 2,     // 2m: Party balances
  SLOW: 1000 * 60 * 10,      // 10m: Supplier scorecards
  EXTENDED: 1000 * 60 * 15,  // 15m: Financial statements (P&L)
  REFERENCE: 1000 * 60 * 60, // 1h: Karigar grades/Static data
  IMMUTABLE: Infinity,       // Locked periods/Audit logs
} as const;

