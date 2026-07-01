import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { NspBroadcaster } from '@/server/NspBroadcaster';
import { verifyUserSession } from '@/lib/security/authHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await verifyUserSession();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const nodeId = searchParams.get('nodeId');

  try {
    if (nodeId) {
      const messages = await db.select()
        .from(schema.meshMessages)
        .where(or(
          eq(schema.meshMessages.fromNodeId, nodeId),
          eq(schema.meshMessages.toNodeId, nodeId)
        ))
        .orderBy(schema.meshMessages.queuedAt);
      return NextResponse.json(messages);
    } else {
      // Return conversation list
      const messages = await db.select().from(schema.meshMessages);
      return NextResponse.json(messages);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await verifyUserSession();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { toNodeId, text, mediaType = 'text' } = body;

    const newMessage = {
      fromNodeId: 'hub',
      toNodeId,
      encryptedPayload: Buffer.from(text), // In production, encrypt this
      mediaType,
      status: 'queued',
    };

    const [inserted] = await db.insert(schema.meshMessages).values(newMessage as any).returning();

    // Broadcast via NSP if node is online
    NspBroadcaster.broadcastToAll({
      mesh_message: {
        message_id: inserted.messageId,
        from_id: 'hub',
        payload: text,
        media_type: mediaType,
        timestamp: Date.now()
      }
    });

    return NextResponse.json(inserted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
