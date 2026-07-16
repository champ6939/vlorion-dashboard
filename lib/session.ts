/**
 * Session cookie helpers.
 * ------------------------------------------------------------------
 * After a successful WebAuthn login we issue a signed, httpOnly JWT
 * cookie (no password, no server-side session store needed). The
 * secret lives in SESSION_SECRET (a Worker secret — set it with
 * `npx wrangler secret put SESSION_SECRET`, never commit it).
 * ------------------------------------------------------------------
 */

import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'vlorion_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export interface SessionPayload {
    adminId: string;
    email: string;
}

function getSecretKey(secret: string) {
    return new TextEncoder().encode(secret);
}

export async function createSessionCookie(payload: SessionPayload, secret: string) {
    const jwt = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
        .sign(getSecretKey(secret));

    const isProd = process.env.NODE_ENV === 'production';
    return [
        `${COOKIE_NAME}=${jwt}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        isProd ? 'Secure' : '',
        `Max-Age=${SESSION_TTL_SECONDS}`,
    ].filter(Boolean).join('; ');
}

export function clearSessionCookie() {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export async function verifySession(token: string | undefined, secret: string): Promise<SessionPayload | null> {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, getSecretKey(secret));
        if (typeof payload.adminId !== 'string' || typeof payload.email !== 'string') return null;
        return { adminId: payload.adminId, email: payload.email };
    } catch {
        return null; // expired, tampered, or malformed — treat as logged out
    }
}

export { COOKIE_NAME };
