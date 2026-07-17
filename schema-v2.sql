-- VLORION Dashboard — Schema v2 Migration
-- Run: npx wrangler d1 execute vlorion-dashboard-db --file=./schema-v2.sql --remote

-- YouTube OAuth tokens (singleton row — always id = 'singleton')
CREATE TABLE IF NOT EXISTS youtube_tokens (
    id            TEXT PRIMARY KEY DEFAULT 'singleton',
    access_token  TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at    INTEGER NOT NULL,  -- Unix timestamp
    channel_id    TEXT              -- auto-filled after first analytics fetch
);

-- Finance: individual transactions
CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL CHECK(type IN ('income','expense')),
    category    TEXT NOT NULL,
    description TEXT NOT NULL,
    amount      REAL NOT NULL CHECK(amount > 0),
    date        TEXT NOT NULL,      -- YYYY-MM-DD
    created_at  INTEGER NOT NULL    -- Unix timestamp
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Finance: per-month budget caps
CREATE TABLE IF NOT EXISTS monthly_budget (
    month   TEXT PRIMARY KEY,       -- YYYY-MM
    amount  REAL NOT NULL CHECK(amount >= 0)
);
