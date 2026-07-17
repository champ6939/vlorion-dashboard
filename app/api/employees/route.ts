import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

// GET: 取得所有管理員清單
export async function GET(_req: NextRequest) {
    const db = getDb();
    
    // 取得 admins 列表，並 Join credentials 算有幾個綁定的裝置
    const query = `
        SELECT a.id, a.email, a.created_at, COUNT(c.id) as device_count
        FROM admins a
        LEFT JOIN credentials c ON a.id = c.admin_id
        GROUP BY a.id
        ORDER BY a.created_at DESC
    `;
    const result = await db.prepare(query).all();

    return NextResponse.json(result.results || []);
}

// POST: 新增管理員
export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as any;
        const email = body.email?.trim().toLowerCase();

        if (!email) {
            return NextResponse.json({ error: '請輸入有效的 Email' }, { status: 400 });
        }

        const db = getDb();
        
        // 檢查是否已存在
        const existing = await db.prepare('SELECT id FROM admins WHERE email = ?').bind(email).first();
        if (existing) {
            return NextResponse.json({ error: '此 Email 已經是管理員了' }, { status: 400 });
        }

        const id = crypto.randomUUID();
        await db.prepare('INSERT INTO admins (id, email, created_at) VALUES (?, ?, ?)')
            .bind(id, email, Math.floor(Date.now() / 1000))
            .run();

        return NextResponse.json({ success: true, id, email });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE: 移除管理員
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return NextResponse.json({ error: 'Missing admin id' }, { status: 400 });
        }

        const db = getDb();
        
        // SQLite 的 ON DELETE CASCADE 會自動連帶刪除 credentials 與 auth_challenges
        await db.prepare('DELETE FROM admins WHERE id = ?').bind(id).run();

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
