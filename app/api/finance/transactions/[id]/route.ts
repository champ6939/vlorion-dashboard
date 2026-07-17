import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

// DELETE /api/finance/transactions/[id]
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

    const db = getDb();
    const existing = await db
        .prepare('SELECT id FROM transactions WHERE id = ?')
        .bind(id)
        .first<{ id: string }>();

    if (!existing) return NextResponse.json({ error: '找不到此筆記錄' }, { status: 404 });

    await db.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();
    return NextResponse.json({ ok: true });
}
