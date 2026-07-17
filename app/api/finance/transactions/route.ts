import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

interface TxnRow {
    id: string; type: string; category: string;
    description: string; amount: number; date: string; created_at: number;
}

// GET /api/finance/transactions?month=YYYY-MM
export async function GET(req: NextRequest) {
    const month = req.nextUrl.searchParams.get('month');
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: 'month param required (YYYY-MM)' }, { status: 400 });
    }

    const db = getDb();
    const { results } = await db
        .prepare(`SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC, created_at DESC`)
        .bind(`${month}%`)
        .all<TxnRow>();

    return NextResponse.json(results ?? []);
}

// POST /api/finance/transactions
export async function POST(req: NextRequest) {
    const textBody = await req.text();
    const parts = textBody.split('|');
    const data: Record<string, string> = {};
    for (const part of parts) {
        const idx = part.indexOf('=');
        if (idx > -1) {
            data[part.slice(0, idx)] = part.slice(idx + 1);
        }
    }

    const { type, category, description, amount, date } = data;
    if (!type || !category || !description || !amount || !date) {
        return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
    }
    if (!['income', 'expense'].includes(type)) {
        return NextResponse.json({ error: 'type 必須是 income 或 expense' }, { status: 400 });
    }
    const num = Number(amount);
    if (!isFinite(num) || num <= 0) {
        return NextResponse.json({ error: '金額必須大於 0' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: '日期格式錯誤 (YYYY-MM-DD)' }, { status: 400 });
    }

    const db = getDb();
    const id = crypto.randomUUID();
    await db
        .prepare(`INSERT INTO transactions (id, type, category, description, amount, date, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, type, category, String(description).slice(0, 200), num, date, Math.floor(Date.now() / 1000))
        .run();

    return NextResponse.json({ id }, { status: 201 });
}
