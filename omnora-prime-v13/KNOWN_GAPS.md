# KNOWN GAPS — Noxis Industrial Ecosystem v13.0

The following items were identified during the end-to-end trace of system flows.

## 1. Dedicated DB Connection for Node Context
- **Description**: The Hub currently uses a shared admin connection pool. The instruction to use a "dedicated database connection" for `set_config('app.branch_id', ...)` is simulated via an RPC call (`set_branch_context`).
- **Risk Level**: Medium (Potential race conditions if RLS relies on session-level variables without transaction isolation).
- **Estimated Effort**: High (Requires refactoring the DB client to manage a pool of persistent PostgreSQL connections mapped to Node IDs).
- **Workaround**: Use transaction-scoped variables or pass `branch_id` explicitly in all sensitive queries.

## 2. PinGuard UI Integration in branchStore
- **Description**: The `switchBranch` action in `branchStore.ts` assumes PIN verification has occurred or uses an AsyncStorage flag. The actual `PinGuard` UI component needs to be wired to trigger the store action upon success.
- **Risk Level**: Low (UI-only gap).
- **Estimated Effort**: Low (2-3 hours).
- **Workaround**: Call `branchStore.switchBranch` from the `onSuccess` callback of the `PinGuard` component.

## 3. Automated Purge of `processed_events`
- **Description**: The idempotency table `processed_events` requires a 24-hour cleanup cron job which is not yet implemented in `server.ts`.
- **Risk Level**: Low (Database bloating over time).
- **Estimated Effort**: Low (1 hour).
- **Workaround**: Manual `DELETE FROM processed_events WHERE expires_at < now()`.
## 4. Hub-to-Cloud Synchronization Worker
- **Description**: While NSP events are atomically persisted to the Hub's local SQLite (`ledger_entries`, `ai_detection_events`), a dedicated worker to synchronize these records to the Cloud PostgreSQL instance (Supabase) is missing. This prevents real-time updates on the Client Portal.
- **Risk Level**: High (Delayed visibility for off-site managers).
- **Estimated Effort**: Medium (1 day).
- **Workaround**: Implement a Drizzle-based "SyncEngine" on the Hub that polls the `sync_queue` and pushes to Supabase.

## 5. Global TanStack Query Client Reference
- **Description**: The `onBranchSwitchConfirmed` method in `branchStore.ts` needs to call `queryClient.invalidateQueries()` to force a refresh of all branch-scoped data. Currently, the `queryClient` is not exported as a global singleton.
- **Risk Level**: Medium (Stale data may persist in the UI after a branch switch until manual refresh).
- **Estimated Effort**: Low (1 hour).
- **Workaround**: Export a singleton `queryClient` from a new `src/lib/queryClient.ts` and import it into the store.
