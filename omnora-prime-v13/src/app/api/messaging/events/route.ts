import { NextRequest } from 'next/server';
import { NspBroadcaster } from '@/server/NspBroadcaster';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const onMessage = (msg: unknown) => {
        const data = JSON.stringify(msg);
        controller.enqueue(encoder.encode(`event: new_message\ndata: ${data}\n\n`));
      };

      NspBroadcaster.events.on('new_message', onMessage);

      // Keep connection alive
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 30000);

      req.signal.onabort = () => {
        clearInterval(interval);
        NspBroadcaster.events.off('new_message', onMessage);
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
