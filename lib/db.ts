import { getCloudflareContext } from '@opennextjs/cloudflare';

// Binding name must match wrangler.jsonc:
//   "d1_databases": [{ "binding": "DB", "database_name": "vlorion-dashboard-db", ... }]
export function getDb(): D1Database {
    const { env } = getCloudflareContext();
    return (env as unknown as { DB: D1Database }).DB;
}

export function getSessionSecret(): string {
    const { env } = getCloudflareContext();
    const secret = (env as unknown as { SESSION_SECRET?: string }).SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET is not configured. Run: npx wrangler secret put SESSION_SECRET');
    return secret;
}
