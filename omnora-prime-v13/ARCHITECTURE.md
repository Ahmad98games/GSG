# Noxis Hub — System Architecture

**Version**: 13.0.0  
**Last Updated**: 2026-07-13  
**Author**: Omnora Labs

---

## Overview

Noxis Hub is an offline-first industrial ERP for manufacturing businesses in Pakistan and UAE. It operates on a hub-and-spoke architecture where a Windows desktop application (the Hub) serves as the central data node for connected mobile devices.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│                FACTORY NETWORK              │
│                                             │
│  ┌──────────────┐    WiFi    ┌───────────┐  │
│  │  Noxis Hub   │◄──────────►│  Mobile   │  │
│  │  (Windows)   │  WebSocket │  Devices  │  │
│  │              │  :3000     │  (5-50)   │  │
│  │  Next.js     │            │           │  │
│  │  Electron    │            │  Android  │  │
│  │  SQLite      │            │  PWA/APK  │  │
│  └──────┬───────┘            └───────────┘  │
│         │                                   │
└─────────┼───────────────────────────────────┘
          │ Internet (when available)
          ▼
┌─────────────────────┐    ┌──────────────────┐
│   Supabase Cloud    │    │  Cloudflare      │
│                     │    │                  │
│  PostgreSQL DB      │    │  Pages (website) │
│  Auth (JWT)         │    │  R2 (file store) │
│  Realtime WS        │    │  DNS/CDN         │
│  Edge Functions     │    │                  │
└─────────────────────┘    └──────────────────┘
```

---

## Technology Stack

### Hub (PC Desktop)

| Component | Technology | Version |
|-----------|-----------|---------|
| UI Framework | Next.js | 16.x |
| Desktop Shell | Electron | 33.x |
| Local Database | SQLite (SQLCipher) | 5.x |
| State Management | Zustand + React Query | 5.x |
| Styling | Tailwind CSS | 3.x |
| Build Tool | Turbopack | Latest |
| Installer | NSIS via electron-builder | 24.x |

### Mobile

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Expo + React Native | SDK 51 |
| Navigation | Expo Router | 3.x |
| State | Zustand (persisted) | 4.x |
| Offline Queue | AsyncStorage | 1.x |
| Notifications | Notifee | 9.x |
| PWA Export | Expo Web | Metro |

### Cloud Infrastructure

| Service | Purpose | Provider |
|---------|---------|---------|
| Database | PostgreSQL with RLS | Supabase |
| Authentication | JWT + Row Level Security | Supabase |
| File Storage | APK/EXE distribution | Cloudflare R2 |
| Website/PWA | Static hosting + CDN | Cloudflare Pages |
| DNS | Domain management | Cloudflare |

---

## Data Architecture

### Local Database (SQLite — per Hub installation)

All business data is stored locally first.  
Encryption: SQLCipher with per-device key.

**Core tables**: `business_profiles`, `invoices`, `invoice_items`, `parties`, `karigars`, `skus`, `attendance_logs`, `karigar_production_logs`, `ledger_entries`, `payroll_runs`, `dispatch_orders`, `purchase_orders`, `portal_sessions`, `sub_users`, `audit_logs`, `sync_queue`

### Cloud Database (Supabase PostgreSQL)

All tables have Row Level Security (RLS) enabled. Policies enforce strict `business_id` isolation — no tenant can access another tenant's data.

### Sync Strategy

1. **Hub writes**: Local SQLite first → `sync_queue` → cloud sync worker drains every 30 seconds → Supabase
2. **Mobile writes**: Direct to Supabase → WebSocket notification to Hub UI

---

## Security Architecture

### Authentication Layers

1. **License key**: HMAC-validated, device fingerprinted, replay-attack protected
2. **Supabase JWT**: Session token for all cloud operations
3. **Admin panel**: HMAC-signed HttpOnly cookies, IP-based lockout, obfuscated path
4. **Portal tokens**: Time-limited, revocable, server-validated (no client-side auth)
5. **RBAC**: 5 preset roles with permission gates on every sensitive data point

### Data Security

- Local SQLite encrypted with SQLCipher
- All cloud data protected by Supabase RLS
- HTTPS/TLS for all cloud communication
- WebSocket bridge uses local LAN only
- No telemetry or analytics on user data

---

## Scaling Architecture

### Current Capacity (Supabase Free Tier)

- Up to ~200 concurrent active businesses
- 500MB database storage
- 2GB bandwidth/month

### Scale Path

| Users | Action | Monthly Cost |
|-------|--------|-------------|
| 200 | Supabase Pro | $25 |
| 2,000 | Supabase Pro | $25 |
| 10,000 | Supabase Team | $599 |

> **Note**: Hub computation runs on the customer's own hardware. Server load is minimal — only sync and authentication calls hit Supabase. The architecture inherently scales with customer hardware.

---

## Industry Vertical Support

Noxis morphs its entire interface based on the selected industry:

| Industry | Workers Term | Items Term | Key Feature |
|----------|-------------|------------|-------------|
| Textile | Karigar | Fabric | Piece rate wages |
| Rice Mill | Mazdoor | Rice/Paddy | Yield tracking |
| Medical | Pharmacist | Medicine | Expiry alerts |
| Auto Parts | Mechanic | Part | VIN tracking |
| Garment | Karigar | Garment | Size variants |
| Food | Worker | Ingredient | Cold chain |
| General | Employee | Item | Standard ERP |

---

## API Reference

Interactive API documentation available at:

```
GET /api/docs
```

Returns a complete OpenAPI 3.0 specification covering all 32 routes. Import the URL directly into Postman, Swagger UI, or Insomnia.

**Base URL (local)**: `http://127.0.0.1:3000/api`  
**Base URL (web)**: `https://noxishub.app/api`

---

## Development Setup

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local development instructions.

**Minimum requirements**:
- Node.js 20+
- Windows 8.1+ (for Electron target)
- Supabase account (free tier sufficient)

---

## Deployment

**Hub (.exe)**: Built via electron-builder, distributed via Cloudflare R2.

**Website**: Auto-deployed from `main` branch via Cloudflare Pages.

**Mobile APK**: Built via local Gradle, distributed via Cloudflare R2.

**Mobile PWA**: Auto-deployed from `android-GSG` main branch via Cloudflare Pages.

---

## License

Proprietary — © 2026 Omnora Labs.  
All rights reserved.
