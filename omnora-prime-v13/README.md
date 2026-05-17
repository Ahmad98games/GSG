# Noxis
**The ERP-Operating System for High-Stakes Industrial Environments.**

Noxis is a distributed industrial ecosystem combining high-speed inventory tracking, accountant-grade fintech, and Sentinel security.

## 🚀 Key Modules
- **Fintech Core**: Double-entry ledger with immutable audit trails and automated trial balance.
- **Sentinel**: Real-time CCTV human/fire detection with HMAC-signed mobile escalation.
- **Persona Engine**: Adaptive terminology and localization (Lakh vs Million, Karigar vs Operative).
- **Industrial Mesh**: NSP (Noxis Synapse Protocol) for low-latency PC-to-Mobile communication.
- **Elite Automation**: WhatsApp Business API, automated FBR exports, and signed Webhooks.

## 🛠️ Setup & Installation

### 1. Requirements
- Node.js 20+
- Python 3.10+ (for Vision Engine)
- Supabase Project (Pro tier recommended for backups)
- Windows 10+ (for Hub) / Android 11+ (for Mobile)

### 2. Environment Configuration
Copy `.env.production.example` to `.env` and fill in:
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- `WIN_CERT_PATH` (for .exe signing)
- `SENTRY_DSN`
- `WATI_API_TOKEN` (for WhatsApp Elite)

### 3. Database Initialization
Run all migrations in `supabase/migrations/` sequentially (001 to 020). Ensure RLS is active on all tables.

### 4. Build & Deployment
```bash
# Install dependencies
npm install

# Build production Hub
./scripts/build-production.sh

# Install as Windows Service
./scripts/install-service.bat
```

## 📱 Mobile Pairing
1. Open Noxis on PC.
2. Navigate to **Settings > Authorized Devices**.
3. Scan the QR code with the Noxis Mobile app.
4. Verify HMAC handshake.

## 🛡️ Security Policy
- All industrial traffic is encrypted via **AES-256-GCM**.
- Critical actions require **Noxis Guardian** remote authorization.
- Ledger entries are **immutable** via database rules.

## 📞 Support
Industrial deployment requires an active license. For activation issues, contact: `support@noxis.app`

---
© 2024 NOXIS Labs. Built for the Factory Floor.

