/**
 * WebAuthn relying-party configuration.
 * ------------------------------------------------------------------
 * Priority: explicit env vars → localhost defaults (dev only).
 *
 * Set these in your Cloudflare Pages / Workers dashboard
 * (or wrangler.jsonc [vars] for non-secret values):
 *
 *   RP_ID     = dashboard.vlorion.com      (bare hostname, no scheme)
 *   RP_ORIGIN = https://dashboard.vlorion.com
 *   RP_NAME   = VLORION Dashboard          (optional, cosmetic)
 *
 * Do NOT rely on NODE_ENV inside Edge middleware/routes — it is not
 * reliably set to 'production' inside Cloudflare Workers.
 * ------------------------------------------------------------------
 */

export function getRpConfig() {
    const rpID = process.env.RP_ID ?? 'localhost';
    const origin = process.env.RP_ORIGIN ?? 'http://localhost:3000';
    const rpName = process.env.RP_NAME ?? 'VLORION Dashboard';

    return { rpName, rpID, origin };
}

export const CHALLENGE_TTL_SECONDS = 5 * 60; // 5 minutes to complete the ceremony
