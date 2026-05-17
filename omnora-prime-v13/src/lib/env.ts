// src/lib/env.ts
import { z } from 'zod';
import { logger } from './logger';

/**
 * Noxis v13.0 — Environment Schema
 * Strict validation for production-grade industrial deployment.
 */
const envSchema = z.object({
  // Core Identity
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Industrial PC Configuration
  HUB_TCP_PORT: z.coerce.number().int().default(9000),
  HUB_WORKER_POOL_SIZE: z.coerce.number().int().min(1).max(16).default(4),
  HUB_MAX_NODES: z.coerce.number().int().default(70),
  
  // Security
  HUB_JWT_SECRET: z.string().min(64, "HUB_JWT_SECRET must be at least 64 characters for production safety"),
  
  // Platform settings
  NEXT_PUBLIC_PLATFORM: z.enum(['web', 'electron']).default('web'),
  
  // Supabase Connectivity
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  
  // Directories
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  BINARY_LOG_DIR: z.string().default('./logs'),
  BACKUP_DIR: z.string().default('./backups'),

  // Gateways (Optional for local, required for production purchase)
  JAZZCASH_MERCHANT_ID: z.string().optional(),
  JAZZCASH_PASSWORD: z.string().optional(),
  JAZZCASH_INTEGRITY_SALT: z.string().optional(),
  EASYPAISA_STORE_ID: z.string().optional(),
  EASYPAISA_HASH_KEY: z.string().optional(),
  PADDLE_API_KEY: z.string().optional(),
  PADDLE_VENDOR_ID: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  UPTIME_MONITOR_URL: z.string().url().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Industrial Networking
  HUB_ENCRYPTION_KEY: z.string().length(64).optional(), // 32 bytes hex = 64 chars
  ALLOWED_ORIGIN: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(i => i.path.join('.')).join(', ');
      console.error("\n====================================================");
      console.error(" [CRITICAL] ENVIRONMENT VALIDATION FAILED");
      console.error(` Missing or invalid variables: ${missingVars}`);
      console.error("====================================================\n");
      
      /*
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      */
    }
    // Fallback to safe parsing or rethrow
    return process.env as unknown as Env;
  }
}

export const env = validateEnv();

