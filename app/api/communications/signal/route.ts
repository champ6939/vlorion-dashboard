import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

// GET: Poll for signals addressed to me
export async function GET(req: NextRequest) {

    const { searchParams } = new URL(req.url);
    const toPeer = searchParams.get('peer');
    const roomId = searchParams.get('room') || 'general';
    const since = parseInt(searchParams.get('since') || '0', 10);

    if (!toPeer) return NextResponse.json({ error: 'peer required' }, { status: 400 });

    const db = getDb();
    const result = await db
        .prepare('SELECT id, from_peer, type, payload FROM rtc_signals WHERE room_id = ? AND to_peer = ? AND created_at > ? ORDER BY created_at ASC')
        .bind(roomId, toPeer, since)
        .all();

    // Clean up consumed signals
    if (result.results && result.results.length > 0) {
        const ids = (result.results as any[]).map((r: any) => `'${r.id}'`).join(',');
        await db.prepare(`DELETE FROM rtc_signals WHERE id IN (${ids})`).run();
    }

    return NextResponse.json({ signals: result.results || [] });
}

// POST: Send a signal
export async function POST(req: NextRequest) {

    const { roomId = 'general', fromPeer, toPeer, type, payload } = (await req.json()) as {
        roomId?: string;
        fromPeer: string;
        toPeer: string;
        type: 'offer' | 'answer' | 'ice';
        payload: any;
    };

    if (!fromPeer || !toPeer || !type || !payload) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();
    await db
        .prepare('INSERT INTO rtc_signals (id, room_id, from_peer, to_peer, type, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), roomId, fromPeer, toPeer, type, JSON.stringify(payload), Date.now())
        .run();

    return NextResponse.json({ success: true });
}
