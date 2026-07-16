import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
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

    const challengeRow = await db
        .prepare('SELECT challenge, expires_at FROM auth_challenges WHERE id = ? AND admin_id = ? AND purpose = ?')
        .bind(challengeId, admin.id, 'login')
        .first<{ challenge: string; expires_at: number }>();

    if (!challengeRow || challengeRow.expires_at < Math.floor(Date.now() / 1000)) {
        return NextResponse.json({ error: '驗證逾時，請重新開始' }, { status: 400 });
    }

    const credRow = await db
        .prepare('SELECT id, public_key, counter, transports FROM credentials WHERE id = ? AND admin_id = ?')
        .bind(response.id, admin.id)
        .first<{ id: string; public_key: string; counter: number; transports: string | null }>();

    if (!credRow) return NextResponse.json({ error: '找不到這把金鑰' }, { status: 400 });

    const { rpID, origin } = getRpConfig();

    let verification;
    try {
        verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge: challengeRow.challenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential: {
                id: credRow.id,
                publicKey: Buffer.from(credRow.public_key, 'base64url'),
                counter: credRow.counter,
                transports: credRow.transports ? JSON.parse(credRow.transports) : undefined,
            },
        });
    } catch (err) {
        return NextResponse.json({ error: '驗證失敗', detail: String(err) }, { status: 400 });
    }

    if (!verification.verified) {
        return NextResponse.json({ error: '驗證失敗' }, { status: 400 });
    }

    // Update the stored counter to guard against cloned-authenticator replay attacks.
    await db
        .prepare('UPDATE credentials SET counter = ? WHERE id = ?')
        .bind(verification.authenticationInfo.newCounter, credRow.id)
        .run();
    await db.prepare('DELETE FROM auth_challenges WHERE id = ?').bind(challengeId).run();

    const cookie = await createSessionCookie({ adminId: admin.id, email: admin.email }, getSessionSecret());
    const res = NextResponse.json({ verified: true });
    res.headers.set('Set-Cookie', cookie);
    return res;
}
