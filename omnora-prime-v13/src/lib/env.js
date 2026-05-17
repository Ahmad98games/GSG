"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
// src/lib/env.ts
const zod_1 = require("zod");
/**
 * Noxis v13.0 — Environment Schema
 * Strict validation for production-grade industrial deployment.
 */
const envSchema = zod_1.z.object({
    // Core Identity
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    // Industrial PC Configuration
    HUB_TCP_PORT: zod_1.z.coerce.number().int().default(9000),
    HUB_WORKER_POOL_SIZE: zod_1.z.coerce.number().int().min(1).max(16).default(4),
    HUB_MAX_NODES: zod_1.z.coerce.number().int().default(70),
    // Security
    HUB_JWT_SECRET: zod_1.z.string().min(64, "HUB_JWT_SECRET must be at least 64 characters for production safety"),
    // Platform settings
    NEXT_PUBLIC_PLATFORM: zod_1.z.enum(['web', 'electron']).default('web'),
    // Supabase Connectivity
    NEXT_PUBLIC_SUPABASE_URL: zod_1.z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: zod_1.z.string(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string(),
    // Directories
    LOG_LEVEL: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    BINARY_LOG_DIR: zod_1.z.string().default('./logs'),
    BACKUP_DIR: zod_1.z.string().default('./backups'),
    // Gateways (Optional for local, required for production purchase)
    JAZZCASH_MERCHANT_ID: zod_1.z.string().optional(),
    JAZZCASH_PASSWORD: zod_1.z.string().optional(),
    JAZZCASH_INTEGRITY_SALT: zod_1.z.string().optional(),
    EASYPAISA_STORE_ID: zod_1.z.string().optional(),
    EASYPAISA_HASH_KEY: zod_1.z.string().optional(),
    PADDLE_API_KEY: zod_1.z.string().optional(),
    PADDLE_VENDOR_ID: zod_1.z.string().optional(),
    // Monitoring
    SENTRY_DSN: zod_1.z.string().url().optional(),
    UPTIME_MONITOR_URL: zod_1.z.string().url().optional(),
    // Stripe
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    // Industrial Networking
    HUB_ENCRYPTION_KEY: zod_1.z.string().length(64).optional(), // 32 bytes hex = 64 chars
    ALLOWED_ORIGIN: zod_1.z.string().optional(),
});
function validateEnv() {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missingVars = error.issues.map(i => i.path.join('.')).join(', ');
            console.error("\n====================================================");
            console.error(" [CRITICAL] ENVIRONMENT VALIDATION FAILED");
            console.error(` Missing or invalid variables: ${missingVars}`);
            console.error("====================================================\n");
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        }
        // Fallback to safe parsing or rethrow
        return process.env;
    }
}
exports.env = validateEnv();
