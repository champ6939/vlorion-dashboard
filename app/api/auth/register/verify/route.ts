import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getDb, getSessionSecret } from '@/lib/db';
import { getRpConfig } from '@/lib/webauthn';
import { createSessionCookie } from '@/lib/session';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const { email, challengeId, response } = await req.json();
    if (!email || !challengeId || !response) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const db = getDb();
    const admin = await db
        .prepare('SELECT id, email FROM admins WHERE email = ?')
        .bind(email.toLowerCase().trim())
        .first<{ id: string; email: string }>();
    if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

    const record = await db
        .prepare('SELECT challenge, expires_at FROM auth_challenges WHERE id = ? AND admin_id = ? AND purpose = ?')
        .bind(challengeId, admin.id, 'register')
        .first<{ challenge: string; expires_at: number }>();

    if (!record || record.expires_at < Math.floor(Date.now() / 1000)) {
        return NextResponse.json({ error: '驗證逾時，請重新開始' }, { status: 400 });
    }

    const { rpID, origin } = getRpConfig();

    let verification;
    try {
        verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: record.challenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });
    } catch (err) {
        return NextResponse.json({ error: '驗證失敗', detail: String(err) }, { status: 400 });
    }

    if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json({ error: '驗證失敗' }, { status: 400 });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    await db
        .prepare(
            `INSERT INTO credentials (id, admin_id, public_key, counter, device_type, backed_up, transports)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
            credential.id,
            admin.id,
            Buffer.from(credential.publicKey).toString('base64url'),
            credential.counter,
            credentialDeviceType,
            credentialBackedUp ? 1 : 0,
            JSON.stringify(credential.transports ?? [])
        )
        .run();

    await db.prepare('DELETE FROM auth_challenges WHERE id = ?').bind(challengeId).run();

    const cookie = await createSessionCookie({ adminId: admin.id, email: admin.email }, getSessionSecret());
    const res = NextResponse.json({ verified: true });
    res.headers.set('Set-Cookie', cookie);
    return res;
}
