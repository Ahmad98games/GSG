import { NextResponse } from 'next/server'

/**
 * GET /api/docs
 * Returns the complete OpenAPI 3.0 specification for Noxis Hub.
 * Import this URL into Postman, Swagger UI, or Insomnia for full interactive docs.
 */

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Noxis Hub API',
    version: '13.0.0',
    description: `
Noxis Hub is an **offline-first industrial ERP** for manufacturing businesses in Pakistan, UAE, Saudi Arabia, and Bangladesh.

The API is consumed internally by the Electron desktop client, mobile bridge (TCP mesh), and the public client portal. Endpoints are served by a standalone Next.js server embedded inside the Electron process on \`127.0.0.1\`.

---

### Authentication

Most endpoints require a **Supabase JWT session token**:

\`\`\`
Authorization: Bearer <supabase-jwt-token>
\`\`\`

Admin endpoints use a separate short-lived **HttpOnly cookie** token (\`noxis_admin_token\`) issued by \`POST /api/admin/login\`.

Internal machine-to-machine calls use \`x-internal-bypass-key\` header set to the service role key.

---

### Offline-First Architecture

- All write operations are queued to a local **SQLite** database first.
- The \`/api/internal/sync\` endpoint drains the queue to **Supabase** cloud every 30 seconds.
- If Supabase is unreachable, the app continues fully functional using local data.
- The license validation system returns \`503\` (not \`404\`) on network errors, so the client keeps the cached license active.

---

### Security Features

- **Nonce-based replay prevention** on all mutation endpoints
- **IP-based lockout** on admin login (5 attempts → 15-minute ban)
- **Rate limiting** on portal generation (10 links/hour per user, 3 active per party)
- **Business ownership verification** on all data access routes
- **HttpOnly cookies** for admin tokens (immune to XSS)
    `.trim(),
    contact: {
      name: 'Omnora Labs Support',
      url: 'https://noxishub.app',
      email: 'support@noxishub.app',
    },
    license: {
      name: 'Proprietary — All Rights Reserved',
      url: 'https://noxishub.app/terms',
    },
  },

  servers: [
    {
      url: 'http://127.0.0.1:3000/api',
      description: 'Local Electron Hub server (desktop app)',
    },
    {
      url: 'https://noxishub.app/api',
      description: 'Production cloud server',
    },
  ],

  tags: [
    { name: 'License', description: 'License activation, revalidation, and tiering' },
    { name: 'Settings', description: 'Local SQLite config read/write and business profile sync' },
    { name: 'Portal', description: 'Client portal link generation, verification, and revocation' },
    { name: 'Hub', description: 'Connected device management and hub info' },
    { name: 'Sync', description: 'SQLite-to-Supabase cloud sync queue management' },
    { name: 'Admin', description: 'Admin panel authentication and audit logs' },
    { name: 'Cron', description: 'Scheduled background job triggers' },
    { name: 'Messaging', description: 'WhatsApp/SMS notification dispatch' },
    { name: 'Webhooks', description: 'Payment gateway incoming webhooks (Stripe, JazzCash, Easypaisa)' },
    { name: 'Sentinel', description: 'CCTV recording event notifications' },
    { name: 'Diagnostics', description: 'System health checks' },
    { name: 'Stock', description: 'Inventory SKU data and movement history' },
    { name: 'Staff', description: 'Staff invitation and onboarding' },
  ],

  paths: {

    '/license/activate': {
      post: {
        tags: ['License'],
        summary: 'Activate or revalidate a license key',
        description: 'Validates a license key against Supabase, records device fingerprint, and returns the license tier and permissions.\n\n**Offline behavior**: If the database is unreachable, returns `503` (not `404`). The client treats `503` as transient and keeps the cached license — the user is NOT locked out.\n\n**Auto-detect mode**: Pass `autoDetect: true` with `email` to look up by customer email instead of key.\n\n**Nonce**: Required on every request (32 hex chars) to prevent replay attacks.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  licenseKey: { type: 'string', example: 'K7M2-9XP4-R3N8', description: 'License key (XXXX-XXXX-XXXX format). Omit when autoDetect is true.' },
                  email: { type: 'string', format: 'email', description: 'Customer email for auto-detect lookup.' },
                  autoDetect: { type: 'boolean', default: false },
                  machineInfo: {
                    type: 'object',
                    description: 'Device fingerprint (non-PII)',
                    properties: {
                      platform: { type: 'string', example: 'Win32' },
                      timezone: { type: 'string', example: 'Asia/Karachi' },
                      language: { type: 'string', example: 'en-US' },
                      revalidation: { type: 'boolean' },
                    },
                  },
                  appVersion: { type: 'string', example: '13.0.0' },
                  nonce: { type: 'string', example: 'a3f2c1d4e5b60000000000000000000000', description: 'One-time nonce. Generate with crypto.getRandomValues.' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'License activated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    license: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        key: { type: 'string' },
                        tier: { type: 'string', enum: ['lite', 'pro', 'elite', 'trial'] },
                        customerName: { type: 'string' },
                        expiresAt: { type: 'string', format: 'date-time', nullable: true },
                        maxDevices: { type: 'integer' },
                        isTrialActive: { type: 'boolean' },
                        trialDaysRemaining: { type: 'integer', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Duplicate nonce — request already processed' },
          '403': { description: 'License expired or administratively deactivated' },
          '404': { description: 'License key not found in database (genuine invalid key)' },
          '429': { description: 'Too many activation attempts from this IP' },
          '503': { description: 'Database unreachable — client should use cached license (offline mode)' },
        },
      },
    },

    '/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Read local SQLite configuration',
        description: 'Returns all key-value pairs from `local_config` table plus active TCP session count. Used for offline fallback profile loading. Accepts Supabase auth OR internal bypass key header.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'header', name: 'x-internal-bypass-key', schema: { type: 'string' }, description: 'Service-role key for machine-to-machine calls' },
        ],
        responses: {
          '200': {
            description: 'Local configuration',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    localConfig: {
                      type: 'array',
                      description: 'Key-value pairs: business_id, business_name, industry_type, country_code, currency, region, tax_name, tax_rate, preferred_locale, pairing_key, hub_pin_hash, tier',
                      items: {
                        type: 'object',
                        properties: {
                          key: { type: 'string' },
                          value: { type: 'string' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    sessionCount: { type: 'integer', example: 2 },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '500': { description: 'SQLite read error' },
        },
      },
      post: {
        tags: ['Settings'],
        summary: 'Write local config or sync business profile',
        description: 'Multiplex endpoint — `type` field selects operation:\n\n| type | Operation |\n|---|---|\n| `local_config` | Upserts key-value pairs into SQLite |\n| `business_profile` | Updates Supabase business_profiles row |\n| `regenerate_pairing_key` | Generates new 32-byte hex pairing key |\n| `update_pin` | Hashes new Hub PIN (SHA-256) and stores locally |',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string', enum: ['local_config', 'business_profile', 'regenerate_pairing_key', 'update_pin'] },
                  data: { type: 'object', description: 'Payload varies by type. For update_pin: { newPin: string }.' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Success. regenerate_pairing_key returns { pairingKey: string }.' },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Write error' },
        },
      },
    },

    '/portal/generate': {
      post: {
        tags: ['Portal'],
        summary: 'Generate a client portal access link',
        description: 'Creates a time-limited JWT portal token for a party (customer/supplier).\n\n**Limits**: 10 links/hour per user; max 3 active links per party.\n\nThe returned `url` grants the client read-only access to their invoices, balance, and payment history — no login required.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['partyId', 'nonce'],
                properties: {
                  partyId: { type: 'string', format: 'uuid' },
                  expiryDays: { type: 'integer', default: 30, minimum: 1, maximum: 365 },
                  nonce: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Portal token generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    token: { type: 'string' },
                    url: { type: 'string', example: 'https://noxishub.app/portal?t=eyJhbGc...' },
                    expiresAt: { type: 'string', format: 'date-time' },
                    partyName: { type: 'string' },
                    businessName: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { description: 'Missing partyId, duplicate nonce, or party already has 3 active links' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Party or business not found' },
          '429': { description: 'Rate limit exceeded (10 links/hour)' },
        },
      },
    },

    '/portal/verify': {
      get: {
        tags: ['Portal'],
        summary: 'Verify portal token and fetch party data',
        description: 'Public endpoint used by the portal page. Verifies JWT signature, checks DB record, returns business info, party balance, and last 10 invoices. The token IS the credential — no auth header required.',
        parameters: [
          { in: 'query', name: 'token', required: true, schema: { type: 'string' }, description: 'Portal JWT token' },
        ],
        responses: {
          '200': {
            description: 'Portal data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    business: { type: 'object', properties: { business_name: { type: 'string' }, currency: { type: 'string', example: 'PKR' }, logo_url: { type: 'string', nullable: true } } },
                    party: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, current_balance: { type: 'number' } } },
                    summary: { type: 'object', properties: { totalInvoiced: { type: 'number' }, totalPaid: { type: 'number' }, outstanding: { type: 'number' }, invoiceCount: { type: 'integer' } } },
                    invoices: { type: 'array', items: { type: 'object', properties: { invoice_no: { type: 'string' }, total: { type: 'number' }, balance_due: { type: 'number' }, status: { type: 'string', enum: ['draft', 'sent', 'partial', 'paid', 'overdue'] } } } },
                  },
                },
              },
            },
          },
          '400': { description: 'Token parameter missing' },
          '401': { description: 'Invalid, expired, or revoked token' },
          '404': { description: 'Party not found' },
        },
      },
    },

    '/portal/revoke': {
      post: {
        tags: ['Portal'],
        summary: 'Revoke a portal access token',
        description: 'Immediately invalidates a portal token. Only the owning business can revoke.',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } } } } },
        responses: { '200': { description: 'Token revoked' }, '401': { description: 'Unauthorized' }, '404': { description: 'Business profile not found' } },
      },
    },

    '/portal/sessions': {
      get: {
        tags: ['Portal'],
        summary: 'List all active portal sessions',
        description: 'Returns all non-expired, non-revoked portal tokens for the authenticated business.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Active portal sessions',
            content: {
              'application/json': {
                schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, party_id: { type: 'string', format: 'uuid' }, expires_at: { type: 'string', format: 'date-time' }, is_revoked: { type: 'boolean' } } } },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/hub/devices': {
      get: {
        tags: ['Hub'],
        summary: 'List all authorized paired devices',
        description: 'Returns all non-revoked device records from local SQLite `authorized_devices`. Used by Settings → Connected Devices.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Authorized devices',
            content: {
              'application/json': {
                schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, device_name: { type: 'string' }, platform: { type: 'string' }, paired_at: { type: 'string', format: 'date-time' }, last_seen: { type: 'string', format: 'date-time' }, is_revoked: { type: 'integer', enum: [0, 1] } } } },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/hub/devices/revoke': {
      post: {
        tags: ['Hub'],
        summary: 'Revoke a paired mobile device',
        description: 'Marks a device as revoked in SQLite. The device will be rejected on its next TCP connection attempt.',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['deviceId'], properties: { deviceId: { type: 'string' } } } } } },
        responses: { '200': { description: 'Device revoked' }, '401': { description: 'Unauthorized' } },
      },
    },

    '/hub/info': {
      get: {
        tags: ['Hub'],
        summary: 'Get Hub discovery metadata',
        description: 'Public endpoint. Returns Hub name, version, and local IP used by mobile apps for LAN discovery and pairing.',
        responses: {
          '200': {
            description: 'Hub metadata',
            content: { 'application/json': { schema: { type: 'object', properties: { hubName: { type: 'string' }, version: { type: 'string' }, localIp: { type: 'string', example: '192.168.1.5' }, port: { type: 'integer', example: 3000 } } } } },
          },
        },
      },
    },

    '/internal/sync': {
      post: {
        tags: ['Sync'],
        summary: 'Drain sync queue to Supabase cloud',
        description: 'Processes all pending items in `sync_queue` and pushes to Supabase. Called every 30 seconds by the embedded server. Also callable manually from Settings → Data Sync.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Sync result',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, result: { type: 'object', properties: { synced: { type: 'integer' }, failed: { type: 'integer' } } }, stats: { type: 'object', properties: { pending: { type: 'integer' }, failed: { type: 'integer' } } } } } } },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      get: {
        tags: ['Sync'],
        summary: 'Get sync queue statistics',
        description: 'Returns pending and failed record counts without triggering a sync. Used by the UI status indicator.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Queue stats', content: { 'application/json': { schema: { type: 'object', properties: { stats: { type: 'object', properties: { pending: { type: 'integer' }, failed: { type: 'integer' } } } } } } } },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/sync/status': {
      get: {
        tags: ['Sync'],
        summary: 'Real-time sync status',
        description: 'Returns current sync state, last sync timestamp, and pending count. Used by the taskbar indicator.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Sync status',
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['synced', 'syncing', 'pending', 'error', 'offline'] }, lastSyncAt: { type: 'string', format: 'date-time', nullable: true }, pendingCount: { type: 'integer' } } } } },
          },
        },
      },
    },

    '/internal/backup': {
      post: {
        tags: ['Sync'],
        summary: 'Trigger local database backup',
        description: 'Copies the local SQLite file to the user data backup directory with a timestamp suffix.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Backup created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, backupPath: { type: 'string' }, sizeBytes: { type: 'integer' } } } } } },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/admin/login': {
      post: {
        tags: ['Admin'],
        summary: 'Admin panel authentication',
        description: 'Authenticates using server-side `ADMIN_PASSWORD` env var.\n\n**Security**: 5 failures → 15-min IP lockout. Success sets HttpOnly `noxis_admin_token` cookie (8h). All attempts logged to Supabase `admin_access_log`. Nonce required.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['password', 'nonce'], properties: { password: { type: 'string' }, nonce: { type: 'string' } } },
            },
          },
        },
        responses: {
          '200': { description: 'Authenticated — noxis_admin_token cookie set', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } } },
          '400': { description: 'Invalid body or duplicate nonce' },
          '401': { description: 'Wrong password', content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' }, attemptsRemaining: { type: 'integer' } } } } } },
          '429': { description: 'IP locked out' },
          '500': { description: 'ADMIN_PASSWORD not configured' },
        },
      },
    },

    '/admin/logout': {
      post: {
        tags: ['Admin'],
        summary: 'Admin panel logout',
        description: 'Clears the `noxis_admin_token` HttpOnly cookie.',
        responses: { '200': { description: 'Logged out' } },
      },
    },

    '/admin/logs': {
      get: {
        tags: ['Admin'],
        summary: 'Admin access audit log',
        description: 'Paginated admin access log entries. Requires valid admin cookie.',
        security: [{ adminCookie: [] }],
        parameters: [
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
          { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          '200': { description: 'Log entries', content: { 'application/json': { schema: { type: 'array', items: { type: 'object', properties: { event: { type: 'string', enum: ['login_success', 'login_failed'] }, ip_address: { type: 'string' }, attempt_count: { type: 'integer' }, locked: { type: 'boolean' }, created_at: { type: 'string', format: 'date-time' } } } } } } },
          '401': { description: 'Invalid or expired admin token' },
        },
      },
    },

    '/admin/activation-logs': {
      get: {
        tags: ['Admin'],
        summary: 'License activation audit log',
        description: 'All license activation events from Supabase `license_activation_log`.',
        security: [{ adminCookie: [] }],
        responses: {
          '200': { description: 'Activation events', content: { 'application/json': { schema: { type: 'array', items: { type: 'object', properties: { key_attempted: { type: 'string' }, event: { type: 'string', enum: ['key_not_found', 'activated', 'revalidated', 'expired', 'deactivated'] }, machine_info: { type: 'object' }, app_version: { type: 'string' }, created_at: { type: 'string', format: 'date-time' } } } } } } },
          '401': { description: 'Invalid or expired admin token' },
        },
      },
    },

    '/cron/daily-summary': {
      post: {
        tags: ['Cron'],
        summary: 'Trigger daily WhatsApp business summary',
        description: 'Compiles revenue, production, low-stock, overdue, attendance, and cashflow data and sends to configured WhatsApp numbers.',
        responses: { '200': { description: 'Summary sent' }, '500': { description: 'Generation or delivery failed' } },
      },
    },

    '/cron/recurring-invoices': {
      post: {
        tags: ['Cron'],
        summary: 'Process recurring invoice generation',
        description: 'Scans for invoices with `recurrence_type` set and due today, then auto-generates the next invoice in the series.',
        responses: { '200': { description: 'Recurring invoices processed' }, '500': { description: 'Processing failed' } },
      },
    },

    '/messaging': {
      post: {
        tags: ['Messaging'],
        summary: 'Send a WhatsApp message',
        description: 'Dispatches a message via the configured WhatsApp bridge. Supports template-based messages with dynamic variables.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['to', 'message'], properties: { to: { type: 'string', example: '+923001234567' }, message: { type: 'string' }, template: { type: 'string' }, variables: { type: 'object' } } },
            },
          },
        },
        responses: { '200': { description: 'Message dispatched' }, '401': { description: 'Unauthorized' }, '503': { description: 'Bridge not connected' } },
      },
    },

    '/messaging/events': {
      get: {
        tags: ['Messaging'],
        summary: 'SSE stream for bridge events',
        description: 'Server-Sent Events stream for incoming WhatsApp messages and bridge status changes. Keep connection open for live updates.',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'SSE stream (text/event-stream)', content: { 'text/event-stream': { schema: { type: 'string' } } } } },
      },
    },

    '/webhooks/stripe': {
      post: {
        tags: ['Webhooks'],
        summary: 'Stripe payment webhook',
        description: 'Receives Stripe payment events. Validates `Stripe-Signature` header then updates invoice payment status.',
        parameters: [{ in: 'header', name: 'stripe-signature', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Processed' }, '400': { description: 'Invalid signature' } },
      },
    },

    '/webhooks/jazzcash': {
      post: {
        tags: ['Webhooks'],
        summary: 'JazzCash payment webhook',
        description: 'Receives JazzCash payment confirmation callbacks and marks the corresponding invoice as paid.',
        requestBody: { required: true, content: { 'application/x-www-form-urlencoded': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Payment recorded' }, '400': { description: 'Invalid payload' } },
      },
    },

    '/webhooks/easypaisa': {
      post: {
        tags: ['Webhooks'],
        summary: 'Easypaisa payment webhook',
        description: 'Receives Easypaisa payment confirmation callbacks and marks the corresponding invoice as paid.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Payment recorded' }, '400': { description: 'Invalid payload' } },
      },
    },

    '/sentinel/recording-started': {
      post: {
        tags: ['Sentinel'],
        summary: 'Notify Hub that a CCTV recording started',
        description: 'Called by Sentinel when motion-triggered or scheduled recording begins. Logs event and optionally sends a WhatsApp alert.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { cameraId: { type: 'string' }, cameraName: { type: 'string' }, trigger: { type: 'string', enum: ['motion', 'schedule', 'manual'] }, startedAt: { type: 'string', format: 'date-time' } } },
            },
          },
        },
        responses: { '200': { description: 'Logged' }, '401': { description: 'Unauthorized' } },
      },
    },

    '/sentinel/recording-complete': {
      post: {
        tags: ['Sentinel'],
        summary: 'Notify Hub that a CCTV recording finished',
        description: 'Stores clip metadata (duration, file size, path) in the local database.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { cameraId: { type: 'string' }, startedAt: { type: 'string', format: 'date-time' }, endedAt: { type: 'string', format: 'date-time' }, durationSeconds: { type: 'integer' }, filePath: { type: 'string' }, sizeBytes: { type: 'integer' } } },
            },
          },
        },
        responses: { '200': { description: 'Metadata saved' }, '401': { description: 'Unauthorized' } },
      },
    },

    '/diagnostics': {
      get: {
        tags: ['Diagnostics'],
        summary: 'Full system health check',
        description: 'Parallel health checks across: Supabase (query latency), SQLite (read test), sync queue (pending count), TCP sessions (online devices), and required env vars.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Health report',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    supabase: { '$ref': '#/components/schemas/HealthStatus' },
                    sqlite: { '$ref': '#/components/schemas/HealthStatus' },
                    sync: { '$ref': '#/components/schemas/HealthStatus' },
                    tcp: { '$ref': '#/components/schemas/HealthStatus' },
                    storage: { '$ref': '#/components/schemas/HealthStatus' },
                    env: { type: 'object', properties: { status: { type: 'string' }, detail: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, status: { type: 'string', enum: ['SET', 'MISSING'] } } } } } },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/stock/{skuId}': {
      get: {
        tags: ['Stock'],
        summary: 'Get SKU details and movement history',
        description: 'Returns full SKU data, last 50 transfer logs, and basic inventory velocity analytics. Verifies business ownership before returning data.',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'skuId', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'SKU with movements and stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sku: { type: 'object', description: 'Full SKU record' },
                    movements: { type: 'array', description: 'Last 50 transfer logs', items: { type: 'object' } },
                    stats: { type: 'object', properties: { avgMonthlyThroughput: { type: 'number' }, last30DaysSales: { type: 'number' }, velocityRank: { type: 'string', enum: ['A', 'B', 'C'] } } },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — SKU belongs to different business' },
          '404': { description: 'SKU not found' },
        },
      },
    },

    '/staff/invite': {
      post: {
        tags: ['Staff'],
        summary: 'Invite a staff member',
        description: 'Sends an invitation email via Supabase Auth. Creates a pending invite record. The invitee receives a link to set their password and join the business.',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'role'], properties: { email: { type: 'string', format: 'email' }, role: { type: 'string', enum: ['manager', 'operator', 'viewer', 'accountant'] }, name: { type: 'string' } } } } } },
        responses: { '200': { description: 'Invitation sent' }, '400': { description: 'Invalid email or role' }, '401': { description: 'Unauthorized' }, '409': { description: 'User already invited or registered' } },
      },
    },

    '/heartbeat': {
      get: {
        tags: ['Diagnostics'],
        summary: 'Liveness probe',
        description: 'Returns 200 immediately. Used by the Electron main process to check if Next.js is ready before showing the BrowserWindow.',
        responses: { '200': { description: 'Alive', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean', example: true } } } } } } },
      },
    },

    '/startup': {
      get: {
        tags: ['Diagnostics'],
        summary: 'Startup initialization',
        description: 'Called once on Electron boot. Initializes SQLite tables if missing and returns current Hub configuration.',
        responses: { '200': { description: 'Startup config returned' }, '500': { description: 'Critical initialization failure' } },
      },
    },

    '/download': {
      get: {
        tags: ['Diagnostics'],
        summary: 'Get latest installer download URL',
        description: 'Returns the GitHub Releases URL for the latest Noxis Hub Windows installer.',
        responses: { '200': { description: 'Download URL', content: { 'application/json': { schema: { type: 'object', properties: { url: { type: 'string' }, version: { type: 'string' } } } } } } },
      },
    },

    '/docs': {
      get: {
        tags: ['Diagnostics'],
        summary: 'OpenAPI 3.0 specification (this document)',
        description: 'Returns this spec. Import into Postman, Swagger UI, or Insomnia.',
        responses: { '200': { description: 'OpenAPI JSON spec', content: { 'application/json': { schema: { type: 'object' } } } } },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase session JWT. Obtain via supabase.auth.getSession() on the client.',
      },
      adminCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'noxis_admin_token',
        description: 'HttpOnly admin token set by POST /api/admin/login. Valid for 8 hours.',
      },
    },
    schemas: {
      HealthStatus: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['online', 'offline', 'warning', 'loading'] },
          detail: { type: 'string', description: 'Human-readable detail or error message' },
        },
      },
    },
  },
}

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  })
}
