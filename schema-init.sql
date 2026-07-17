-- VLORION Dashboard — Full Schema Init
-- Run: npx wrangler d1 execute vlorion-dashboard-db --file=./schema-init.sql --remote

-- ── Auth: admin accounts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
    id         TEXT PRIMARY KEY,   -- UUID
    email      TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ── Auth: WebAuthn credentials ──────────────────────────────────
CREATE TABLE IF NOT EXISTS credentials (
    id           TEXT PRIMARY KEY,         -- base64url credential ID
    admin_id     TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    public_key   TEXT NOT NULL,            -- base64url-encoded COSE key
    counter      INTEGER NOT NULL DEFAULT 0,
    transports   TEXT,                     -- JSON array e.g. '["internal"]'
    created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_credentials_admin ON credentials(admin_id);

-- ── Auth: WebAuthn challenges (short-lived) ──────────────────────
CREATE TABLE IF NOT EXISTS auth_challenges (
    id         TEXT PRIMARY KEY,           -- UUID
    admin_id   TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    challenge  TEXT NOT NULL,
    purpose    TEXT NOT NULL CHECK(purpose IN ('register','login')),
    expires_at INTEGER NOT NULL            -- Unix timestamp
);

CREATE INDEX IF NOT EXISTS idx_challenges_admin ON auth_challenges(admin_id);

-- ── YouTube OAuth tokens (singleton) ────────────────────────────
CREATE TABLE IF NOT EXISTS youtube_tokens (
    id            TEXT PRIMARY KEY DEFAULT 'singleton',
    access_token  TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at    INTEGER NOT NULL,
    channel_id    TEXT
);

-- ── Finance: transactions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL CHECK(type IN ('income','expense')),
    category    TEXT NOT NULL,
    description TEXT NOT NULL,
    amount      REAL NOT NULL CHECK(amount > 0),
    date        TEXT NOT NULL,      -- YYYY-MM-DD
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- ── Finance: monthly budget ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_budget (
    month   TEXT PRIMARY KEY,       -- YYYY-MM
    amount  REAL NOT NULL CHECK(amount >= 0)
);
