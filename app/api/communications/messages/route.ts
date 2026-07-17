import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

// GET: Poll for new messages since a timestamp
export async function GET(req: NextRequest) {

    const { searchParams } = new URL(req.url);
    const since = parseInt(searchParams.get('since') || '0', 10);
    const roomId = searchParams.get('room') || 'general';

    const db = getDb();
    const result = await db
        .prepare('SELECT id, sender, body, sent_at FROM chat_messages WHERE room_id = ? AND sent_at > ? ORDER BY sent_at ASC LIMIT 100')
        .bind(roomId, since)
        .all();

    return NextResponse.json({ messages: result.results || [] });
}

// POST: Send a message
export async function POST(req: NextRequest) {

    const { body, room = 'general', sender } = (await req.json()) as { body: string; room?: string; sender: string };
    if (!body?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const db = getDb();
    const id = crypto.randomUUID();
    const sentAt = Date.now();

    await db
        .prepare('INSERT INTO chat_messages (id, room_id, sender, body, sent_at) VALUES (?, ?, ?, ?, ?)')
        .bind(id, room, sender, body.trim(), sentAt)
        .run();

    return NextResponse.json({ success: true, id, sent_at: sentAt });
}
