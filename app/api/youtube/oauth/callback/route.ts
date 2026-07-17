import { NextRequest, NextResponse } from 'next/server';
import { getDb, getGoogleOAuthConfig } from '@/lib/db';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const code  = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error || !code) {
        const dest = new URL('/', url.origin);
        dest.searchParams.set('yt_oauth', 'cancelled');
        return NextResponse.redirect(dest);
    }

    const { clientId, clientSecret } = getGoogleOAuthConfig();
    const redirectUri = `${url.origin}/api/youtube/oauth/callback`;

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }),
    });

    if (!tokenRes.ok) {
        const dest = new URL('/', url.origin);
        dest.searchParams.set('yt_oauth', 'error');
        return NextResponse.redirect(dest);
    }

    const tokens = await tokenRes.json() as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
    };

    if (!tokens.refresh_token) {
        // refresh_token only issued on first consent — user may need to re-authorize
        const dest = new URL('/', url.origin);
        dest.searchParams.set('yt_oauth', 'no_refresh_token');
        return NextResponse.redirect(dest);
    }

    const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;

    const db = getDb();
    await db.prepare(`
        INSERT INTO youtube_tokens (id, access_token, refresh_token, expires_at)
        VALUES ('singleton', ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            access_token  = excluded.access_token,
            refresh_token = excluded.refresh_token,
            expires_at    = excluded.expires_at
    `).bind(tokens.access_token, tokens.refresh_token, expiresAt).run();

    const dest = new URL('/', url.origin);
    dest.searchParams.set('yt_oauth', 'success');
    return NextResponse.redirect(dest);
}
