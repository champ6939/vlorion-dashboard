import { getDb, getGoogleOAuthConfig } from './db';

interface TokenRow { access_token: string; refresh_token: string; expires_at: number; channel_id: string | null }

export async function getValidYoutubeToken(): Promise<string | null> {
    const db = getDb();
    const { clientId, clientSecret } = getGoogleOAuthConfig();

    if (!clientId || !clientSecret) return null;

    const row = await db.prepare('SELECT * FROM youtube_tokens WHERE id = ?').bind('singleton').first<TokenRow>();
    if (!row) return null;

    // Refresh if expiring within 2 minutes
    if (row.expires_at < Math.floor(Date.now() / 1000) + 120) {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: row.refresh_token,
                grant_type: 'refresh_token',
            }),
        });
        if (!res.ok) return null;
        const data = await res.json() as { access_token: string; expires_in: number };
        const newExpires = Math.floor(Date.now() / 1000) + data.expires_in;
        await db.prepare('UPDATE youtube_tokens SET access_token = ?, expires_at = ? WHERE id = ?')
            .bind(data.access_token, newExpires, 'singleton').run();
        return data.access_token;
    }

    return row.access_token;
}
