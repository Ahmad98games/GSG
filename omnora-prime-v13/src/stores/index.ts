import { useBranchStore } from './branchStore';
import { useBusinessProfileStore } from '@/store/BusinessProfileStore';

/**
 * Global Store Reset Orchestrator
 * Ensures strict data isolation on shared industrial terminals.
 */
export const resetAllStores = () => {
  console.log('[Security] Purging all local stores...');
  
  // 1. Hub Core Stores
  useBranchStore.getState().reset();
  useBusinessProfileStore.getState().reset();

  // 2. Placeholder for upcoming industrial modules
  // licenseStore.getState().reset();
  // inventoryStore.getState().reset();
  // financialStore.getState().reset();
  // posStore.getState().reset();
  // cctvStore.getState().reset();

  console.log('[Security] Store purge complete.');
};

