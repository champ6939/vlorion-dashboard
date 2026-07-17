-- VLORION Dashboard — Communications Schema
-- Run: npx wrangler d1 execute vlorion-dashboard-db --file=./schema-communications.sql --remote

-- Chat messages (per-room)
CREATE TABLE IF NOT EXISTS chat_messages (
    id         TEXT PRIMARY KEY,
    room_id    TEXT NOT NULL DEFAULT 'general',
    sender     TEXT NOT NULL,
    body       TEXT NOT NULL,
    sent_at    INTEGER NOT NULL  -- Unix timestamp (ms)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, sent_at);

-- WebRTC signaling exchange
CREATE TABLE IF NOT EXISTS rtc_signals (
    id          TEXT PRIMARY KEY,
    room_id     TEXT NOT NULL,
    from_peer   TEXT NOT NULL,
    to_peer     TEXT NOT NULL,
    type        TEXT NOT NULL,  -- 'offer' | 'answer' | 'ice'
    payload     TEXT NOT NULL,
    created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rtc_signals_room ON rtc_signals(room_id, created_at);
