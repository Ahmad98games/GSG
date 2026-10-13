import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { deliverMessageToDevice, broadcastToAllDevices } from '@/lib/mobile-bridge/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id') || 'local';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const sqlite = (db as any).$client;
    if (sqlite) {
      try {
        const rows = sqlite.prepare(`
          SELECT * FROM hub_messages 
          WHERE business_id = ? OR ? = 'local' OR ? = '' OR business_id IS NULL
          ORDER BY created_at DESC 
          LIMIT ?
        `).all(businessId, businessId, businessId, limit);
        return NextResponse.json(rows || []);
      } catch (dbErr: any) {
        console.warn('[API Messaging] SQLite select warning:', dbErr.message);
      }
    }

    return NextResponse.json([]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId = 'local',
      text,
      recipientType = 'all',
      recipientDeviceId = null,
      recipientRole = null,
      priority = 'normal',
    } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const msgId = randomUUID();
    const createdAtStr = new Date().toISOString();
    const messageRecord = {
      id: msgId,
      business_id: businessId,
      sender_type: 'hub',
      sender_device_id: null,
      sender_name: 'PC Hub',
      recipient_type: recipientType,
      recipient_device_id: recipientDeviceId,
      recipient_role: recipientRole,
      message_text: text.trim(),
      message_type: 'text',
      priority,
      is_read: 0,
      created_at: createdAtStr,
    };

    const sqlite = (db as any).$client;
    if (sqlite) {
      try {
        sqlite.prepare(`
          INSERT OR REPLACE INTO hub_messages (id, business_id, sender_type, sender_device_id, sender_name, recipient_type, recipient_device_id, recipient_role, message_text, message_type, priority, is_read, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          messageRecord.id,
          messageRecord.business_id,
          messageRecord.sender_type,
          messageRecord.sender_device_id,
          messageRecord.sender_name,
          messageRecord.recipient_type,
          messageRecord.recipient_device_id,
          messageRecord.recipient_role,
          messageRecord.message_text,
          messageRecord.message_type,
          messageRecord.priority,
          messageRecord.is_read,
          messageRecord.created_at
        );
      } catch (insertErr: any) {
        console.warn('[API Messaging] SQLite insert warning:', insertErr.message);
      }
    }

    const messagePayload = {
      id: msgId,
      text: text.trim(),
      senderName: 'PC Hub',
      priority,
      createdAt: createdAtStr,
    };

    if (recipientType === 'all' || !recipientDeviceId) {
      broadcastToAllDevices(messagePayload);
    } else {
      deliverMessageToDevice(recipientDeviceId, messagePayload);
    }

    return NextResponse.json({ success: true, message: messageRecord });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
