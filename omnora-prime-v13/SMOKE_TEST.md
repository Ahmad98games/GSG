# Noxis v13.0 — Comprehensive Smoke Test
**Revision:** v13.0-FINAL
**Scope:** End-to-End System Validation (PC + Mobile + IoT)

## Phase 1: Core Hub & Activation
1. **License Activation**: Purchase a 'Pro' license on the portal. Enter key into Hub. Verify 'Pro' features (CCTV AI, Multi-branch) unlock.
2. **First Launch**: App opens under 5s on cold boot. No blank screens.
3. **Onboarding**: Complete the wizard. Verify correct Persona (e.g., Textile/South Asia) is applied.

## Phase 2: Mesh Connectivity (NSP Protocol)
4. **QR Pairing**: Scan Hub QR with Mobile. Verify secure handshake (HMAC signed).
5. **Real-time Heartbeat**: Disconnect Mobile WiFi. Verify Hub dashboard shows 'Node Offline' within 30s. Reconnect and verify recovery.
6. **Tactical Messaging**: Send a message from Hub to Mobile. Verify AES-256-GCM encryption works (message is readable on mobile, encrypted in DB).

## Phase 3: Fintech & Ledger
7. **Invoice Generation**: Create a Sales Invoice. Verify Party balance updates automatically.
8. **Client Portal**: Customer logs in via OTP. Views invoice PDF. Pays via JazzCash (Sandbox).
9. **Ledger Immutability**: Attempt to delete a 'posted' ledger entry via direct SQL. Verify it fails due to rule `no_delete_ledger`.
10. **Trial Balance**: Run `audit_system_integrity()`. Verify result is `is_balanced: true`.

## Phase 4: Sentinel AI Security
11. **Detection Alert**: Simulate a 'Person' in a restricted zone. Verify Hub triggers audio alarm.
12. **Mobile Escalation**: Verify Mobile receives high-priority notification with thumbnail.
13. **HMAC Ack**: Acknowledge alert on Mobile. Verify Hub marks alert as 'Silenced' with the authorized Node ID.

## Phase 5: Persona Engine (Localization)
14. **Terminology**: Switch to 'International Warehouse' persona. Verify "Karigar" becomes "Operative" globally.
15. **Currency**: Verify amounts display as `$ 12,500.00` for Intl and `Rs. 1,25,000.00` for SA.
16. **Date Format**: Verify dates show as `MM/DD/YYYY` for US-based profiles.

## Phase 6: Webhooks & External
17. **Webhook Dispatch**: Create an invoice. Verify configured n8n/Zapier endpoint receives a signed HMAC payload.
18. **WhatsApp Report**: Trigger manual report send. Verify WhatsApp Business API (or fallback link) generates the correct data summary.

---
**Total Scenarios:** 18 Critical Paths
**Acceptance Criteria:** 100% Pass Rate with no unhandled exceptions in Sentry.

