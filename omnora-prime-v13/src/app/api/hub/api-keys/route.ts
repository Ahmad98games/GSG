import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/hub/api-keys
 * Returns all active API keys from master SQLite
 */
export async function GET() {
  const sqlite = getSqliteInstance();
  if (!sqlite) return NextResponse.json([], { status: 200 });

  try {
    const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='api_keys'").get();
    if (!tableExists) return NextResponse.json([], { status: 200 });

    const keys = sqlite.prepare(`
      SELECT id, name, key_prefix, scopes, total_requests, last_used_at, is_active, created_at
      FROM api_keys
      WHERE is_active = 1
      ORDER BY created_at DESC
    `).all();

    const formatted = keys.map((k: any) => ({
      ...k,
      scopes: typeof k.scopes === 'string' ? JSON.parse(k.scopes) : k.scopes
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * POST /api/hub/api-keys
 * Generates and stores a new API key into master SQLite
 */
export async function POST(req: NextRequest) {
  const sqlite = getSqliteInstance();
  if (!sqlite) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  try {
    const body = await req.json();
    const { name = 'API Client', scopes = ['read'] } = body;

    const rawToken = 'noxis_live_' + crypto.randomBytes(24).toString('hex');
    const prefix = rawToken.slice(0, 16);
    const keyHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const id = 'key_' + Date.now().toString(36);

    sqlite.prepare(`
      INSERT INTO api_keys (id, business_id, name, key_prefix, key_hash, scopes, total_requests, is_active, created_at)
      VALUES (?, 'local', ?, ?, ?, ?, 0, 1, datetime('now'))
    `).run(
      id,
      name,
      prefix,
      keyHash,
      JSON.stringify(scopes)
    );

    return NextResponse.json({
      success: true,
      raw_key: rawToken,
      key: {
        id,
        name,
        key_prefix: prefix,
        scopes,
        created_at: new Date().toISOString()
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/hub/api-keys?id=...
 * Revokes an API key
 */
export async function DELETE(req: NextRequest) {
  const sqlite = getSqliteInstance();
  if (!sqlite) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Key id required' }, { status: 400 });

  try {
    sqlite.prepare('UPDATE api_keys SET is_active = 0 WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
