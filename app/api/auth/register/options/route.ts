import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
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
        .prepare('SELECT id, email FROM admins WHERE email = ?')
        .bind(email.toLowerCase().trim())
        .first<{ id: string; email: string }>();

    // Deliberately vague error — don't reveal whether an email exists.
    if (!admin) {
        return NextResponse.json({ error: '此帳號尚未被加入管理員名單' }, { status: 404 });
    }

    const existingCreds = await db
        .prepare('SELECT id, transports FROM credentials WHERE admin_id = ?')
        .bind(admin.id)
        .all<{ id: string; transports: string | null }>();

    const { rpName, rpID } = getRpConfig();

    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: admin.email,
        attestationType: 'none',
        excludeCredentials: (existingCreds.results ?? []).map(c => ({
            id: c.id,
            transports: c.transports ? JSON.parse(c.transports) : undefined,
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'required', // forces PIN/biometric/fingerprint, not just "tap"
        },
    });

    const challengeId = crypto.randomUUID();
    await db
        .prepare('INSERT INTO auth_challenges (id, admin_id, challenge, purpose, expires_at) VALUES (?, ?, ?, ?, ?)')
        .bind(challengeId, admin.id, options.challenge, 'register', Math.floor(Date.now() / 1000) + CHALLENGE_TTL_SECONDS)
        .run();

    return NextResponse.json({ options, challengeId });
}
