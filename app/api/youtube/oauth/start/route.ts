import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthConfig } from '@/lib/db';

export const runtime = 'edge';

const SCOPES = [
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.upload',
].join(' ');

export async function GET(req: NextRequest) {
    const { clientId } = getGoogleOAuthConfig();
    if (!clientId) {
        return NextResponse.json({ error: 'GOOGLE_CLIENT_ID 未設定' }, { status: 503 });
    }

    const redirectUri = `${new URL(req.url).origin}/api/youtube/oauth/callback`;

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: SCOPES,
        access_type: 'offline',
        prompt: 'consent',  // force refresh_token to be issued every time
    });

    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
