/**
 * Noxis v13.0 — Query Key Factory
 */

export const QUERY_KEYS = {
  stock: {
    all: (bizId: string) => ['stock', bizId] as const,
    item: (bizId: string, skuId: string) => ['stock', bizId, skuId] as const,
    low: (bizId: string) => ['stock', bizId, 'low'] as const,
  },
  ledger: {
    entries: (bizId: string, filters: object) => ['ledger', bizId, filters] as const,
    balance: (bizId: string, acctId: string, from: string, to: string) => 
      ['ledger', bizId, 'balance', acctId, from, to] as const,
  },
  parties: {
    all: (bizId: string) => ['parties', bizId] as const,
    ledger: (partyId: string, from: string, to: string) => 
      ['parties', partyId, 'ledger', from, to] as const,
  },
  reports: {
    trialBalance: (bizId: string, from: string, to: string) => 
      ['reports', bizId, 'trial-balance', from, to] as const,
    pnl: (bizId: string, from: string, to: string) => 
      ['reports', bizId, 'pnl', from, to] as const,
    balanceSheet: (bizId: string, asAt: string) => 
      ['reports', bizId, 'balance-sheet', asAt] as const,
    taxReturn: (bizId: string, from: string, to: string) => 
      ['reports', bizId, 'tax', from, to] as const,
  },
  cctv: {
    nodes: (bizId: string) => ['cctv', bizId, 'nodes'] as const,
    events: (nodeId: string, from: string) => 
      ['cctv', 'events', nodeId, from] as const,
  },
  payroll: {
    periods: (bizId: string) => ['payroll', bizId, 'periods'] as const,
    slips: (periodId: string) => ['payroll', 'slips', periodId] as const,
  },
} as const;

