# Noxis v13.0 — Production Release Checklist
**Status:** [ ] Draft | [ ] Verified | [ ] Production Ready
**Version:** v13.0.0
**Target OS:** Windows 10/11 x64, Linux (Ubuntu 22.04+), Android 11+, iOS 15+

## 1.Infrastructure & Deployment
- **Supabase Pro/Team:** Active subscription confirmed with daily backups and PITR enabled.
- [ ] **Environment Variables:** All 20+ production secrets verified in Supabase Dashboard (WATI_TOKEN, JAZZCASH_PASS, etc).
- [ ] **Code Signing:** Windows .exe signed with valid certificate (OV/EV recommended for zero-warning install).
- [ ] **Uptime Monitoring:** Heartbeat active on `UptimeRobot` / `BetterUptime` with SMS alerts for Hub downtime.
- [ ] **Error Tracking:** Sentry initialized in both Hub and Mobile; project environments set to `production`.

## 2. Database & Data Integrity
- [ ] **Migration Audit:** All migrations `001` through `020` applied sequentially without errors.
- [ ] **RLS Coverage:** `SELECT count(*) FROM pg_tables WHERE schemaname='public' AND rowsecurity=false` returns `0`.
- [ ] **Integrity Checks:** `check_trial_balance_integrity()` returns `is_balanced=true`.
- [ ] **Immutability:** `ledger_entries` cannot be updated or deleted after status is `posted`.
- [ ] **Backup Verification:** Local `./backups` folder contains a valid `.db` file from the last 24 hours.

## 3. Communication & Security
- [ ] **NSP Protocol:** `shared.proto` verified identical on Hub and Mobile.
- [ ] **Encryption:** AES-256-GCM handshake verified; mobile can decrypt Hub tactical messages.
- [ ] **Guardian Auth:** HMAC-SHA256 signature logic verified bit-perfect for remote authorization.
- [ ] **Tier Gating:** Hub rejects node connections exceeding the license tier limit (Start=3, Pro=15, Elite=70).
- [ ] **Masking:** Sensitive fields (CNIC, Buyer Phone) masked in non-admin views.

## 4. Operational Smoke Test (Per SMOKE_TEST.md)
- [ ] **Lifecycle:** Purchase License → Key Activation → Hub Online.
- [ ] **Pairing:** QR Scan → Device Auth → Real-time Sync active.
- [ ] **Fintech:** Invoice → Customer Portal Payment → Ledger Auto-Post.
- [ ] **Sentinel:** CCTV Breach → High-speed Hub Alert → Mobile Push Notification → HMAC ACK.
- [ ] **Automation:** Daily Sales Report sent to WhatsApp at 08:00 local time.
- [ ] **Karigar:** Attendance → Piece-rate Production → Payslip Generation → WhatsApp Link.

## 5. Performance (Per PERFORMANCE_BASELINE.md)
- [ ] **Hub Loading:** Stock table (10k rows) renders under 200ms.
- [ ] **Mobile Speed:** Cold start to dashboard under 3 seconds.
- [ ] **Connectivity:** Messaging latency under 100ms on stable factory WiFi.

---
**Verified By:** _________________________  **Date:** 2026-05-03
**Signature:** _________________________

