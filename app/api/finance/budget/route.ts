import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

// GET /api/finance/budget?month=YYYY-MM
export async function GET(req: NextRequest) {
    const month = req.nextUrl.searchParams.get('month');
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: 'month param required (YYYY-MM)' }, { status: 400 });
    }
    const db = getDb();
    const row = await db
        .prepare('SELECT amount FROM monthly_budget WHERE month = ?')
        .bind(month)
        .first<{ amount: number }>();
    return NextResponse.json({ month, amount: row?.amount ?? 0 });
}

// PUT /api/finance/budget  { month, amount }
export async function PUT(req: NextRequest) {
    const body = await req.json() as { month?: string; amount?: unknown };
    const { month, amount } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: 'month 格式錯誤 (YYYY-MM)' }, { status: 400 });
    }
    const num = Number(amount);
    if (!isFinite(num) || num < 0) {
        return NextResponse.json({ error: '預算必須 ≥ 0' }, { status: 400 });
    }

    const db = getDb();
    await db
        .prepare(`INSERT INTO monthly_budget (month, amount) VALUES (?, ?)
                  ON CONFLICT(month) DO UPDATE SET amount = excluded.amount`)
        .bind(month, num)
        .run();
    return NextResponse.json({ month, amount: num });
}
