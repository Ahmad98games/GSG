import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { verifyUserSession } from '@/lib/security/authHelpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hub/security-alerts
 * Returns the most recent security events, blocked unauthorized attempts,
 * tier limit overflow rejections, and quarantined device attempts.
 */
export async function GET() {
  const auth = await verifyUserSession();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const alerts = await db
      .select()
      .from(schema.securityAudit)
      .orderBy(desc(schema.securityAudit.createdAt))
      .limit(20);

    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error('[API] Failed to fetch security alerts:', error.message);
    return NextResponse.json([]);
  }
}
