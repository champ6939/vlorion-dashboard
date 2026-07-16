import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getDb } from '@/lib/db';
import { getRpConfig, CHALLENGE_TTL_SECONDS } from '@/lib/webauthn';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const db = getDb();
    const admin = await db
        .prepare('SELECT id FROM admins WHERE email = ?')
        .bind(email.toLowerCase().trim())
        .first<{ id: string }>();

    if (!admin) {
        return NextResponse.json({ error: '帳號或金鑰不正確' }, { status: 404 });
    }

    const creds = await db
        .prepare('SELECT id, transports FROM credentials WHERE admin_id = ?')
        .bind(admin.id)
        .all<{ id: string; transports: string | null }>();

    if (!creds.results?.length) {
        return NextResponse.json({ error: '這個帳號還沒有註冊任何金鑰，請先完成註冊' }, { status: 400 });
    }

    const { rpID } = getRpConfig();

    const options = await generateAuthenticationOptions({
        rpID,
        userVerification: 'required',
        allowCredentials: creds.results.map(c => ({
            id: c.id,
            transports: c.transports ? JSON.parse(c.transports) : undefined,
        })),
    });

    const challengeId = crypto.randomUUID();
    await db
        .prepare('INSERT INTO auth_challenges (id, admin_id, challenge, purpose, expires_at) VALUES (?, ?, ?, ?, ?)')
        .bind(challengeId, admin.id, options.challenge, 'login', Math.floor(Date.now() / 1000) + CHALLENGE_TTL_SECONDS)
        .run();

    return NextResponse.json({ options, challengeId });
}
