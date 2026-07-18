import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSessionCookie } from '@/lib/session';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = (await req.json()) as { email: string; password: string };

        if (!email || !password) {
            return NextResponse.json({ error: '請輸入 Email 和密碼' }, { status: 400 });
        }

        const db = getDb();
        const admin = await db
            .prepare('SELECT id, email, password_hash FROM admins WHERE email = ?')
            .bind(email.toLowerCase().trim())
            .first<{ id: string; email: string; password_hash: string | null }>();

        if (!admin || !admin.password_hash) {
            return NextResponse.json({ error: 'Email 或密碼錯誤' }, { status: 401 });
        }

        const valid = await verifyPassword(password, admin.password_hash);
        if (!valid) {
            return NextResponse.json({ error: 'Email 或密碼錯誤' }, { status: 401 });
        }

        const secret = process.env.SESSION_SECRET ?? 'dev-secret';
        const cookie = await createSessionCookie({ adminId: admin.id, email: admin.email }, secret);

        return NextResponse.json({ success: true }, {
            headers: { 'Set-Cookie': cookie }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
