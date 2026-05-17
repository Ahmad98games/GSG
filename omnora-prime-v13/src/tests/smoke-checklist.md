# Noxis v13.0 — Smoke Test Checklist
*Manual Pre-Deployment Verification Protocol*

## GROUP 1 — Environment Startup
- [ ] Hub starts without console errors in production build
- [ ] Electron window opens, splash screen shows and dismisses
- [ ] TCP server starts on configured port (check Pino log: 'tcp_server_started')
- [ ] SQLite local DB file created in correct Electron userData path
- [ ] Supabase connection established (check Pino log: 'supabase_connected')

## GROUP 2 — Mobile Pairing
- [ ] QR code displayed on Hub pairing screen
- [ ] Mobile app scans QR, mDNS resolves Hub IP
- [ ] TCP connection established (Hub log: 'node_connected')
- [ ] HeartbeatEvent received within 10 seconds of pairing
- [ ] BridgeStatusStore on mobile shows 'online'

## GROUP 3 — Core Financial Flow
- [ ] Create invoice → ledger entries created (debit AR, credit Sales)
- [ ] Post payment → ledger entries created (debit Cash, credit AR)
- [ ] Attempt to edit posted ledger entry → blocked
- [ ] Trial balance: total debits = total credits
- [ ] P&L statement loads without SQL error

## GROUP 4 — Branch Operations (Elite tier only)
- [ ] Branch switcher visible in top bar after Elite license applied
- [ ] Switching branches re-fetches all data tables
- [ ] SKU created in Branch-02 invisible when HQ context active
- [ ] Inter-branch transfer initiated → status 'in_transit'
- [ ] Transfer received → stock appears at destination branch
- [ ] Cannot archive HQ branch (error shown)

## GROUP 5 — Client Portal
- [ ] Invite sent to client email (check Supabase Auth logs)
- [ ] Magic link opens portal auth page
- [ ] Token verified → redirected to /portal/dashboard
- [ ] Invoice list shows correct outstanding balances
- [ ] PDF download returns signed URL (not 500)
- [ ] Stripe payment completes → ledger updated automatically
- [ ] Expired token shows "Session Expired" not 500 error

## GROUP 6 — Security Boundaries
- [ ] Business A user cannot see Business B data (test with two accounts)
- [ ] Portal client cannot navigate to /dashboard (redirected to portal auth)
- [ ] Hub user cannot navigate to /portal/dashboard (no portal cookie)
- [ ] CCTV feed not accessible without valid Hub session

## GROUP 7 — Offline Resilience
- [ ] Disconnect Supabase → Hub continues operating (local SQLite)
- [ ] Mobile scan while offline → queued in sync_queue
- [ ] Reconnect Supabase → sync_queue drains automatically
- [ ] StockLookupRequest answered from sku_cache without internet

