import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

/**
 * Validates incoming Bearer token against registered API keys
 */
export async function authenticateApiKey(req: NextRequest, requiredScope: string = 'read'): Promise<{ authenticated: boolean; error?: string; keyName?: string }> {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid Authorization header. Expected Bearer token.' };
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return { authenticated: false, error: 'Empty API key token' };
  }

  const sqlite = getSqliteInstance();
  if (!sqlite) {
    return { authenticated: false, error: 'Local database unavailable' };
  }

  try {
    const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='api_keys'").get();
    if (!tableExists) {
      return { authenticated: false, error: 'API Keys system not initialized' };
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const prefix = token.slice(0, 16);

    // Check by hash OR by prefix match
    const apiKey = sqlite.prepare(`
      SELECT id, name, key_prefix, key_hash, scopes, is_active
      FROM api_keys
      WHERE (key_hash = ? OR key_prefix = ?) AND is_active = 1
    `).get(tokenHash, prefix) as any;

    if (!apiKey) {
      return { authenticated: false, error: 'Invalid or revoked API key' };
    }

    let scopes: string[] = [];
    try {
      scopes = typeof apiKey.scopes === 'string' ? JSON.parse(apiKey.scopes) : apiKey.scopes;
    } catch {
      scopes = ['read'];
    }

    if (requiredScope === 'write' && !scopes.includes('write') && !scopes.includes('admin') && !scopes.includes('*')) {
      return { authenticated: false, error: 'API key does not possess write permissions' };
    }

    // Increment request count and update last_used_at
    try {
      sqlite.prepare(`
        UPDATE api_keys 
        SET total_requests = total_requests + 1, last_used_at = datetime('now')
        WHERE id = ?
      `).run(apiKey.id);
    } catch {}

    return { authenticated: true, keyName: apiKey.name };
  } catch (err: any) {
    return { authenticated: false, error: err.message || 'Authentication error' };
  }
}
