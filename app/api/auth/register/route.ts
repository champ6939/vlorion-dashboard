import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { createSessionCookie } from '@/lib/session';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = (await req.json()) as { email: string; password: string };

        if (!email || !password) {
            return NextResponse.json({ error: '請輸入 Email 和密碼' }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: '密碼至少需要 8 個字元' }, { status: 400 });
        }

        const db = getDb();

        // Check if any admin already exists (first-run protection)
        const existing = await db
            .prepare('SELECT COUNT(*) as count FROM admins')
            .first<{ count: number }>();

        if (existing && existing.count > 0) {
            return NextResponse.json({ error: '已有管理員帳號存在，請聯絡管理員新增成員' }, { status: 403 });
        }

        const passwordHash = await hashPassword(password);
        const id = crypto.randomUUID();

        await db
            .prepare('INSERT INTO admins (id, email, display_name, password_hash) VALUES (?, ?, ?, ?)')
            .bind(id, email.toLowerCase().trim(), email.split('@')[0], passwordHash)
            .run();

        const secret = process.env.SESSION_SECRET ?? 'dev-secret';
        const cookie = await createSessionCookie({ adminId: id, email: email.toLowerCase().trim() }, secret);

        return NextResponse.json({ success: true }, {
            headers: { 'Set-Cookie': cookie }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
