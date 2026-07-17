import { getCloudflareContext } from '@opennextjs/cloudflare';

// Binding name must match wrangler.jsonc:
//   "d1_databases": [{ "binding": "DB", "database_name": "vlorion-dashboard-db", ... }]

interface CloudflareEnv {
    DB: D1Database;
    SESSION_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
}

function getEnv(): CloudflareEnv {
    const { env } = getCloudflareContext();
    return env as unknown as CloudflareEnv;
}

export function getDb(): D1Database {
    return getEnv().DB;
}

export function getSessionSecret(): string {
    const secret = getEnv().SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET is not configured. Run: npx wrangler secret put SESSION_SECRET');
    return secret;
}



export function getGoogleOAuthConfig(): { clientId: string; clientSecret: string } {
    const env = getEnv();
    return {
        clientId: env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
    };
}
