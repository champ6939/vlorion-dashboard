/**
 * WebAuthn relying-party configuration.
 * ------------------------------------------------------------------
 * rpID must be the bare hostname (no scheme/port) and must match the
 * domain the dashboard is served from. Locally this is "localhost";
 * in production it's "dashboard.vlorion.com".
 * ------------------------------------------------------------------
 */

export function getRpConfig() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        rpName: 'VLORION Dashboard',
        rpID: isProd ? 'dashboard.vlorion.com' : 'localhost',
        origin: isProd ? 'https://dashboard.vlorion.com' : 'http://localhost:3000',
    };
}

export const CHALLENGE_TTL_SECONDS = 5 * 60; // 5 minutes to complete the ceremony
