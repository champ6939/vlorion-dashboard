-- VLORION Dashboard — Email Inbox Schema
-- Run: npx wrangler d1 execute vlorion-dashboard-db --file=./schema-email.sql --remote

CREATE TABLE IF NOT EXISTS inbox (
    id TEXT PRIMARY KEY,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    date INTEGER NOT NULL,       -- Unix timestamp
    read INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_inbox_date ON inbox(date DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_read ON inbox(read);
