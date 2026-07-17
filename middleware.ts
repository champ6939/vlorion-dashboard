import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from '@/lib/session';

// Only these paths require a valid session. Everything else — /f/*,
// /embed.js, /api/public/forms/* — is intentionally left untouched so
// visitors can fill out embedded forms without logging in.
export const config = {
    matcher: [
        '/',
        '/dashboard/:path*',
        '/forms/:path*',
        '/communications',
        '/api/forms/:path*',
        '/api/communications/:path*',
        // YouTube proxy routes (channel + analytics + start OAuth)
        // NOTE: /api/youtube/oauth/callback is intentionally excluded —
        //       Google redirects there without a session cookie.
        '/api/youtube/channel',
        '/api/youtube/analytics',
        '/api/youtube/oauth/start',
        // Finance routes
        '/api/finance/:path*',
    ],
};

export async function middleware(req: NextRequest) {
    const token = req.cookies.get(COOKIE_NAME)?.value;

    // process.env.SESSION_SECRET is inlined at build time for Edge middleware —
    // set it in the Cloudflare Pages/Workers dashboard as an environment variable
    // (in addition to the Worker secret used by the API routes).
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const session = await verifySession(token, secret);
    if (!session) {
        if (req.nextUrl.pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('next', req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}
